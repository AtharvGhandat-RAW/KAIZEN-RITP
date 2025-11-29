import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, AlertCircle, CheckCircle2, Upload, Loader2, Skull, Flame, Ghost, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// UUID fallback for browsers that don't support crypto.randomUUID
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const registrationSchema = z.object({
  eventId: z.string().min(1, "Please select an event"),
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100).regex(/^[a-zA-Z\s]+$/, "Name should only contain letters"),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  college: z.string().trim().min(2, "College name required").max(200),
  year: z.string().min(1, "Please select your year"),
  branch: z.string().trim().min(2, "Branch required").max(100),
  educationType: z.string().min(1, "Please select your education type"),
  teamName: z.string().trim().max(100).optional().or(z.literal("")),
  declaration: z.boolean().refine(val => val === true, "You must agree to the terms"),
});

interface RegistrationPageProps {
  onClose: () => void;
  initialEventId?: string;
}

interface Event {
  id: string;
  name: string;
  category: string;
  registration_fee: number;
  event_type: string;
  upi_qr_url?: string;
}

interface RegistrationSettings {
  registration_enabled: boolean;
  registration_notice: string;
}

export function RegistrationPage({ onClose, initialEventId }: RegistrationPageProps) {
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [registrationSettings, setRegistrationSettings] = useState<RegistrationSettings>({
    registration_enabled: true,
    registration_notice: ''
  });
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    college: '',
    year: '',
    branch: '',
    educationType: '',
    eventId: initialEventId || '',
    teamName: '',
    declaration: false,
    paymentProof: null as File | null,
  });

  const fetchRegistrationSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['registration_enabled', 'registration_notice']);

      if (error) throw error;

      if (data) {
        const settingsMap: Record<string, unknown> = {};
        data.forEach((s: { key: string; value: string }) => {
          try {
            settingsMap[s.key] = JSON.parse(String(s.value));
          } catch {
            settingsMap[s.key] = s.value;
          }
        });
        setRegistrationSettings({
          registration_enabled: settingsMap.registration_enabled !== false,
          registration_notice: String(settingsMap.registration_notice || '').replace(/"/g, '')
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, category, registration_fee, event_type, upi_qr_url')
        .in('status', ['upcoming', 'ongoing'])
        .order('event_date');

      if (error) throw error;

      setEvents(data || []);
      if (!data || data.length === 0) {
        setError('No events available at the moment.');
      }
    } catch (err: unknown) {
      console.error('Exception fetching events:', err);
      setError('Failed to load events. Please check your connection and try again.');
      toast.error('Failed to load events');
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchRegistrationSettings();

    const params = new URLSearchParams(window.location.search);
    const eventIdParam = params.get('event');
    if (eventIdParam) {
      setFormData(prev => ({ ...prev, eventId: eventIdParam }));
    }

    // Real-time subscription for events
    const channel = supabase
      .channel('public:events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEvents, fetchRegistrationSettings]);

  const selectedEvent = useMemo(() => events.find(e => e.id === formData.eventId), [events, formData.eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      registrationSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
        return;
      }
    }

    if (selectedEvent && selectedEvent.registration_fee > 0 && !formData.paymentProof) {
      toast.error('Payment proof required');
      return;
    }

    setLoading(true);

    try {
      // Check if user already registered for this event
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.email)
        .maybeSingle();

      if (existingProfile) {
        // Check if already registered for this specific event
        const { data: existingReg } = await supabase
          .from('registrations')
          .select('id, payment_status')
          .eq('profile_id', existingProfile.id)
          .eq('event_id', formData.eventId)
          .maybeSingle();

        if (existingReg) {
          // Allow re-registration if previous was rejected or failed
          if (existingReg.payment_status === 'rejected') {
            // Delete old registration to allow fresh one
            await supabase
              .from('registrations')
              .delete()
              .eq('id', existingReg.id);
          } else {
            // Already registered with pending/completed status
            const statusMsg = existingReg.payment_status === 'completed' 
              ? 'You are already registered for this event!' 
              : 'You have a pending registration for this event. Please wait for payment verification.';
            toast.info(statusMsg);
            setError(statusMsg);
            setLoading(false);
            return;
          }
        }
      }

      let paymentProofUrl = null;

      if (formData.paymentProof) {
        setUploading(true);
        const fileExt = formData.paymentProof.name.split('.').pop();
        const fileName = `${generateUUID()}.${fileExt}`;
        const filePath = `payment-proofs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('event-payments')
          .upload(filePath, formData.paymentProof);

        if (uploadError) {
          console.error('Payment proof upload error:', uploadError);
          toast.error('Failed to upload payment proof. We will still save your registration.', {
            description: 'Please keep your UPI reference ID safe and contact the coordinators if needed.',
          });
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('event-payments')
            .getPublicUrl(filePath);

          paymentProofUrl = publicUrl;
        }
        setUploading(false);
      }

      // Check for existing profile (reuse from earlier check)
      let profileId: string;
      const profileEmail = formData.email.toLowerCase().trim();

      // Re-fetch profile to ensure we have latest data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', profileEmail)
        .maybeSingle();

      if (profileData) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.fullName,
            phone: formData.phone,
            college: formData.college,
            year: formData.year,
            branch: formData.branch,
          })
          .eq('id', profileData.id);

        if (updateError) {
          console.error('Profile update error:', updateError);
          throw new Error('Failed to update your profile. Please try again.');
        }
        profileId = profileData.id;
      } else {
        // Create new profile
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            // user_id is optional for public registrations
            full_name: formData.fullName,
            email: profileEmail,
            phone: formData.phone,
            college: formData.college,
            year: formData.year,
            branch: formData.branch,
          })
          .select('id')
          .single();

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Check if it's a duplicate email error
          if (profileError.code === '23505') {
            throw new Error('An account with this email already exists. Please use a different email or try again.');
          }
          throw new Error('Failed to create your profile. Please try again.');
        }
        profileId = newProfile.id;
      }

      const registrationType = selectedEvent?.event_type === 'team' ? 'team' : 'solo';

      let teamId = null;
      if (registrationType === 'team' && formData.teamName) {
        const { data: team, error: teamError } = await supabase
          .from('teams')
          .insert({
            name: formData.teamName,
            event_id: formData.eventId,
            leader_id: profileId,
          })
          .select('id')
          .single();

        if (teamError) throw teamError;
        teamId = team.id;
      }

      const { error: regError } = await supabase
        .from('registrations')
        .insert({
          profile_id: profileId,
          event_id: formData.eventId,
          team_id: teamId,
          registration_type: registrationType,
          payment_status: selectedEvent?.registration_fee === 0 ? 'completed' : 'pending',
          payment_proof_url: paymentProofUrl,
        });

      if (regError) throw regError;

      // Send confirmation email
      try {
        await supabase.functions.invoke('send-registration-email', {
          body: {
            to: formData.email,
            type: 'registration_confirmation',
            data: {
              name: formData.fullName,
              eventName: selectedEvent?.name || 'Event',
            }
          }
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't block success state if email fails
      }

      setSuccess(true);
      toast.success('Registration Successful!', {
        description: selectedEvent?.registration_fee === 0
          ? 'You are now registered!'
          : 'Registration complete! Payment pending verification.',
      });
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const err = error as { message?: string; error_description?: string };
      const errorMessage = err?.message || err?.error_description || 'Registration failed. Please try again.';
      setError(errorMessage);
      toast.error('Registration Failed', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleChange = (name: string, value: string) => {
    if (name === 'declaration') {
      setFormData(prev => ({ ...prev, [name]: value === 'true' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl h-full max-h-[90vh] flex flex-col bg-gradient-to-br from-zinc-900 via-black to-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header - Horror Theme */}
        <div className="flex items-center justify-between p-6 border-b border-red-900/30 bg-gradient-to-r from-black via-red-950/20 to-black backdrop-blur-xl sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/20 rounded-xl border border-red-600/40 shadow-lg shadow-red-900/30 animate-pulse">
              <Skull className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-100 tracking-wide flex items-center gap-2">
                Enter The Upside Down
                <Ghost className="w-4 h-4 text-red-400 animate-bounce" />
              </h2>
              <p className="text-xs text-red-400/60">Dare to register... if you survive</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 w-full overflow-y-auto custom-scrollbar">
          <div className="p-6 sm:p-8">
            {success ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
                  <div className="relative rounded-full bg-gradient-to-b from-green-500/20 to-green-500/5 p-6 ring-1 ring-green-500/50">
                    <CheckCircle2 className="w-16 h-16 text-green-500" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-white tracking-tight">
                    Registration Complete
                  </h2>
                  <p className="text-zinc-400 max-w-md mx-auto">
                    {selectedEvent?.registration_fee === 0
                      ? 'You have successfully registered for the event.'
                      : 'Your registration has been submitted. Payment verification is pending.'}
                  </p>
                </div>
                <div className="p-4 bg-green-500/5 border border-green-500/10 rounded-lg max-w-sm w-full text-center">
                  <p className="text-sm text-green-400/80">
                    A confirmation email has been sent to your inbox.
                  </p>
                </div>
                <Button
                  onClick={onClose}
                  className="bg-white text-black hover:bg-zinc-200 px-8 py-6 text-lg rounded-full font-medium transition-all hover:scale-105"
                >
                  Return to Events
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {registrationSettings.registration_notice && (
                  <Alert className="bg-yellow-500/5 border-yellow-500/20 text-yellow-200">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <AlertTitle className="text-yellow-500">Notice</AlertTitle>
                    <AlertDescription className="text-yellow-200/80">
                      {registrationSettings.registration_notice}
                    </AlertDescription>
                  </Alert>
                )}

                {!registrationSettings.registration_enabled ? (
                  <div className="text-center py-20 space-y-6">
                    <div className="text-6xl mb-4 opacity-50">🚫</div>
                    <h2 className="text-2xl font-bold text-white">Registration Closed</h2>
                    <p className="text-zinc-400">Registration is currently not available. Please check back later.</p>
                    <Button onClick={onClose} variant="outline" className="border-white/10 text-white hover:bg-white/5">
                      Close
                    </Button>
                  </div>
                ) : (
                  <>
                    {error && (
                      <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-200">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                      {loadingEvents ? (
                        <div className="space-y-6">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2">
                              <Skeleton className="h-4 w-24 bg-white/5" />
                              <Skeleton className="h-12 w-full bg-white/5 rounded-lg" />
                            </div>
                          ))}
                        </div>
                      ) : events.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-zinc-400">No events available at the moment.</p>
                        </div>
                      ) : (
                        <div className="grid gap-6">
                          {/* Event Selection Section - Horror Theme */}
                          <div className="space-y-4 p-6 bg-gradient-to-br from-red-950/20 via-black to-red-950/10 border border-red-900/40 rounded-xl shadow-lg shadow-red-900/10 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyMjAsIDM4LCAzOCwgMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50" />
                            <h3 className="text-lg font-semibold text-red-100 flex items-center gap-2 relative">
                              <Flame className="w-5 h-5 text-red-500 animate-pulse" />
                              Choose Your Fate
                            </h3>

                            <div className="space-y-3 relative">
                              <Label className="text-red-300/80 text-sm font-medium">Select Event <span className="text-red-500">*</span></Label>
                              <Select value={formData.eventId} onValueChange={(value) => handleChange('eventId', value)}>
                                <SelectTrigger className="bg-black/60 border-red-800/50 text-white h-14 focus:ring-red-500/50 focus:border-red-500 hover:border-red-600/60 transition-all duration-300 hover:bg-black/80">
                                  <SelectValue placeholder="⚡ Click to choose an event..." />
                                </SelectTrigger>
                                <SelectContent
                                  className="bg-zinc-950 border-red-800/60 text-white max-h-[350px] shadow-2xl shadow-red-900/40"
                                  position="popper"
                                  sideOffset={8}
                                >
                                  {events.length === 0 ? (
                                    <div className="p-4 text-center text-zinc-500">
                                      <Ghost className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                      <p>No events available</p>
                                    </div>
                                  ) : (
                                    events.map((event) => (
                                      <SelectItem
                                        key={event.id}
                                        value={event.id}
                                        className="focus:bg-red-900/30 hover:bg-red-900/20 cursor-pointer py-4 px-3 border-b border-red-900/20 last:border-0 transition-colors"
                                      >
                                        <div className="flex flex-col gap-1.5 w-full">
                                          <span className="font-semibold text-red-100 text-base">{event.name}</span>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs px-2.5 py-1 rounded-full bg-red-900/40 text-red-300 border border-red-800/50">
                                              {event.category}
                                            </span>
                                            <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800/60 text-zinc-300 border border-zinc-700/50">
                                              {event.event_type === 'team' ? '👥 Team' : '👤 Solo'}
                                            </span>
                                            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${event.registration_fee > 0
                                                ? 'bg-orange-900/30 text-orange-300 border-orange-700/50'
                                                : 'bg-green-900/30 text-green-300 border-green-700/50'
                                              }`}>
                                              {event.registration_fee > 0 ? `₹${event.registration_fee}` : '✨ Free'}
                                            </span>
                                          </div>
                                        </div>
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              {events.length > 0 && (
                                <p className="text-xs text-red-400/50 flex items-center gap-1">
                                  <Zap className="w-3 h-3" /> {events.length} event{events.length > 1 ? 's' : ''} available
                                </p>
                              )}
                            </div>

                            {selectedEvent?.event_type === 'team' && (
                              <div className="space-y-2 animate-in slide-in-from-top-2">
                                <Label className="text-zinc-400">Team Name</Label>
                                <Input
                                  value={formData.teamName}
                                  onChange={(e) => handleChange('teamName', e.target.value)}
                                  required
                                  className="bg-black/40 border-white/10 text-white h-12 focus:border-red-500/50 focus:ring-red-500/20"
                                  placeholder="Enter your team name"
                                />
                              </div>
                            )}
                          </div>

                          {/* Personal Details Section - Horror Theme */}
                          <div className="space-y-4 p-6 bg-gradient-to-br from-zinc-900/80 via-black to-zinc-900/50 border border-zinc-800/60 rounded-xl shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-3xl" />
                            <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2 relative">
                              <span className="w-1.5 h-6 bg-gradient-to-b from-red-500 to-red-700 rounded-full" />
                              Your Identity
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-zinc-400">Full Name</Label>
                                <Input
                                  value={formData.fullName}
                                  onChange={(e) => handleChange('fullName', e.target.value)}
                                  required
                                  className="bg-black/40 border-white/10 text-white h-12 focus:border-blue-500/50 focus:ring-blue-500/20"
                                  placeholder="John Doe"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-zinc-400">Phone Number</Label>
                                <Input
                                  type="tel"
                                  value={formData.phone}
                                  onChange={(e) => handleChange('phone', e.target.value)}
                                  required
                                  className="bg-black/40 border-white/10 text-white h-12 focus:border-blue-500/50 focus:ring-blue-500/20"
                                  placeholder="10-digit mobile number"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-zinc-400">Email Address</Label>
                              <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                required
                                className="bg-black/40 border-white/10 text-white h-12 focus:border-blue-500/50 focus:ring-blue-500/20"
                                placeholder="john@example.com"
                              />
                            </div>
                          </div>

                          {/* Academic Details Section - Horror Theme */}
                          <div className="space-y-4 p-6 bg-gradient-to-br from-purple-950/20 via-black to-purple-950/10 border border-purple-900/30 rounded-xl shadow-lg relative overflow-hidden">
                            <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-600/5 rounded-full blur-3xl" />
                            <h3 className="text-lg font-semibold text-purple-100 flex items-center gap-2 relative">
                              <span className="w-1.5 h-6 bg-gradient-to-b from-purple-500 to-purple-700 rounded-full" />
                              Academic Realm
                            </h3>

                            <div className="space-y-2">
                              <Label className="text-zinc-400">College / University</Label>
                              <Input
                                value={formData.college}
                                onChange={(e) => handleChange('college', e.target.value)}
                                required
                                className="bg-black/40 border-white/10 text-white h-12 focus:border-purple-500/50 focus:ring-purple-500/20"
                                placeholder="Institution Name"
                              />
                            </div>

                            {/* Education Type Field */}
                            <div className="space-y-2">
                              <Label className="text-purple-300/80 text-sm font-medium">Education Type <span className="text-red-500">*</span></Label>
                              <Select value={formData.educationType} onValueChange={(value) => handleChange('educationType', value)}>
                                <SelectTrigger className="bg-black/60 border-purple-800/40 text-white h-12 hover:border-purple-600/60 transition-all">
                                  <SelectValue placeholder="Select Education Type" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-950 border-purple-800/50 text-white shadow-xl" position="popper" sideOffset={8}>
                                  <SelectItem value="diploma" className="focus:bg-purple-900/30 hover:bg-purple-900/20 cursor-pointer py-3">
                                    Diploma
                                  </SelectItem>
                                  <SelectItem value="degree" className="focus:bg-purple-900/30 hover:bg-purple-900/20 cursor-pointer py-3">
                                    Degree (B.Tech / B.E. / B.Sc)
                                  </SelectItem>
                                  <SelectItem value="pg" className="focus:bg-purple-900/30 hover:bg-purple-900/20 cursor-pointer py-3">
                                    Post Graduate (M.Tech / M.E. / M.Sc)
                                  </SelectItem>
                                  <SelectItem value="other" className="focus:bg-purple-900/30 hover:bg-purple-900/20 cursor-pointer py-3">
                                    Other
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-purple-300/80 text-sm font-medium">Year of Study <span className="text-red-500">*</span></Label>
                                <Select value={formData.year} onValueChange={(value) => handleChange('year', value)}>
                                  <SelectTrigger className="bg-black/60 border-purple-800/40 text-white h-12 hover:border-purple-600/60 transition-all">
                                    <SelectValue placeholder="Select Year" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-950 border-purple-800/50 text-white shadow-xl" position="popper" sideOffset={8}>
                                    {[1, 2, 3, 4].map(y => (
                                      <SelectItem key={y} value={y.toString()} className="focus:bg-purple-900/30 hover:bg-purple-900/20 cursor-pointer py-3">
                                        {y}{y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-zinc-400">Branch</Label>
                                <Input
                                  value={formData.branch}
                                  onChange={(e) => handleChange('branch', e.target.value)}
                                  required
                                  className="bg-black/40 border-white/10 text-white h-12 focus:border-purple-500/50 focus:ring-purple-500/20"
                                  placeholder="e.g. CSE, ECE"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Payment Section */}
                          {selectedEvent && selectedEvent.registration_fee > 0 && (
                            <div className="space-y-6 p-6 bg-gradient-to-br from-red-950/30 to-black border border-red-500/20 rounded-xl">
                              <div className="flex items-center justify-between border-b border-red-500/20 pb-4">
                                <div>
                                  <h3 className="text-lg font-semibold text-red-400">Payment Required</h3>
                                  <p className="text-sm text-red-400/60">Registration Fee</p>
                                </div>
                                <div className="text-3xl font-bold text-white">
                                  ₹{selectedEvent.registration_fee}
                                </div>
                              </div>

                              {selectedEvent.upi_qr_url && (
                                <div className="flex flex-col items-center space-y-4">
                                  <div className="p-4 bg-white rounded-xl shadow-lg">
                                    <img src={selectedEvent.upi_qr_url} alt="UPI QR" className="w-48 h-48 object-contain" />
                                  </div>
                                  <p className="text-sm text-zinc-400">Scan with any UPI app to pay</p>
                                </div>
                              )}

                              <div className="space-y-3">
                                <Label className="text-red-200 font-medium flex items-center gap-2">
                                  <Upload size={16} />
                                  Upload Payment Screenshot
                                </Label>
                                <div className="relative group">
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) setFormData(prev => ({ ...prev, paymentProof: file }));
                                    }}
                                    required
                                    className="bg-black/40 border-red-500/30 text-zinc-300 file:bg-red-500/10 file:text-red-400 file:border-0 file:mr-4 file:px-4 file:py-2 hover:file:bg-red-500/20 cursor-pointer h-14 pt-2"
                                  />
                                </div>
                                {formData.paymentProof && (
                                  <p className="text-sm text-green-400 flex items-center gap-2 animate-in fade-in">
                                    <CheckCircle2 size={14} />
                                    {formData.paymentProof.name}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Declaration */}
                          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                id="declaration"
                                checked={formData.declaration}
                                onChange={(e) => handleChange('declaration', e.target.checked.toString())}
                                required
                                className="mt-1 w-4 h-4 rounded border-white/20 bg-black/50 text-red-600 focus:ring-red-500/50"
                              />
                              <Label htmlFor="declaration" className="text-sm cursor-pointer text-zinc-300 leading-relaxed select-none">
                                I hereby declare that the information provided above is true to the best of my knowledge.
                                I agree to abide by the rules and regulations of the event.
                              </Label>
                            </div>
                          </div>

                          {/* Submit Button */}
                          <Button
                            type="submit"
                            disabled={loading || uploading || !formData.declaration}
                            className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white py-6 text-lg font-semibold shadow-lg shadow-red-900/20 transition-all hover:scale-[1.01] disabled:opacity-70 disabled:hover:scale-100"
                          >
                            {uploading ? (
                              <span className="flex items-center gap-2">
                                <Loader2 className="animate-spin" /> Uploading Proof...
                              </span>
                            ) : loading ? (
                              <span className="flex items-center gap-2">
                                <Loader2 className="animate-spin" /> Processing Registration...
                              </span>
                            ) : (
                              'Complete Registration'
                            )}
                          </Button>
                        </div>
                      )}
                    </form>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

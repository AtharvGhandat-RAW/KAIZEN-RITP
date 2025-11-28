import { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle, CheckCircle2, Upload, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const registrationSchema = z.object({
  eventId: z.string().min(1, "Please select an event"),
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100).regex(/^[a-zA-Z\s]+$/, "Name should only contain letters"),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  college: z.string().trim().min(2, "College name required").max(200),
  year: z.string().min(1, "Please select your year"),
  branch: z.string().trim().min(2, "Branch required").max(100),
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
  }, [fetchEvents, fetchRegistrationSettings]);

  const selectedEvent = events.find(e => e.id === formData.eventId);

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
      let paymentProofUrl = null;

      if (formData.paymentProof) {
        setUploading(true);
        const fileExt = formData.paymentProof.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
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

      // Check for existing profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.email)
        .single();

      let profileId: string;

      if (existingProfile) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.fullName,
            phone: formData.phone,
            college: formData.college,
            year: formData.year,
            branch: formData.branch,
          })
          .eq('id', existingProfile.id);

        if (updateError) throw updateError;
        profileId = existingProfile.id;
      } else {
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: crypto.randomUUID(),
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            college: formData.college,
            year: formData.year,
            branch: formData.branch,
          })
          .select('id')
          .single();

        if (profileError) throw profileError;
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
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
              <Sparkles className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">Event Registration</h2>
              <p className="text-xs text-zinc-400">Secure your spot in the Upside Down</p>
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
                          {/* Event Selection Section */}
                          <div className="space-y-4 p-6 bg-white/5 border border-white/10 rounded-xl">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                              <span className="w-1 h-6 bg-red-500 rounded-full" />
                              Event Details
                            </h3>
                            
                            <div className="space-y-2">
                              <Label className="text-zinc-400">Select Event</Label>
                              <Select value={formData.eventId} onValueChange={(value) => handleChange('eventId', value)}>
                                <SelectTrigger className="bg-black/40 border-white/10 text-white h-12 focus:ring-red-500/50">
                                  <SelectValue placeholder="Choose an event..." />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-950 border-white/10 text-white max-h-[300px]">
                                  {events.map((event) => (
                                    <SelectItem key={event.id} value={event.id} className="focus:bg-white/10 cursor-pointer py-3">
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                        <span className="font-medium text-white">{event.name}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/5">
                                            {event.category}
                                          </span>
                                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                            event.registration_fee > 0 
                                              ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                              : 'bg-green-500/10 text-green-400 border-green-500/20'
                                          }`}>
                                            {event.registration_fee > 0 ? `₹${event.registration_fee}` : 'Free'}
                                          </span>
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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

                          {/* Personal Details Section */}
                          <div className="space-y-4 p-6 bg-white/5 border border-white/10 rounded-xl">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                              <span className="w-1 h-6 bg-blue-500 rounded-full" />
                              Personal Information
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

                          {/* Academic Details Section */}
                          <div className="space-y-4 p-6 bg-white/5 border border-white/10 rounded-xl">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                              <span className="w-1 h-6 bg-purple-500 rounded-full" />
                              Academic Details
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-zinc-400">Year of Study</Label>
                                <Select value={formData.year} onValueChange={(value) => handleChange('year', value)}>
                                  <SelectTrigger className="bg-black/40 border-white/10 text-white h-12">
                                    <SelectValue placeholder="Select Year" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-950 border-white/10 text-white">
                                    {[1, 2, 3, 4].map(y => (
                                      <SelectItem key={y} value={y.toString()}>{y}{y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year</SelectItem>
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

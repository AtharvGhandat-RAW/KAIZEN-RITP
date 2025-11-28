import { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle, CheckCircle2, Upload, Loader2 } from 'lucide-react';
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

export function RegistrationPage({ onClose }: RegistrationPageProps) {
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
    eventId: '',
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
      // Non-critical, don't block UI
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
    <div className="fixed inset-0 z-50 bg-black/95 overflow-y-auto backdrop-blur-sm">
      <div className="w-full min-h-full flex flex-col items-center justify-start p-4 py-8 overflow-x-hidden">
        <button
          onClick={onClose}
          className="fixed top-4 right-4 z-50 p-2 rounded-full border-2 border-red-600 bg-black/80 text-red-500 hover:text-red-400 hover:bg-red-950/50 transition-all shadow-[0_0_15px_rgba(220,38,38,0.5)]"
          aria-label="Close registration"
        >
          <X size={24} />
        </button>

        <div className="w-full max-w-2xl bg-gradient-to-b from-red-950/30 to-black/95 border border-red-900/50 p-4 sm:p-8 mt-12 sm:mt-16 rounded-xl shadow-[0_0_50px_rgba(153,27,27,0.2)] backdrop-blur-md relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          {success ? (
            <div className="text-center py-12 space-y-6 px-2 animate-in fade-in zoom-in duration-500">
              <div className="flex justify-center mb-6">
                <div className="rounded-full bg-green-500/20 p-6 ring-2 ring-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-green-500 mb-4 tracking-tight" style={{
                textShadow: '0 0 20px rgba(34, 197, 94, 0.5)',
              }}>
                REGISTRATION COMPLETE!
              </h2>
              <p className="text-green-400/80 text-lg mb-2 max-w-md mx-auto">
                {selectedEvent?.registration_fee === 0
                  ? 'You are now registered for the event!'
                  : 'Your registration is submitted! Payment verification pending.'}
              </p>
              <p className="text-red-400/60 italic text-sm mb-8">
                Check your email for confirmation details
              </p>
              <Button
                onClick={onClose}
                className="bg-green-700 hover:bg-green-600 text-white px-8 py-6 text-lg w-full sm:w-auto shadow-[0_0_20px_rgba(21,128,61,0.4)] transition-all hover:scale-105"
              >
                Return to Events
              </Button>
            </div>
          ) : (
            <>
              {registrationSettings.registration_notice && (
                <Alert className="mb-6 bg-yellow-500/10 border-yellow-500/30 text-yellow-400">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Notice</AlertTitle>
                  <AlertDescription>
                    {registrationSettings.registration_notice}
                  </AlertDescription>
                </Alert>
              )}

              {!registrationSettings.registration_enabled ? (
                <div className="text-center py-12 space-y-6 px-2">
                  <div className="text-6xl mb-4">🚫</div>
                  <h2 className="text-3xl font-bold text-red-500 mb-4">
                    REGISTRATION CLOSED
                  </h2>
                  <p className="text-red-400/60 text-lg mb-6">
                    Registration is currently not available. Please check back later.
                  </p>
                  <Button type="button" onClick={onClose} className="bg-red-900 hover:bg-red-800 text-white mt-4">
                    Close
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-red-500 tracking-wider" style={{
                      textShadow: '0 0 20px rgba(220, 38, 38, 0.6)',
                      fontFamily: 'serif'
                    }}>
                      ENTER THE DARKNESS
                    </h2>
                    <p className="text-red-400/60 italic">Your registration... your fate sealed</p>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="mb-6 bg-red-950/50 border-red-800 text-red-200">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {loadingEvents ? (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24 bg-red-900/20" />
                          <Skeleton className="h-10 w-full bg-red-900/10" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32 bg-red-900/20" />
                          <Skeleton className="h-10 w-full bg-red-900/10" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-20 bg-red-900/20" />
                            <Skeleton className="h-10 w-full bg-red-900/10" />
                          </div>
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-20 bg-red-900/20" />
                            <Skeleton className="h-10 w-full bg-red-900/10" />
                          </div>
                        </div>
                      </div>
                    ) : events.length === 0 ? (
                      <div className="text-center py-12 space-y-4">
                        <p className="text-red-500 text-xl">No Events Available</p>
                        <p className="text-red-400/60">Check back later</p>
                        <Button type="button" onClick={onClose} className="bg-red-900 hover:bg-red-800 text-white">
                          Close
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label className="text-red-400 font-medium">Select Event *</Label>
                          <Select value={formData.eventId} onValueChange={(value) => handleChange('eventId', value)}>
                            <SelectTrigger className="bg-black/60 border-red-900/50 text-white h-12 focus:ring-red-500/50">
                              <SelectValue placeholder="Choose an event to participate" />
                            </SelectTrigger>
                            <SelectContent className="bg-black border-red-900/50 text-white">
                              {events.map((event) => (
                                <SelectItem key={event.id} value={event.id} className="focus:bg-red-900/30 focus:text-white cursor-pointer py-3">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                    <span className="font-medium">{event.name}</span>
                                    <span className="text-xs sm:text-sm text-red-400/80 bg-red-950/30 px-2 py-0.5 rounded-full border border-red-900/30">
                                      {event.category}
                                    </span>
                                    <span className="text-xs sm:text-sm text-green-400/80">
                                      {event.registration_fee > 0 ? `₹${event.registration_fee}` : 'Free'}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedEvent?.event_type === 'team' && (
                          <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                            <Label className="text-red-400 font-medium">Team Name *</Label>
                            <Input
                              value={formData.teamName}
                              onChange={(e) => handleChange('teamName', e.target.value)}
                              required
                              className="bg-black/60 border-red-900/50 text-white h-12 focus:border-red-500 focus:ring-red-500/20"
                              placeholder="Enter your team's name"
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label className="text-red-400 font-medium">Full Name *</Label>
                          <Input
                            value={formData.fullName}
                            onChange={(e) => handleChange('fullName', e.target.value)}
                            required
                            className="bg-black/60 border-red-900/50 text-white h-12 focus:border-red-500 focus:ring-red-500/20"
                            placeholder="Your full legal name"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-red-400 font-medium">Email *</Label>
                            <Input
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleChange('email', e.target.value)}
                              required
                              className="bg-black/60 border-red-900/50 text-white h-12 focus:border-red-500 focus:ring-red-500/20"
                              placeholder="your.email@example.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-red-400 font-medium">Phone *</Label>
                            <Input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => handleChange('phone', e.target.value)}
                              required
                              className="bg-black/60 border-red-900/50 text-white h-12 focus:border-red-500 focus:ring-red-500/20"
                              placeholder="10-digit mobile number"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-red-400 font-medium">College/University *</Label>
                          <Input
                            value={formData.college}
                            onChange={(e) => handleChange('college', e.target.value)}
                            required
                            className="bg-black/60 border-red-900/50 text-white h-12 focus:border-red-500 focus:ring-red-500/20"
                            placeholder="Full name of your institution"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-red-400 font-medium">Year of Study *</Label>
                            <Select value={formData.year} onValueChange={(value) => handleChange('year', value)}>
                              <SelectTrigger className="bg-black/60 border-red-900/50 text-white h-12">
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                              <SelectContent className="bg-black border-red-900/50 text-white">
                                <SelectItem value="1">1st Year</SelectItem>
                                <SelectItem value="2">2nd Year</SelectItem>
                                <SelectItem value="3">3rd Year</SelectItem>
                                <SelectItem value="4">4th Year</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-red-400 font-medium">Branch *</Label>
                            <Input
                              value={formData.branch}
                              onChange={(e) => handleChange('branch', e.target.value)}
                              required
                              placeholder="e.g., CSE, ECE, ME"
                              className="bg-black/60 border-red-900/50 text-white h-12 focus:border-red-500 focus:ring-red-500/20"
                            />
                          </div>
                        </div>

                        {selectedEvent && selectedEvent.registration_fee > 0 && (
                          <div className="space-y-4 p-6 border border-red-900/50 bg-red-950/20 rounded-lg animate-in fade-in duration-500">
                            <div className="flex justify-between items-center border-b border-red-900/30 pb-4">
                              <div>
                                <p className="text-lg font-semibold text-red-400">💀 Blood Price Required</p>
                                <p className="text-sm text-red-400/60">Registration Fee</p>
                              </div>
                              <p className="text-3xl font-bold text-red-500">₹{selectedEvent.registration_fee}</p>
                            </div>

                            {selectedEvent.upi_qr_url && (
                              <div className="space-y-3 text-center">
                                <Label className="text-red-400 block">Scan to Pay (UPI)</Label>
                                <div className="p-4 bg-white rounded-lg inline-block shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                  <img src={selectedEvent.upi_qr_url} alt="UPI QR" className="w-48 h-48 object-contain" />
                                </div>
                                <p className="text-xs text-red-400/60">Scan with any UPI app</p>
                              </div>
                            )}

                            <div className="space-y-3 pt-2">
                              <Label className="text-red-400 font-medium flex items-center gap-2">
                                <Upload size={16} />
                                Upload Payment Proof *
                              </Label>
                              <div className="relative">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setFormData(prev => ({ ...prev, paymentProof: file }));
                                    }
                                  }}
                                  required
                                  className="bg-black/60 border-red-900/50 text-red-300 file:bg-red-900/20 file:text-red-400 file:border-0 file:mr-4 file:px-4 file:py-2 hover:file:bg-red-900/40 cursor-pointer"
                                />
                              </div>
                              {formData.paymentProof && (
                                <p className="text-sm text-green-500 flex items-center gap-2">
                                  <CheckCircle2 size={14} />
                                  {formData.paymentProof.name}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="space-y-4 p-4 border border-red-900/30 bg-red-950/10 rounded-lg">
                          <h3 className="font-bold text-red-400 flex items-center gap-2">
                            <span>🩸</span> Blood Oath & Declaration
                          </h3>
                          <div className="text-sm text-red-300/80 space-y-2 pl-1">
                            <p className="italic">By signing this pact, you solemnly swear:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2 text-red-400/70">
                              <li>All information provided is accurate and true</li>
                              <li>You agree to abide by all event rules and regulations</li>
                              <li>You understand that registration fees are non-refundable</li>
                            </ul>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-black/40 border border-red-900/40 rounded hover:bg-black/60 transition-colors">
                            <input
                              type="checkbox"
                              id="declaration"
                              checked={formData.declaration}
                              onChange={(e) => handleChange('declaration', e.target.checked.toString())}
                              required
                              className="mt-1 w-4 h-4 rounded border-red-900 bg-black/50 text-red-600 focus:ring-red-900"
                            />
                            <Label htmlFor="declaration" className="text-sm cursor-pointer text-red-300 leading-tight select-none">
                              I accept the terms and conditions and confirm my participation *
                            </Label>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                          <Button
                            type="submit"
                            disabled={loading || uploading || !formData.declaration}
                            className="flex-1 bg-red-800 hover:bg-red-900 text-white py-6 text-lg shadow-[0_0_20px_rgba(153,27,27,0.3)] transition-all hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
                          >
                            {uploading ? (
                              <span className="flex items-center gap-2">
                                <Loader2 className="animate-spin" /> UPLOADING PROOF...
                              </span>
                            ) : loading ? (
                              <span className="flex items-center gap-2">
                                <Loader2 className="animate-spin" /> SUBMITTING...
                              </span>
                            ) : (
                              '💀 COMPLETE REGISTRATION'
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="border-red-900/50 hover:bg-red-950/30 text-red-400 py-6 hover:text-red-300"
                          >
                            ESCAPE
                          </Button>
                        </div>
                      </>
                    )}
                  </form>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

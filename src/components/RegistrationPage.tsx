import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

export function RegistrationPage({ onClose }: RegistrationPageProps) {
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
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

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, category, registration_fee, event_type, upi_qr_url')
        .in('status', ['upcoming', 'ongoing'])
        .order('event_date');

      if (error) {
        console.error('Error fetching events:', error);
        toast.error('Failed to load events');
      } else {
        setEvents(data || []);
        if (!data || data.length === 0) {
          toast.info('No events available at the moment');
        }
      }
    } catch (err) {
      console.error('Exception:', err);
      toast.error('Failed to load events');
    } finally {
      setLoadingEvents(false);
    }
  };

  const selectedEvent = events.find(e => e.id === formData.eventId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    <div className="fixed inset-0 z-50 bg-black/95 overflow-y-auto">
      <div className="w-full min-h-full flex flex-col items-center justify-start p-4 py-8 overflow-x-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="fixed top-4 right-4 z-50 p-2 border-2 border-red-600 bg-black text-red-500 hover:text-red-400 hover:bg-red-950/30 transition-all"
        >
          <X size={24} />
        </button>

        {/* Form container */}
        <div className="w-full max-w-2xl bg-gradient-to-b from-red-950/20 to-black/90 border-2 border-red-900/50 p-4 sm:p-6 md:p-8 mt-12 sm:mt-16 overflow-x-hidden">
          {success ? (
            /* Success Screen */
            <div className="text-center py-8 sm:py-12 space-y-4 sm:space-y-6 px-2">
              <div className="text-5xl sm:text-6xl mb-4">✅</div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-500 mb-4" style={{
                textShadow: '0 0 20px rgba(0, 255, 0, 0.5)',
                fontFamily: 'serif'
              }}>
                REGISTRATION COMPLETE!
              </h2>
              <p className="text-green-400/80 text-base sm:text-lg mb-2">
                {selectedEvent?.registration_fee === 0
                  ? 'You are now registered for the event!'
                  : 'Your registration is submitted! Payment verification pending.'}
              </p>
              <p className="text-red-400/60 italic text-sm sm:text-base mb-6 sm:mb-8">
                Check your email for confirmation details
              </p>
              <Button
                onClick={onClose}
                className="bg-green-700 hover:bg-green-600 text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto"
              >
                🎉 CLOSE
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-red-500 text-center px-2" style={{
                textShadow: '0 0 20px rgba(255, 0, 0, 0.5)',
                fontFamily: 'serif'
              }}>
                ENTER THE DARKNESS
              </h2>
              <p className="text-red-400/60 mb-4 sm:mb-6 text-center italic text-sm sm:text-base px-2">Your registration... your fate sealed</p>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {loadingEvents ? (
                  <div className="text-center py-8 sm:py-12 space-y-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin mx-auto" />
                    <p className="text-red-500 text-base sm:text-lg">Loading events...</p>
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 space-y-4 px-2">
                    <p className="text-red-500 text-lg sm:text-xl">No Events Available</p>
                    <p className="text-red-400/60 text-sm sm:text-base">Check back later</p>
                    <Button type="button" onClick={onClose} className="bg-red-900 hover:bg-red-800 text-white w-full sm:w-auto">
                      Close
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="text-red-400">Select Event *</Label>
                      <Select value={formData.eventId} onValueChange={(value) => handleChange('eventId', value)}>
                        <SelectTrigger className="bg-black/60 border-red-900/50 text-white">
                          <SelectValue placeholder="Choose an event" />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-red-900/50">
                          {events.map((event) => (
                            <SelectItem key={event.id} value={event.id} className="text-white">
                              {event.name} - {event.category} (₹{event.registration_fee})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedEvent?.event_type === 'team' && (
                      <div className="space-y-2">
                        <Label className="text-red-400">Team Name *</Label>
                        <Input
                          value={formData.teamName}
                          onChange={(e) => handleChange('teamName', e.target.value)}
                          required
                          className="bg-black/60 border-red-900/50 text-white"
                          placeholder="Enter team name"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-red-400">Full Name *</Label>
                      <Input
                        value={formData.fullName}
                        onChange={(e) => handleChange('fullName', e.target.value)}
                        required
                        className="bg-black/60 border-red-900/50 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-red-400">Email *</Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          required
                          className="bg-black/60 border-red-900/50 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-red-400">Phone *</Label>
                        <Input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          required
                          className="bg-black/60 border-red-900/50 text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-red-400">College/University *</Label>
                      <Input
                        value={formData.college}
                        onChange={(e) => handleChange('college', e.target.value)}
                        required
                        className="bg-black/60 border-red-900/50 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-red-400">Year of Study *</Label>
                        <Select value={formData.year} onValueChange={(value) => handleChange('year', value)}>
                          <SelectTrigger className="bg-black/60 border-red-900/50 text-white">
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent className="bg-black border-red-900/50">
                            <SelectItem value="1" className="text-white">1st Year</SelectItem>
                            <SelectItem value="2" className="text-white">2nd Year</SelectItem>
                            <SelectItem value="3" className="text-white">3rd Year</SelectItem>
                            <SelectItem value="4" className="text-white">4th Year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-red-400">Branch *</Label>
                        <Input
                          value={formData.branch}
                          onChange={(e) => handleChange('branch', e.target.value)}
                          required
                          placeholder="e.g., Computer Science"
                          className="bg-black/60 border-red-900/50 text-white"
                        />
                      </div>
                    </div>

                    {selectedEvent && selectedEvent.registration_fee > 0 && (
                      <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border-2 border-red-900/50 bg-red-950/20">
                        <div>
                          <p className="text-base sm:text-lg font-semibold text-red-400">💀 Blood Price Required</p>
                          <p className="text-2xl sm:text-3xl font-bold text-red-500">₹{selectedEvent.registration_fee}</p>
                        </div>

                        {selectedEvent.upi_qr_url && (
                          <div className="space-y-2">
                            <Label className="text-red-400 text-sm sm:text-base">Scan to Pay (UPI)</Label>
                            <div className="p-2 sm:p-3 bg-white rounded inline-block w-full sm:w-auto flex justify-center">
                              <img src={selectedEvent.upi_qr_url} alt="UPI QR" className="w-40 h-40 sm:w-48 sm:h-48 object-contain" />
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label className="text-red-400 text-sm sm:text-base">Upload Payment Proof *</Label>
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
                            className="bg-black/60 border-red-900/50 text-red-300 text-sm"
                          />
                          {formData.paymentProof && (
                            <p className="text-xs text-green-500 break-all">✓ {formData.paymentProof.name}</p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border-2 border-red-900/30 bg-red-950/10">
                      <h3 className="font-bold text-red-400 text-sm sm:text-base">🩸 Blood Oath & Declaration</h3>
                      <div className="text-xs sm:text-sm text-red-300/80 space-y-2">
                        <p className="italic">By signing this pact, you solemnly swear:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>All information is accurate</li>
                          <li>You agree to event rules</li>
                          <li>Registration fees are non-refundable</li>
                        </ul>
                      </div>
                      <div className="flex items-start gap-2 p-2 sm:p-3 bg-black/40 border border-red-900/40">
                        <input
                          type="checkbox"
                          id="declaration"
                          checked={formData.declaration}
                          onChange={(e) => handleChange('declaration', e.target.checked.toString())}
                          required
                          className="mt-1 w-4 h-4 flex-shrink-0"
                        />
                        <Label htmlFor="declaration" className="text-xs sm:text-sm cursor-pointer text-red-300 leading-tight">
                          ✍️ I accept the terms and conditions *
                        </Label>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                      <Button
                        type="submit"
                        disabled={loading || uploading || !formData.declaration}
                        className="flex-1 bg-red-800 hover:bg-red-900 text-white text-sm sm:text-base py-5 sm:py-6"
                      >
                        {uploading ? '⏳ UPLOADING...' : loading ? '🔥 SUBMITTING...' : '💀 COMPLETE REGISTRATION'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="border-2 border-red-900/50 hover:bg-red-950/30 text-red-400 text-sm sm:text-base py-5 sm:py-6"
                      >
                        ESCAPE
                      </Button>
                    </div>
                  </>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

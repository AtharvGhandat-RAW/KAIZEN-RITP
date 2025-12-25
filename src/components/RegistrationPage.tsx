import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { loadRazorpay } from '@/utils/loadRazorpay';
import { AlertCircle, CheckCircle2, Flame, Ghost, Loader2, Skull, Upload, X, Zap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

// UUID fallback for browsers that don't support crypto.randomUUID
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
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
    festRegistrationCode: '', // New field for Fest Code
  });

  const [step, setStep] = useState(1);

  const selectedEvent = useMemo(() =>
    events.find(e => e.id === formData.eventId),
    [events, formData.eventId]
  );

  // Verify Fest Code before proceeding
  const verifyFestCode = async () => {
    if (!formData.festRegistrationCode) {
      toast.error("Please enter your Fest Registration Code");
      return false;
    }

    setLoading(true);
    try {
      // Cast to any to avoid deep type instantiation issues with new columns
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase
        .from('profiles') as any)
        .select('id, full_name, email, phone, college, year, branch')
        .eq('fest_registration_id', formData.festRegistrationCode)
        .eq('is_fest_registered', true)
        .single();

      if (error || !data) {
        toast.error("Invalid Fest Code. Please register for the Fest first.");
        return false;
      }

      // Auto-fill form data from profile
      setFormData(prev => ({
        ...prev,
        fullName: data.full_name,
        email: data.email,
        phone: data.phone || '',
        college: data.college || '',
        year: data.year || '',
        branch: data.branch || '',
      }));

      toast.success("Fest Code Verified! Details auto-filled.");
      return true;
    } catch (err) {
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    if (step === 1) {
      if (!formData.eventId) { toast.error("Please select an event"); return; }
      if (selectedEvent?.event_type === 'team' && !formData.teamName) { toast.error("Please enter a team name"); return; }

      // Verify code before moving to personal details
      const isValid = await verifyFestCode();
      if (!isValid) return;

    } else if (step === 2) {
      if (!formData.fullName || !formData.email || !formData.phone || !formData.college || !formData.year || !formData.branch || !formData.educationType) {
        toast.error("Please fill in all fields");
        return;
      }
      if (!formData.email.includes('@')) { toast.error("Invalid email"); return; }
      if (!/^[6-9]\d{9}$/.test(formData.phone)) { toast.error("Invalid phone number"); return; }
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

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

    setLoading(true);

    try {
      // Case 1: Paid Event
      if (selectedEvent && selectedEvent.registration_fee > 0) {
        const res = await loadRazorpay();
        if (!res) {
          throw new Error('Razorpay SDK failed to load');
        }

        // Create Order
        const { data: orderData, error: orderError } = await supabase.functions.invoke('process-payment', {
          body: {
            action: 'create_order',
            amount: selectedEvent.registration_fee
          }
        });

        if (orderError) throw orderError;

        const options = {
          key: orderData.key_id || "rzp_test_RvPFFzj61qtFye",
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Kaizen RITP",
          description: `Registration for ${selectedEvent.name}`,
          order_id: orderData.id,
          handler: async function (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
            try {
              // Verify Payment & Register
              const { data: result, error: verifyError } = await supabase.functions.invoke('process-payment', {
                body: {
                  action: 'verify_payment',
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  registrationData: {
                    p_full_name: formData.fullName,
                    p_email: formData.email.toLowerCase().trim(),
                    p_phone: formData.phone,
                    p_college: formData.college,
                    p_year: formData.year,
                    p_branch: formData.branch,
                    p_education: formData.educationType,
                    p_event_id: formData.eventId,
                    p_team_name: formData.teamName || null,
                    p_payment_proof_url: null, // No manual proof
                    p_registration_fee: selectedEvent.registration_fee,
                    eventName: selectedEvent.name
                  }
                }
              });

              if (verifyError) throw verifyError;
              if (result && !result.success) throw new Error(result.message || 'Registration failed');

              setSuccess(true);
              toast.success('Registration Successful!', {
                description: 'Payment verified and registration complete.',
              });
            } catch (err: unknown) {
              console.error('Verification error:', err);
              const errorMessage = err instanceof Error ? err.message : 'Unknown error';
              toast.error('Payment Verification Failed', {
                description: errorMessage || 'Please contact support.',
              });
              setError(errorMessage);
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: formData.fullName,
            email: formData.email,
            contact: formData.phone
          },
          theme: {
            color: "#DC2626"
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              toast('Payment Cancelled');
            }
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.open();

      } else {
        // Case 2: Free Event (Existing Logic)
        // @ts-expect-error - RPC function not yet in types
        const { data: result, error: rpcError } = await supabase.rpc('register_user_for_event', {
          p_full_name: formData.fullName,
          p_email: formData.email.toLowerCase().trim(),
          p_phone: formData.phone,
          p_college: formData.college,
          p_year: formData.year,
          p_branch: formData.branch,
          p_education: formData.educationType,
          p_event_id: formData.eventId,
          p_team_name: formData.teamName || null,
          p_payment_proof_url: null,
          p_registration_fee: 0
        });

        if (rpcError) throw rpcError;

        const registrationResult = result as unknown as { success: boolean; message?: string; registration_id?: string };

        if (registrationResult && !registrationResult.success) {
          throw new Error(registrationResult.message || 'Registration failed');
        }

        // Send confirmation email
        supabase.functions.invoke('send-registration-email', {
          body: {
            to: formData.email,
            type: 'registration_confirmation',
            data: {
              name: formData.fullName,
              eventName: selectedEvent?.name || 'Event',
            }
          }
        }).catch(console.error);

        setSuccess(true);
        toast.success('Registration Successful!', {
          description: 'You are now registered!',
        });
        setLoading(false);
      }

    } catch (error: unknown) {
      console.error('Registration error:', error);
      const err = error as { message?: string; error_description?: string };
      const errorMessage = err?.message || err?.error_description || 'Registration failed. Please try again.';
      setError(errorMessage);
      toast.error('Registration Failed', {
        description: errorMessage,
      });
      setLoading(false);
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-0 sm:p-6 animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl h-[100dvh] sm:h-full sm:max-h-[90vh] flex flex-col bg-gradient-to-br from-zinc-900 via-black to-zinc-950 border-0 sm:border border-white/10 rounded-none sm:rounded-2xl shadow-2xl overflow-hidden">

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
              <p className="text-xs text-red-400/60">Step {step} of 3: {step === 1 ? 'Choose Fate' : step === 2 ? 'Identity' : 'Finalize'}</p>
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

                          {/* Step 1: Event Selection */}
                          {step === 1 && (
                            <div className="space-y-4 p-6 bg-gradient-to-br from-red-950/20 via-black to-red-950/10 border border-red-900/40 rounded-xl shadow-lg shadow-red-900/10 relative overflow-hidden animate-in slide-in-from-right">
                              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyMjAsIDM4LCAzOCwgMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50" />
                              <h3 className="text-lg font-semibold text-red-100 flex items-center gap-2 relative">
                                <Flame className="w-5 h-5 text-red-500 animate-pulse" />
                                Choose Your Fate
                              </h3>

                              <div className="space-y-3 relative">
                                <Label className="text-red-300/80 text-sm font-medium">Select Event <span className="text-red-500">*</span></Label>
                                <Select value={formData.eventId} onValueChange={(value) => handleChange('eventId', value)}>
                                  <SelectTrigger className="bg-black/60 border-red-800/50 text-white h-auto min-h-[3.5rem] py-3 focus:ring-red-500/50 focus:border-red-500 hover:border-red-600/60 transition-all duration-300 hover:bg-black/80 [&>span]:line-clamp-none [&>span]:text-left [&>span]:w-full">
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

                              {/* Fest Code Input */}
                              <div className="space-y-2 pt-4 border-t border-white/10">
                                <Label className="text-purple-400 font-semibold flex items-center gap-2">
                                  <Zap className="w-4 h-4" /> Fest Registration Code
                                </Label>
                                <div className="flex gap-2">
                                  <Input
                                    value={formData.festRegistrationCode}
                                    onChange={(e) => handleChange('festRegistrationCode', e.target.value)}
                                    required
                                    className="bg-black/40 border-purple-500/30 text-white h-12 focus:border-purple-500 focus:ring-purple-500/20"
                                    placeholder="Enter code (e.g. KZN-123456)"
                                  />
                                </div>
                                <p className="text-xs text-zinc-500">
                                  You must register for the Fest first to get this code.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Step 2: Personal & Academic Details */}
                          {step === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right">
                              {/* Personal Details Section */}
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
                                      readOnly // Auto-filled from Fest Code
                                      className="bg-black/40 border-white/10 text-white/70 h-12 cursor-not-allowed"
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
                                      readOnly
                                      className="bg-black/40 border-white/10 text-white/70 h-12 cursor-not-allowed"
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
                                    readOnly
                                    className="bg-black/40 border-white/10 text-white/70 h-12 cursor-not-allowed"
                                    placeholder="john@example.com"
                                  />
                                </div>
                              </div>

                              {/* Academic Details Section */}
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
                                    readOnly
                                    className="bg-black/40 border-white/10 text-white/70 h-12 cursor-not-allowed"
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
                            </div>
                          )}

                          {/* Step 3: Payment & Declaration */}
                          {step === 3 && (
                            <div className="space-y-6 animate-in slide-in-from-right">
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

                                  <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-lg flex items-center gap-3">
                                    <div className="p-2 bg-red-900/20 rounded-full">
                                      <Zap className="w-5 h-5 text-red-500" />
                                    </div>
                                    <p className="text-sm text-red-200/80">
                                      Click "Complete Registration" to pay securely via Razorpay.
                                    </p>
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
                            </div>
                          )}

                          {/* Navigation Buttons */}
                          <div className="flex gap-4 pt-4">
                            {step > 1 && (
                              <Button
                                type="button"
                                onClick={prevStep}
                                variant="outline"
                                className="flex-1 border-white/10 text-white hover:bg-white/5 h-12"
                              >
                                Back
                              </Button>
                            )}

                            {step < 3 ? (
                              <Button
                                type="button"
                                onClick={nextStep}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white h-12"
                              >
                                Next Step
                              </Button>
                            ) : (
                              <Button
                                type="submit"
                                disabled={loading || uploading || !formData.declaration}
                                className="flex-1 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white h-12 font-semibold shadow-lg shadow-red-900/20 transition-all hover:scale-[1.01] disabled:opacity-70 disabled:hover:scale-100"
                              >
                                {loading || uploading ? (
                                  <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Registering...
                                  </span>
                                ) : (
                                  'Complete Registration'
                                )}
                              </Button>
                            )}
                          </div>

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

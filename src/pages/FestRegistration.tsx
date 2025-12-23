import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Upload, CheckCircle2, AlertCircle, Calendar, Clock } from 'lucide-react';
import { AtmosphericBackground } from '@/components/AtmosphericBackground';

// UUID fallback
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function FestRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    education: '',
    college: '',
    year: '',
    branch: '',
    paymentProof: null as File | null,
  });

  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusTitle, setStatusTitle] = useState<string>('Registration Closed');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    checkRegistrationStatus();
  }, []);

  const checkRegistrationStatus = async () => {
    try {
      const { data, error } = await (supabase
        .from('fest_settings' as any)
        .select('*')
        .single()) as any;

      if (data) {
        const now = new Date();
        const start = data.registration_start_time ? new Date(data.registration_start_time) : null;
        const end = data.registration_end_time ? new Date(data.registration_end_time) : null;
        
        let live = data.is_registration_live;
        let message = '';
        let title = 'Registration Closed';

        if (live) {
          if (start && now < start) {
            live = false;
            title = 'Coming Soon';
            message = `Registration opens on ${start.toLocaleDateString()} at ${start.toLocaleTimeString()}`;
          } else if (end && now > end) {
            live = false;
            title = 'Registration Closed';
            message = 'Registration has ended';
          }
        } else {
          title = 'Registration Closed';
          message = 'Fest registration is currently not active. Please check back later or contact the coordinators.';
        }

        setIsLive(live);
        setStatusMessage(message);
        setStatusTitle(title);
      }
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.paymentProof) {
      toast.error("Please upload payment proof");
      return;
    }

    setLoading(true);
    try {
      // 1. Upload Payment Proof
      setUploading(true);
      const fileExt = formData.paymentProof.name.split('.').pop();
      const fileName = `fest-${generateUUID()}.${fileExt}`;
      const filePath = `fest-payments/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-payments') // Reusing existing bucket
        .upload(filePath, formData.paymentProof);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-payments')
        .getPublicUrl(filePath);

      setUploading(false);

      // 2. Create/Update Profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          email: formData.email,
          full_name: formData.fullName,
          phone: formData.phone,
          education: formData.education,
          college: formData.college,
          year: formData.year,
          branch: formData.branch,
          fest_payment_status: 'pending',
          fest_payment_proof_url: publicUrl,
          is_fest_registered: false // Will be true after admin approval
        }, { onConflict: 'email' })
        .select()
        .single();

      if (profileError) throw profileError;

      setIsSubmitted(true);
      toast.success("Registration Submitted!");
      
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        education: '',
        college: '',
        year: '',
        branch: '',
        paymentProof: null,
      });

    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  if (!isLive) {
    return (
      <div className="min-h-screen bg-black relative flex items-center justify-center p-4">
        <AtmosphericBackground />
        <div className="relative z-10 max-w-md w-full bg-zinc-900/80 border border-red-500/30 p-8 rounded-2xl text-center backdrop-blur-xl">
          <Clock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">{statusTitle}</h1>
          <p className="text-zinc-400">
            {statusMessage || 'Fest registration is currently not active. Please check back later or contact the coordinators.'}
          </p>
          <Button 
            onClick={() => navigate('/')}
            className="mt-6 bg-white/10 hover:bg-white/20 text-white"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-black relative flex items-center justify-center p-4">
        <AtmosphericBackground />
        <div className="relative z-10 max-w-md w-full bg-zinc-900/80 border border-green-500/30 p-8 rounded-2xl text-center backdrop-blur-xl animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Registration Submitted!</h1>
          <div className="space-y-3 text-zinc-300">
            <p>Your request is pending.</p>
            <p className="text-sm bg-white/5 p-3 rounded-lg border border-white/10">
              Once your payment is verified, you will receive an email with your unique <span className="text-red-400 font-semibold">Fest Code</span>.
            </p>
          </div>
          <Button 
            onClick={() => navigate('/')}
            className="mt-8 w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold h-12"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-y-auto">
      <AtmosphericBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600 mb-4">
            Fest Registration
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Join us for the ultimate experience. Register once to get your unique Fest Code, which unlocks access to all event registrations.
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Personal Details */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <span className="w-1 h-6 bg-red-500 rounded-full"/> Personal Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Full Name</Label>
                  <Input 
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    className="bg-black/40 border-white/10 text-white focus:border-red-500"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Phone Number</Label>
                  <Input 
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="bg-black/40 border-white/10 text-white focus:border-red-500"
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Email Address</Label>
                <Input 
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="bg-black/40 border-white/10 text-white focus:border-red-500"
                  placeholder="john@example.com"
                />
                <p className="text-xs text-zinc-500">Your Fest Code will be sent to this email.</p>
              </div>
            </div>

            {/* Academic Details */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <span className="w-1 h-6 bg-purple-500 rounded-full"/> Academic Details
              </h3>

              <div className="space-y-2">
                <Label className="text-zinc-300">Education</Label>
                <Select onValueChange={v => setFormData({...formData, education: v})}>
                  <SelectTrigger className="bg-black/40 border-white/10 text-white">
                    <SelectValue placeholder="Select Education Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Degree">Degree</SelectItem>
                    <SelectItem value="Diploma">Diploma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-zinc-300">College Name</Label>
                <Input 
                  required
                  value={formData.college}
                  onChange={e => setFormData({...formData, college: e.target.value})}
                  className="bg-black/40 border-white/10 text-white focus:border-purple-500"
                  placeholder="Institute of Technology"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Year</Label>
                  <Select onValueChange={v => setFormData({...formData, year: v})}>
                    <SelectTrigger className="bg-black/40 border-white/10 text-white">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Branch</Label>
                  <Input 
                    required
                    value={formData.branch}
                    onChange={e => setFormData({...formData, branch: e.target.value})}
                    className="bg-black/40 border-white/10 text-white focus:border-purple-500"
                    placeholder="CSE, ECE, etc."
                  />
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <span className="w-1 h-6 bg-green-500 rounded-full"/> Payment
              </h3>
              
              <div className="bg-gradient-to-br from-green-900/20 to-black p-6 rounded-xl border border-green-500/20 text-center">
                <p className="text-zinc-300 mb-4">Scan QR to pay Registration Fee</p>
                <div className="bg-white p-4 rounded-lg inline-block mb-4">
                  {/* Replace with actual QR Code URL */}
                  <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-black font-bold">
                    QR CODE HERE
                  </div>
                </div>
                
                <div className="max-w-sm mx-auto">
                  <Label className="text-green-400 mb-2 block text-left">Upload Payment Screenshot</Label>
                  <div className="relative">
                    <Input 
                      type="file"
                      accept="image/*"
                      required
                      onChange={e => {
                        if (e.target.files?.[0]) {
                          setFormData({...formData, paymentProof: e.target.files[0]});
                        }
                      }}
                      className="bg-black/40 border-green-500/30 text-zinc-300 file:bg-green-500/10 file:text-green-400 file:border-0 file:mr-4 file:px-4 file:py-2 hover:file:bg-green-500/20 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Button 
                type="submit" 
                disabled={loading || uploading}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 shadow-lg shadow-red-900/20"
              >
                {loading || uploading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                  </span>
                ) : (
                  "Submit Registration"
                )}
              </Button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

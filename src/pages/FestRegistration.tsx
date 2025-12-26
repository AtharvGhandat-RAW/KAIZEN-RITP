import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertCircle, Calendar, Clock, Zap, QrCode, Upload, FileText } from 'lucide-react';
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
  const [paymentSettings, setPaymentSettings] = useState({
    upiId: '',
    qrCodeUrl: ''
  });
  const [bucketReady, setBucketReady] = useState(true);
  const [bucketHint, setBucketHint] = useState('');

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

  useEffect(() => {
    checkRegistrationStatus();
    fetchPaymentSettings();
    checkStorageBucket();
  }, []);

  const checkStorageBucket = async () => {
    try {
      // Attempt to list objects to verify bucket exists
      const { data, error } = await supabase.storage
        .from('proof-uploads')
        .list('', { limit: 1 });

      if (error) {
        const msg = (error as any)?.message || String(error);
        if (msg.toLowerCase().includes('bucket not found')) {
          setBucketReady(false);
          setBucketHint('Storage bucket missing. Please run the Supabase migration to create proof-uploads.');
          return;
        }
      }

      setBucketReady(true);
      setBucketHint('');
    } catch (err) {
      // Default to ready to avoid blocking if check fails for non-fatal reasons
      setBucketReady(true);
      setBucketHint('');
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .in('key', ['fest_upi_id', 'fest_qr_code_url']);

      if (data) {
        const settings: any = {};
        data.forEach((item: any) => {
          settings[item.key] = item.value;
        });

        setPaymentSettings({
          upiId: settings['fest_upi_id'] ? String(settings['fest_upi_id']).replace(/"/g, '') : '',
          qrCodeUrl: settings['fest_qr_code_url'] ? String(settings['fest_qr_code_url']).replace(/"/g, '') : ''
        });
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    }
  };

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

  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      // Validate file before attempting upload
      if (file.size > MAX_FILE_SIZE) {
        toast.error('File too large. Max size is 5MB.');
        return null;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error('Unsupported file type. Allowed: JPG, PNG, PDF');
        return null;
      }
      const fileExt = file.name.split('.').pop();
      const safeBase = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\s+/g, '_');
      const fileName = `${generateUUID()}_${safeBase}`;
      // Store inside a folder within the bucket to avoid duplicated bucket name in object path
      const filePath = `proofs/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('proof-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        // Provide a clearer hint if the storage bucket is missing
        const msg = (uploadError as any)?.message || String(uploadError);
        if (msg.toLowerCase().includes('bucket not found')) {
          toast.error('Storage bucket missing. Please run the Supabase migration to create proof-uploads.');
        }
        // Surface server message for debugging
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }

      return filePath;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload proof');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!formData.fullName || !formData.email || !formData.phone || !formData.education || 
          !formData.college || !formData.year || !formData.branch) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      let paymentProofUrl = null;

      // Upload proof if provided and bucket is ready
      if (formData.paymentProof && bucketReady) {
        paymentProofUrl = await handleFileUpload(formData.paymentProof);
        if (!paymentProofUrl) {
          setLoading(false);
          return;
        }
      } else if (formData.paymentProof && !bucketReady) {
        toast.error('Storage bucket missing. Please remove the file or try again after running the migration.');
        setLoading(false);
        return;
      }

      // Register user for fest
      const { data: result, error: rpcError } = await supabase.rpc('register_fest_user', {
        p_full_name: formData.fullName,
        p_email: formData.email.toLowerCase().trim(),
        p_phone: formData.phone,
        p_education: formData.education,
        p_college: formData.college,
        p_year: formData.year,
        p_branch: formData.branch,
        p_payment_proof_url: paymentProofUrl,
      });

      if (rpcError) {
        const msg = (rpcError as any)?.message || String(rpcError);
        if (msg.toLowerCase().includes('could not find the function') || msg.toLowerCase().includes('schema cache')) {
          toast.error('Registration function missing. Please run the Supabase migration files to create register_fest_user.');
        }
        throw rpcError;
      }
      if (result && !result.success) throw new Error(result.message || 'Registration failed');

      setIsSubmitted(true);
      toast.success("Registration Submitted!", {
        description: "Your proof has been submitted for verification. You'll receive an email once verified.",
      });

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
                <span className="w-1 h-6 bg-red-500 rounded-full" /> Personal Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Full Name</Label>
                  <Input
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
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
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
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
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="bg-black/40 border-white/10 text-white focus:border-red-500"
                  placeholder="john@example.com"
                />
                <p className="text-xs text-zinc-500">Your Fest Code will be sent to this email.</p>
              </div>
            </div>

            {/* Academic Details */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <span className="w-1 h-6 bg-purple-500 rounded-full" /> Academic Details
              </h3>

              <div className="space-y-2">
                <Label className="text-zinc-300">Education</Label>
                <Select onValueChange={v => setFormData({ ...formData, education: v })}>
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
                  onChange={e => setFormData({ ...formData, college: e.target.value })}
                  className="bg-black/40 border-white/10 text-white focus:border-purple-500"
                  placeholder="Institute of Technology"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Year</Label>
                  <Select onValueChange={v => setFormData({ ...formData, year: v })}>
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
                    onChange={e => setFormData({ ...formData, branch: e.target.value })}
                    className="bg-black/40 border-white/10 text-white focus:border-purple-500"
                    placeholder="CSE, ECE, etc."
                  />
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <span className="w-1 h-6 bg-green-500 rounded-full" /> Payment
              </h3>

              <div className="bg-gradient-to-br from-green-900/20 to-black p-6 rounded-xl border border-green-500/20">
                <div className="mb-6 text-center">
                  <p className="text-zinc-300 mb-2">Registration Fee</p>
                  <div className="text-4xl font-bold text-green-500">₹150</div>
                </div>

                <div className="space-y-6">
                  {/* QR Code Section */}
                  {paymentSettings.qrCodeUrl && (
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-zinc-300 font-semibold">Scan to Pay via UPI</p>
                      <div className="bg-white p-4 rounded-lg">
                        <img 
                          src={paymentSettings.qrCodeUrl} 
                          alt="UPI QR Code" 
                          className="w-48 h-48 object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* UPI ID Section */}
                  {paymentSettings.upiId && (
                    <div className="text-center">
                      <p className="text-zinc-400 text-sm mb-2">Or transfer to UPI ID</p>
                      <div className="flex items-center justify-center gap-2 bg-green-950/30 p-3 rounded-lg border border-green-900/50">
                        <code className="text-green-300 font-mono text-lg">{paymentSettings.upiId}</code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(paymentSettings.upiId);
                            toast.success('UPI ID copied to clipboard!');
                          }}
                          className="text-green-400 hover:text-green-300 text-sm ml-2"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-green-950/20 border border-green-900/30 rounded-lg flex items-start gap-3">
                    <div className="p-2 bg-green-900/20 rounded-full flex-shrink-0">
                      <Zap className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-sm text-green-200/80">
                      Please complete the payment and we'll verify it to send you your unique Fest Code.
                    </p>
                  </div>
                </div>
              </div>

              {/* Proof Upload Section */}
              <div className="space-y-3 pt-6 border-t border-green-500/20">
                <label className="text-zinc-300 font-semibold flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Payment Proof <span className="text-yellow-500">*</span>
                </label>
                <p className="text-xs text-zinc-500">Upload a screenshot of your payment confirmation (UPI receipt, bank transfer, etc.)</p>
                
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={e => {
                      if (e.target.files?.[0]) {
                        const file = e.target.files[0];
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error('File size must be less than 5MB');
                          return;
                        }
                        setFormData({ ...formData, paymentProof: file });
                      }
                    }}
                    className="hidden"
                    id="proof-upload"
                  />
                  
                  <label
                    htmlFor="proof-upload"
                    className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                      formData.paymentProof
                        ? 'border-green-500 bg-green-950/20'
                        : 'border-white/20 bg-black/40 hover:border-green-500/50'
                    }`}
                  >
                    {formData.paymentProof ? (
                      <>
                        <FileText className="w-5 h-5 text-green-500" />
                        <span className="text-green-300 font-medium">{formData.paymentProof.name}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-zinc-400" />
                        <span className="text-zinc-400">Click to upload or drag and drop</span>
                      </>
                    )}
                  </label>
                </div>

                {formData.paymentProof && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentProof: null })}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove file
                  </button>
                )}
              </div>
            </div>

            <div className="pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 shadow-lg shadow-red-900/20"
              >
                {loading ? (
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

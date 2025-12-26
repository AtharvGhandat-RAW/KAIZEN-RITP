import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Upload, FileText, Zap } from 'lucide-react';
import { AtmosphericBackground } from '@/components/AtmosphericBackground';

function uuid() {
  if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
    return (crypto as any).randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function FestRegistrationRebuilt() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bucketReady, setBucketReady] = useState(true);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    education: '',
    college: '',
    year: '',
    branch: '',
    file: null as File | null,
  });
  const [paymentSettings, setPaymentSettings] = useState({
    upiId: '',
    qrCodeUrl: ''
  });

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

  useEffect(() => {
    checkBucket();
    fetchPaymentSettings();
  }, []);

  const checkBucket = async () => {
    try {
      const { error } = await supabase.storage.from('proof-uploads').list('', { limit: 1 });
      if (error) {
        const msg = (error as any)?.message || String(error);
        if (msg.toLowerCase().includes('bucket not found')) {
          setBucketReady(false);
          toast.error('Storage bucket missing. Ask admin to run migration to create proof-uploads.');
          return;
        }
      }
      setBucketReady(true);
    } catch (e) {
      setBucketReady(true);
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const { data } = await supabase
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

  const onChange = (key: keyof typeof form, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleUpload = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      if (file.size > MAX_FILE_SIZE) { toast.error('File too large (max 5MB)'); return null; }
      if (!ALLOWED_TYPES.includes(file.type)) { toast.error('Unsupported file type (JPG/PNG/PDF only)'); return null; }
      const safeBase = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\s+/g, '_');
      const path = `proofs/${uuid()}_${safeBase}`;
      const { error } = await supabase.storage.from('proof-uploads').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });
      if (error) {
        const msg = (error as any)?.message || String(error);
        if (msg.toLowerCase().includes('bucket not found')) {
          toast.error('Storage bucket missing. Ask admin to run migration to create proof-uploads.');
        }
        console.error('Upload error:', error);
        return null;
      }
      return path;
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const required = ['full_name','email','phone','education','college','year','branch'] as const;
      for (const k of required) {
        if (!(form as any)[k]) { toast.error('Please fill all required fields'); setLoading(false); return; }
      }

      let proofPath: string | null = null;
      if (form.file) {
        if (!bucketReady) { toast.error('Storage bucket missing. Submit without file or try later.'); setLoading(false); return; }
        proofPath = await handleUpload(form.file);
        if (!proofPath) { setLoading(false); return; }
      }

      const { data, error } = await supabase.rpc('register_fest_user' as any, {
        p_full_name: form.full_name,
        p_email: form.email.toLowerCase().trim(),
        p_phone: form.phone,
        p_education: form.education,
        p_college: form.college,
        p_year: form.year,
        p_branch: form.branch,
        p_payment_proof_url: proofPath,
      }) as any;
      if (error) {
        const msg = (error as any)?.message || String(error);
        if (msg.toLowerCase().includes('could not find the function')) {
          toast.error('Registration function missing. Ask admin to run the SQL migration.');
        }
        throw error;
      }
      if (data && data.success === false) { throw new Error(data.message || 'Registration failed'); }
      toast.success('Registration submitted! We will verify your proof.');
      setForm({ full_name:'', email:'', phone:'', education:'', college:'', year:'', branch:'', file: null });
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error(err.message || 'Failed to submit registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative flex items-center justify-center p-4">
      <AtmosphericBackground />
      
      <div className="relative z-10 w-full max-w-3xl animate-in fade-in zoom-in duration-500">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-purple-600 mb-2">
              Fest Registration
            </h1>
            <p className="text-zinc-400">Join us for an unforgettable experience</p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            {/* Personal Details Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <span className="w-1 h-6 bg-red-500 rounded-full" /> Personal Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Full Name</Label>
                  <Input 
                    required
                    value={form.full_name} 
                    onChange={e=>onChange('full_name', e.target.value)}
                    className="bg-black/40 border-white/10 text-white focus:border-red-500"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Email</Label>
                  <Input 
                    required
                    type="email" 
                    value={form.email} 
                    onChange={e=>onChange('email', e.target.value)}
                    className="bg-black/40 border-white/10 text-white focus:border-red-500"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Phone</Label>
                  <Input 
                    required
                    value={form.phone} 
                    onChange={e=>onChange('phone', e.target.value)}
                    className="bg-black/40 border-white/10 text-white focus:border-red-500"
                    placeholder="+91 9876543210"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Education</Label>
                  <Select onValueChange={v => onChange('education', v)} value={form.education}>
                    <SelectTrigger className="bg-black/40 border-white/10 text-white">
                      <SelectValue placeholder="Select Education" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="B.Tech">B.Tech</SelectItem>
                      <SelectItem value="M.Tech">M.Tech</SelectItem>
                      <SelectItem value="BCA">BCA</SelectItem>
                      <SelectItem value="MCA">MCA</SelectItem>
                      <SelectItem value="Degree">Degree</SelectItem>
                      <SelectItem value="Diploma">Diploma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">College Name</Label>
                <Input 
                  required
                  value={form.college} 
                  onChange={e=>onChange('college', e.target.value)}
                  className="bg-black/40 border-white/10 text-white focus:border-red-500"
                  placeholder="Institute of Technology"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Year</Label>
                  <Select onValueChange={v => onChange('year', v)} value={form.year}>
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
                    value={form.branch} 
                    onChange={e=>onChange('branch', e.target.value)}
                    className="bg-black/40 border-white/10 text-white focus:border-red-500"
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
                  {paymentSettings.qrCodeUrl && (
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-zinc-300 font-semibold">Scan to Pay via UPI</p>
                      <div className="bg-white p-4 rounded-lg">
                        <img src={paymentSettings.qrCodeUrl} alt="UPI QR Code" className="w-48 h-48 object-contain"/>
                      </div>
                    </div>
                  )}

                  {paymentSettings.upiId && (
                    <div className="text-center">
                      <p className="text-zinc-400 text-sm mb-2">Or transfer to UPI ID</p>
                      <div className="flex items-center justify-center gap-2 bg-green-950/30 p-3 rounded-lg border border-green-900/50">
                        <code className="text-green-300 font-mono text-lg">{paymentSettings.upiId}</code>
                        <button type="button" onClick={() => { navigator.clipboard.writeText(paymentSettings.upiId); toast.success('UPI ID copied!'); }} className="text-green-400 hover:text-green-300 text-sm ml-2">Copy</button>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-green-950/20 border border-green-900/30 rounded-lg flex items-start gap-3">
                    <div className="p-2 bg-green-900/20 rounded-full flex-shrink-0">
                      <Zap className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-sm text-green-200/80">Please complete the payment and we'll verify it to send you your unique Fest Code.</p>
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
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={e => onChange('file', e.target.files?.[0] || null)}
                    className="hidden"
                    id="proof-upload"
                  />
                  
                  <label
                    htmlFor="proof-upload"
                    className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                      form.file
                        ? 'border-green-500 bg-green-950/20'
                        : 'border-white/20 bg-black/40 hover:border-green-500/50'
                    }`}
                  >
                    {form.file ? (
                      <>
                        <FileText className="w-5 h-5 text-green-500" />
                        <span className="text-green-300 font-medium">{form.file.name}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-zinc-400" />
                        <span className="text-zinc-400">Click to upload or drag and drop</span>
                      </>
                    )}
                  </label>
                </div>

                {form.file && (
                  <button
                    type="button"
                    onClick={() => onChange('file', null)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove file
                  </button>
                )}
                {!bucketReady && <p className="text-red-400 text-sm mt-1">Storage not ready. Submit without file or ask admin to run migration.</p>}
              </div>
            </div>

            <div className="pt-6">
              <Button
                type="submit"
                disabled={loading || uploading}
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

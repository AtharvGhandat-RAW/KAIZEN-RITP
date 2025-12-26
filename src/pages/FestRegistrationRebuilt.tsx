import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

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

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

  useEffect(() => {
    checkBucket();
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
      // basic validation
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

      const { data, error } = await supabase.rpc('register_fest_user', {
        p_full_name: form.full_name,
        p_email: form.email.toLowerCase().trim(),
        p_phone: form.phone,
        p_education: form.education,
        p_college: form.college,
        p_year: form.year,
        p_branch: form.branch,
        p_payment_proof_url: proofPath,
      });
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
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-4">Fest Registration</h1>
      <form onSubmit={submit} className="space-y-4 max-w-xl">
        <div>
          <Label className="text-zinc-300">Full Name</Label>
          <Input className="bg-zinc-900 border-zinc-700 text-white" value={form.full_name} onChange={e=>onChange('full_name', e.target.value)} />
        </div>
        <div>
          <Label className="text-zinc-300">Email</Label>
          <Input className="bg-zinc-900 border-zinc-700 text-white" type="email" value={form.email} onChange={e=>onChange('email', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-zinc-300">Phone</Label>
            <Input className="bg-zinc-900 border-zinc-700 text-white" value={form.phone} onChange={e=>onChange('phone', e.target.value)} />
          </div>
          <div>
            <Label className="text-zinc-300">Education</Label>
            <Input className="bg-zinc-900 border-zinc-700 text-white" value={form.education} onChange={e=>onChange('education', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-zinc-300">College</Label>
            <Input className="bg-zinc-900 border-zinc-700 text-white" value={form.college} onChange={e=>onChange('college', e.target.value)} />
          </div>
          <div>
            <Label className="text-zinc-300">Year</Label>
            <Input className="bg-zinc-900 border-zinc-700 text-white" value={form.year} onChange={e=>onChange('year', e.target.value)} />
          </div>
        </div>
        <div>
          <Label className="text-zinc-300">Branch</Label>
          <Input className="bg-zinc-900 border-zinc-700 text-white" value={form.branch} onChange={e=>onChange('branch', e.target.value)} />
        </div>

        <div>
          <Label className="text-zinc-300">Upload Payment Proof (JPG/PNG/PDF, max 5MB)</Label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={(e)=>onChange('file', e.target.files?.[0] || null)}
            className="mt-2"
          />
          {form.file && <p className="text-zinc-400 text-sm mt-1">Selected: {form.file.name}</p>}
          {!bucketReady && <p className="text-red-400 text-sm mt-1">Storage not ready. Submit without file or ask admin to run migration.</p>}
        </div>

        <Button type="submit" disabled={loading || uploading} className="bg-red-600 hover:bg-red-700">
          {loading ? 'Submitting...' : 'Submit Registration'}
        </Button>
      </form>
    </div>
  );
}

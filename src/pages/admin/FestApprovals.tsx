import { AdminLayout } from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Eye, Loader2, RefreshCw, Search, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  college: string;
  fest_payment_status: string;
  fest_payment_proof_url: string;
  fest_registration_id: string | null;
  is_fest_registered: boolean;
  created_at: string;
}

export default function FestApprovals() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .not('fest_payment_status', 'is', null)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setProfiles((data as unknown as Profile[]) || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const generateFestCode = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `KZN26-${random}`;
  };

  const handleApprove = async (profile: Profile) => {
    if (!confirm(`Approve registration for ${profile.full_name}?`)) return;

    setProcessingId(profile.id);
    try {
      const festCode = generateFestCode();

      // 1. Update Profile
      const { error: updateError } = await (supabase
        .from('profiles') as any)
        .update({
          fest_payment_status: 'approved',
          is_fest_registered: true,
          fest_registration_id: festCode
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // 1.b Update the corresponding fest_registrations row to mark completed and store the final registration code
      try {
        const { error: regError } = await (supabase
          .from('fest_registrations') as any)
          .update({ registration_code: festCode, payment_status: 'completed' })
          .eq('profile_id', profile.id)
          .eq('payment_status', 'pending');

        if (regError) console.warn('Could not update fest_registrations for profile:', regError);
      } catch (err) {
        console.warn('Error updating fest_registrations:', err);
      }

      // 2. Send Email
      const { error: emailError } = await supabase.functions.invoke('send-registration-email', {
        body: {
          to: profile.email,
          type: 'fest_code_approval',
          data: {
            name: profile.full_name,
            festCode: festCode
          }
        }
      });

      if (emailError) {
        console.error('Email sending failed:', emailError);
        toast.warning('Registration approved, but email failed to send.');
      } else {
        toast.success(`Approved! Code: ${festCode} sent to user.`);
      }

      // Refresh list
      fetchProfiles();

    } catch (error: any) {
      console.error('Approval error:', error);
      toast.error(error.message || 'Failed to approve');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (profile: Profile) => {
    if (!confirm(`Reject registration for ${profile.full_name}?`)) return;

    setProcessingId(profile.id);
    try {
      const { error } = await (supabase
        .from('profiles') as any)
        .update({
          fest_payment_status: 'rejected',
          is_fest_registered: false,
          fest_registration_id: null
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Registration rejected');
      fetchProfiles();
    } catch (error: any) {
      console.error('Rejection error:', error);
      toast.error('Failed to reject');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredProfiles = profiles.filter(p => {
    const matchesSearch =
      p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.college?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.fest_payment_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Fest Approvals</h1>
            <p className="text-gray-400">Manage main fest registrations and payments</p>
          </div>
          <Button onClick={fetchProfiles} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 bg-white/5 p-4 rounded-lg border border-white/10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, college..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-black/50 border-white/10 text-white"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                onClick={() => setStatusFilter(status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-gray-400">Date</TableHead>
                <TableHead className="text-gray-400">Student</TableHead>
                <TableHead className="text-gray-400">College</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Proof</TableHead>
                <TableHead className="text-gray-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredProfiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                    No registrations found
                  </TableCell>
                </TableRow>
              ) : (
                filteredProfiles.map((profile) => (
                  <TableRow key={profile.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-gray-300">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{profile.full_name}</span>
                        <span className="text-gray-500 text-xs">{profile.email}</span>
                        <span className="text-gray-500 text-xs">{profile.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">{profile.college}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          profile.fest_payment_status === 'approved' ? 'default' :
                            profile.fest_payment_status === 'rejected' ? 'destructive' : 'secondary'
                        }
                        className={
                          profile.fest_payment_status === 'approved' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' :
                            profile.fest_payment_status === 'rejected' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' :
                              'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                        }
                      >
                        {profile.fest_payment_status}
                      </Badge>
                      {profile.fest_registration_id && (
                        <div className="text-xs text-green-400 mt-1 font-mono">
                          {profile.fest_registration_id}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {profile.fest_payment_proof_url ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                              <Eye className="w-4 h-4 mr-1" /> View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Payment Proof - {profile.full_name}</DialogTitle>
                            </DialogHeader>
                            <div className="mt-4 flex justify-center bg-black/50 p-4 rounded-lg">
                              <img
                                src={profile.fest_payment_proof_url}
                                alt="Payment Proof"
                                className="max-h-[70vh] object-contain"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span className="text-gray-500 text-xs">No proof</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {profile.fest_payment_status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-400 hover:text-green-300 hover:bg-green-400/10"
                            onClick={() => handleApprove(profile)}
                            disabled={!!processingId}
                          >
                            {processingId === profile.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            onClick={() => handleReject(profile)}
                            disabled={!!processingId}
                          >
                            {processingId === profile.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}

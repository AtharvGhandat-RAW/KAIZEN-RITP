import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, Eye, Download, FileText } from 'lucide-react';

interface ProofRecord {
  id: string;
  registration_id: string;
  file_path: string;
  file_name: string;
  proof_status: string;
  admin_notes: string;
  uploaded_at: string;
  registration: {
    id: string;
    profile_id: string;
    profile: {
      full_name: string;
      email: string;
      college: string;
      phone?: string;
    };
  };
}

export default function ProofVerificationPanel() {
  const [proofs, setProofs] = useState<ProofRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<ProofRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [approving, setApproving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchProofs();
  }, [filterStatus]);

  const fetchProofs = async () => {
    try {
      setLoading(true);
      let query = (supabase as any)
        .from('proof_uploads')
        .select(`
          id,
          registration_id,
          file_path,
          file_name,
          file_size,
          proof_status,
          admin_notes,
          uploaded_at,
          registration:registration_id(
            id,
            profile_id,
            payment_status,
            profile:profile_id(
              id,
              full_name,
              email,
              college,
              phone
            )
          )
        `);

      if (filterStatus !== 'all') {
        query = query.eq('proof_status', filterStatus);
      }

      const { data, error } = await query.order('uploaded_at', { ascending: false });

      if (error) throw error;
      setProofs((data as ProofRecord[]) || []);
    } catch (error: any) {
      console.error('Error fetching proofs:', error);
      toast.error('Failed to fetch proof uploads');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (proof: ProofRecord) => {
    try {
      setSelectedProof(proof);
      setAdminNotes(proof.admin_notes || '');

      // Get signed URL for preview
      const { data, error } = await supabase.storage
        .from('proof-uploads')
        .createSignedUrl(proof.file_path, 3600);

      if (error) throw error;
      setPreviewUrl(data?.signedUrl || null);
      setShowDetails(true);
    } catch (error: any) {
      console.error('Error loading preview:', error);
      toast.error('Failed to load preview');
    }
  };

  const handleApprove = async () => {
    if (!selectedProof) return;

    try {
      setApproving(true);

      // Update proof status
      const { error: updateError } = await (supabase as any)
        .from('proof_uploads')
        .update({
          proof_status: 'approved',
          admin_notes: adminNotes,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedProof.id);

      if (updateError) throw updateError;

      // Update registration proof_status
      const { error: regError } = await supabase
        .from('registrations')
        .update({
          proof_status: 'approved',
          payment_status: 'completed',
        })
        .eq('id', selectedProof.registration_id);

      if (regError) throw regError;

      toast.success('Proof approved successfully');
      setShowDetails(false);
      fetchProofs();
    } catch (error: any) {
      console.error('Error approving proof:', error);
      toast.error('Failed to approve proof');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProof) return;

    try {
      setApproving(true);

      if (!adminNotes.trim()) {
        toast.error('Please provide a reason for rejection');
        setApproving(false);
        return;
      }

      // Update proof status
      const { error: updateError } = await (supabase as any)
        .from('proof_uploads')
        .update({
          proof_status: 'rejected',
          admin_notes: adminNotes,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedProof.id);

      if (updateError) throw updateError;

      // Update registration proof_status
      const { error: regError } = await supabase
        .from('registrations')
        .update({
          proof_status: 'rejected',
          payment_status: 'failed',
        })
        .eq('id', selectedProof.registration_id);

      if (regError) throw regError;

      toast.success('Proof rejected successfully');
      setShowDetails(false);
      fetchProofs();
    } catch (error: any) {
      console.error('Error rejecting proof:', error);
      toast.error('Failed to reject proof');
    } finally {
      setApproving(false);
    }
  };

  const handleDownload = async (proof: ProofRecord) => {
    try {
      const { data, error } = await supabase.storage
        .from('proof-uploads')
        .download(proof.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = proof.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading proof:', error);
      toast.error('Failed to download proof');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Payment Proof Verification</h1>
        <p className="text-zinc-400">Review and verify payment proofs from festival registrations</p>
      </div>

      {/* Filter Section */}
      <div className="flex gap-4 items-end">
        <div className="space-y-2">
          <Label className="text-zinc-300">Filter by Status</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-zinc-400 text-sm">
          {proofs.length} record{proofs.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Proof List */}
      {proofs.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-12 text-center">
          <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">No proof uploads found with the selected filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {proofs.map((proof) => (
            <div
              key={proof.id}
              className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-white font-semibold">
                    {proof.registration?.profile?.full_name}
                  </h3>
                  <p className="text-sm text-zinc-400">{proof.registration?.profile?.email}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {proof.registration?.profile?.college}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      proof.proof_status === 'approved'
                        ? 'bg-green-900/30 text-green-300 border border-green-700'
                        : proof.proof_status === 'rejected'
                        ? 'bg-red-900/30 text-red-300 border border-red-700'
                        : 'bg-yellow-900/30 text-yellow-300 border border-yellow-700'
                    }`}
                  >
                    {proof.proof_status.charAt(0).toUpperCase() + proof.proof_status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="text-xs text-zinc-500 mb-3">
                Uploaded: {new Date(proof.uploaded_at).toLocaleDateString()} at{' '}
                {new Date(proof.uploaded_at).toLocaleTimeString()}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handlePreview(proof)}
                  variant="outline"
                  size="sm"
                  className="bg-blue-900/20 border-blue-700 text-blue-300 hover:bg-blue-900/40"
                >
                  <Eye className="w-4 h-4 mr-2" /> Review
                </Button>
                <Button
                  onClick={() => handleDownload(proof)}
                  variant="outline"
                  size="sm"
                  className="bg-gray-700/20 border-gray-600 text-gray-300 hover:bg-gray-700/40"
                >
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedProof && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Review Proof</h2>
              <button
                onClick={() => {
                  setShowDetails(false);
                  setPreviewUrl(null);
                }}
                className="text-zinc-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">User Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-zinc-800/30 p-4 rounded-lg">
                  <div>
                    <p className="text-zinc-400 text-sm">Name</p>
                    <p className="text-white font-medium">
                      {selectedProof.registration?.profile?.full_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">Email</p>
                    <p className="text-white font-medium">
                      {selectedProof.registration?.profile?.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">College</p>
                    <p className="text-white font-medium">
                      {selectedProof.registration?.profile?.college}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">Phone</p>
                    <p className="text-white font-medium">
                      {selectedProof.registration?.profile?.phone || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {previewUrl && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Proof Preview</h3>
                  <div className="bg-zinc-800/30 p-4 rounded-lg">
                    {selectedProof.file_name.endsWith('.pdf') ? (
                      <div className="text-center text-zinc-400">
                        <FileText className="w-16 h-16 mx-auto mb-2" />
                        <p>PDF File: {selectedProof.file_name}</p>
                      </div>
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Proof"
                        className="max-h-80 mx-auto rounded-lg object-contain"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <Label className="text-white mb-2 block">Admin Notes</Label>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder="Enter your review notes..."
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-3 focus:border-red-500 focus:outline-none"
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-zinc-800">
                <Button
                  onClick={handleApprove}
                  disabled={approving}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold h-11"
                >
                  {approving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={approving}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold h-11"
                >
                  {approving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowDetails(false);
                    setPreviewUrl(null);
                  }}
                  variant="outline"
                  className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

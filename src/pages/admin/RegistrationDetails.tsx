import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Download, FileDown } from 'lucide-react';

interface Registration {
  id: string;
  created_at: string;
  payment_status: string;
  payment_proof_url: string | null;
  payment_id: string | null;
  profiles: { full_name: string; email: string; phone: string; college: string; year: string; branch: string };
  events: { name: string };
  teams: { name: string } | null;
}

export default function RegistrationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRegistration = useCallback(async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('registrations')
      .select(`
        id,
        created_at,
        payment_status,
        payment_proof_url,
        payment_id,
        profiles (full_name, email, phone, college, year, branch),
        events (name),
        teams (name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      toast({ title: 'Error', description: 'Failed to load registration details', variant: 'destructive' });
      navigate('/admin/registrations');
    } else {
      setRegistration(data as Registration);
    }
    setLoading(false);
  }, [id, navigate, toast]);

  useEffect(() => {
    fetchRegistration();
  }, [fetchRegistration]);

  const updatePaymentStatus = async (status: string) => {
    if (!registration) return;

    const { error } = await supabase
      .from('registrations')
      .update({ payment_status: status })
      .eq('id', registration.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Payment status updated' });
      setRegistration({ ...registration, payment_status: status });

      // Send email notification if payment is completed
      if (status === 'completed') {
        try {
          await supabase.functions.invoke('send-registration-email', {
            body: {
              to: registration.profiles.email,
              type: 'payment_update',
              data: {
                name: registration.profiles.full_name,
                eventName: registration.events.name,
                paymentStatus: 'completed',
              }
            }
          });
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
        }
      }
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['super_admin', 'event_manager', 'finance']}>
        <AdminLayout>
          <div className="flex items-center justify-center h-screen">
            <div className="text-white text-xl">Loading...</div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (!registration) {
    return null;
  }

  return (
    <ProtectedRoute requiredRoles={['super_admin', 'event_manager', 'finance']}>
      <AdminLayout>
        <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 print:mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin/registrations')}
                className="text-white hover:bg-red-600/10 print:hidden"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                Registration Details
              </h1>
            </div>
            <div className="flex gap-2 print:hidden">
              <Button
                onClick={handlePrintPDF}
                className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/20"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Generate PDF
              </Button>
              {registration.payment_proof_url && (
                <Button
                  onClick={() => window.open(registration.payment_proof_url!, '_blank')}
                  className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Proof
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            {/* Payment Proof - First */}
            <div className="bg-black/40 backdrop-blur-md border border-red-600/30 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2 text-lg">
                <span className="w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></span>
                Payment Proof Screenshot
              </h3>
              {registration.payment_proof_url ? (
                <div className="border border-white/10 rounded-lg overflow-hidden bg-black/60">
                  <img
                    src={registration.payment_proof_url}
                    alt="Payment proof screenshot"
                    className="w-full h-auto max-h-[500px] object-contain"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      const errorDiv = document.createElement('div');
                      errorDiv.className = 'p-8 text-center text-red-500';
                      errorDiv.textContent = 'Failed to load image';
                      target.parentElement?.appendChild(errorDiv);
                    }}
                  />
                </div>
              ) : (
                <div className="border border-dashed border-white/20 rounded-lg p-12 text-center">
                  <p className="text-white/40">No payment proof uploaded</p>
                </div>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Student Information */}
              <div className="bg-black/40 backdrop-blur-md border border-red-600/30 rounded-xl p-6 print:break-inside-avoid">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2 text-lg">
                  <span className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                  Student Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-white/50 block mb-1 text-sm">Full Name:</span>
                    <p className="text-white text-lg font-medium">{registration.profiles?.full_name}</p>
                  </div>
                  <div>
                    <span className="text-white/50 block mb-1 text-sm">Email:</span>
                    <p className="text-white break-all">{registration.profiles?.email}</p>
                  </div>
                  <div>
                    <span className="text-white/50 block mb-1 text-sm">Phone:</span>
                    <p className="text-white">{registration.profiles?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-white/50 block mb-1 text-sm">College:</span>
                    <p className="text-white">{registration.profiles?.college || 'Not provided'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-white/50 block mb-1 text-sm">Year:</span>
                      <p className="text-white">{registration.profiles?.year || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-white/50 block mb-1 text-sm">Branch:</span>
                      <p className="text-white">{registration.profiles?.branch || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Information */}
              <div className="bg-black/40 backdrop-blur-md border border-red-600/30 rounded-xl p-6 print:break-inside-avoid">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2 text-lg">
                  <span className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
                  Event Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-white/50 block mb-1 text-sm">Event Name:</span>
                    <p className="text-white text-lg font-medium">{registration.events?.name}</p>
                  </div>
                  <div>
                    <span className="text-white/50 block mb-1 text-sm">Team:</span>
                    <p className="text-white">{registration.teams?.name || 'Individual / Solo'}</p>
                  </div>
                  <div>
                    <span className="text-white/50 block mb-1 text-sm">Registration Date:</span>
                    <p className="text-white">
                      {new Date(registration.created_at).toLocaleString('en-IN', {
                        dateStyle: 'long',
                        timeStyle: 'short'
                      })}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Payment Information */}
            <div className="bg-black/40 backdrop-blur-md border border-red-600/30 rounded-xl p-6 print:break-inside-avoid">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2 text-lg">
                <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                Payment Information
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="text-white/50 block mb-1 text-sm">Payment ID / Transaction ID:</span>
                  <p className="text-white break-all">{registration.payment_id || 'Not provided'}</p>
                </div>
                <div className="print:hidden">
                  <span className="text-white/50 block mb-2 text-sm">Payment Status:</span>
                  <Select
                    value={registration.payment_status}
                    onValueChange={updatePaymentStatus}
                  >
                    <SelectTrigger className={`w-full ${registration.payment_status === 'completed'
                      ? 'bg-green-600/20 text-green-500 border-green-600/30'
                      : registration.payment_status === 'failed'
                        ? 'bg-red-600/20 text-red-500 border-red-600/30'
                        : 'bg-yellow-600/20 text-yellow-500 border-yellow-600/30'
                      }`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-red-600/30 text-white">
                      <SelectItem value="pending" className="focus:bg-red-600/20 focus:text-white">Pending</SelectItem>
                      <SelectItem value="completed" className="focus:bg-red-600/20 focus:text-white">Completed</SelectItem>
                      <SelectItem value="failed" className="focus:bg-red-600/20 focus:text-white">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="hidden print:block">
                  <span className="text-white/50 block mb-2 text-sm">Payment Status:</span>
                  <p className={`text-white text-lg font-medium ${registration.payment_status === 'completed'
                    ? 'text-green-500'
                    : registration.payment_status === 'failed'
                      ? 'text-red-500'
                      : 'text-yellow-500'
                    }`}>
                    {registration.payment_status?.charAt(0).toUpperCase() + registration.payment_status?.slice(1)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}

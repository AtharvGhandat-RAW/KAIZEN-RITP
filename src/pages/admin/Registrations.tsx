import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import {
  Download, Search, Users, CheckCircle, Clock, XCircle,
  Image, ExternalLink, RefreshCw, Filter, UserCheck, UserX, Eye,
  Mail, Phone, Building, GraduationCap, Calendar
} from 'lucide-react';

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

export default function Registrations() {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkAction, setBulkAction] = useState<{ type: 'completed' | 'failed', count: number } | null>(null);
  const { toast } = useToast();

  // Stats
  const stats = useMemo(() => {
    const total = registrations.length;
    const completed = registrations.filter(r => r.payment_status === 'completed').length;
    const pending = registrations.filter(r => r.payment_status === 'pending').length;
    const failed = registrations.filter(r => r.payment_status === 'failed').length;
    return { total, completed, pending, failed };
  }, [registrations]);

  const fetchRegistrations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const { data } = await supabase
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
      .order('created_at', { ascending: false });

    if (data) setRegistrations(data as Registration[]);
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    fetchRegistrations();

    const channel = supabase
      .channel('registrations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => {
        fetchRegistrations(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRegistrations]);

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    let filtered = registrations;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.payment_status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.profiles?.full_name?.toLowerCase().includes(query) ||
        r.profiles?.email?.toLowerCase().includes(query) ||
        r.profiles?.phone?.includes(query) ||
        r.events?.name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [registrations, statusFilter, searchQuery]);

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRegistrations.length && filteredRegistrations.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRegistrations.map(r => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Bulk update handler
  const executeBulkUpdate = async () => {
    if (!bulkAction || selectedIds.size === 0) return;

    setBulkProcessing(true);
    const status = bulkAction.type;
    const idsToUpdate = Array.from(selectedIds);

    // Optimistic update
    const previousRegistrations = [...registrations];
    setRegistrations(prev => prev.map(r => 
      idsToUpdate.includes(r.id) ? { ...r, payment_status: status } : r
    ));

    const { error } = await supabase
      .from('registrations')
      .update({ payment_status: status })
      .in('id', idsToUpdate);

    if (error) {
      setRegistrations(previousRegistrations); // Revert
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Updated ${selectedIds.size} registrations to ${status}` });
      setSelectedIds(new Set());
      // No need to fetchRegistrations() because of optimistic update + real-time subscription
    }
    setBulkProcessing(false);
    setBulkAction(null);
  };

  const updatePaymentStatus = async (id: string, status: string) => {
    // Optimistic update
    const previousRegistrations = [...registrations];
    setRegistrations(prev => prev.map(r => 
      r.id === id ? { ...r, payment_status: status } : r
    ));

    const registration = registrations.find(r => r.id === id);

    const { error } = await supabase
      .from('registrations')
      .update({ payment_status: status })
      .eq('id', id);

    if (error) {
      setRegistrations(previousRegistrations); // Revert
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Payment status updated' });

      // Send email notification if payment is completed
      if (status === 'completed' && registration) {
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

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'College', 'Year', 'Branch', 'Event', 'Team', 'Payment Status', 'Payment ID', 'Payment Proof URL', 'Date'];
    const rows = filteredRegistrations.map(r => [
      r.profiles?.full_name || '',
      r.profiles?.email || '',
      r.profiles?.phone || '',
      r.profiles?.college || '',
      r.profiles?.year || '',
      r.profiles?.branch || '',
      r.events?.name || '',
      r.teams?.name || 'Individual',
      r.payment_status,
      r.payment_id || '',
      r.payment_proof_url || '',
      new Date(r.created_at).toLocaleDateString()
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <ProtectedRoute requiredRoles={['super_admin', 'event_manager', 'finance']}>
      <AdminLayout>
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <Users className="w-8 h-8 text-red-500" />
                Registrations Management
              </h1>
              <p className="text-white/60 mt-1">Manage and verify all event registrations</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => fetchRegistrations(false)} variant="outline" className="border-red-600/30 hover:bg-red-600/10 backdrop-blur-sm">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/20">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-8 duration-700 delay-100">
            <Card className="bg-black/40 backdrop-blur-md border-red-600/30 p-4 hover:bg-red-900/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-white/60 text-xs">Total</p>
                </div>
              </div>
            </Card>
            <Card className="bg-black/40 backdrop-blur-md border-green-600/30 p-4 cursor-pointer hover:bg-green-600/10 transition-all hover:scale-105" onClick={() => setStatusFilter('completed')}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
                  <p className="text-white/60 text-xs">Completed</p>
                </div>
              </div>
            </Card>
            <Card className="bg-black/40 backdrop-blur-md border-yellow-600/30 p-4 cursor-pointer hover:bg-yellow-600/10 transition-all hover:scale-105" onClick={() => setStatusFilter('pending')}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
                  <p className="text-white/60 text-xs">Pending</p>
                </div>
              </div>
            </Card>
            <Card className="bg-black/40 backdrop-blur-md border-red-600/30 p-4 cursor-pointer hover:bg-red-600/10 transition-all hover:scale-105" onClick={() => setStatusFilter('failed')}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-500">{stats.failed}</p>
                  <p className="text-white/60 text-xs">Failed</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters & Bulk Actions */}
          <Card className="bg-black/40 backdrop-blur-md border-red-600/30 p-4 animate-in fade-in slide-in-from-top-12 duration-700 delay-200">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Search by name, email, phone, or event..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black/40 border-red-600/30 text-white focus:border-red-500 transition-all"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-48 bg-black/40 border-red-600/30 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-red-600/30 text-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            {selectedIds.size > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg animate-in fade-in slide-in-from-top-2">
                <span className="text-blue-400 text-sm font-medium">
                  {selectedIds.size} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setBulkAction({ type: 'completed', count: selectedIds.size })}
                    disabled={bulkProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <UserCheck className="w-4 h-4 mr-1" />
                    Approve All
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setBulkAction({ type: 'failed', count: selectedIds.size })}
                    disabled={bulkProcessing}
                    variant="destructive"
                  >
                    <UserX className="w-4 h-4 mr-1" />
                    Reject All
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setSelectedIds(new Set())}
                    variant="outline"
                    className="border-white/20 hover:bg-white/10"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Registrations Table */}
          <Card className="bg-black/40 backdrop-blur-md border-red-600/30 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-red-600/10">
                  <tr>
                    <th className="px-3 py-3 text-left">
                      <Checkbox
                        checked={selectedIds.size === filteredRegistrations.length && filteredRegistrations.length > 0}
                        onCheckedChange={toggleSelectAll}
                        className="border-white/30"
                      />
                    </th>
                    <th className="px-3 py-3 text-left text-white/90 text-sm">Student</th>
                    <th className="px-3 py-3 text-left text-white/90 text-sm">Contact</th>
                    <th className="px-3 py-3 text-left text-white/90 text-sm hidden lg:table-cell">College</th>
                    <th className="px-3 py-3 text-left text-white/90 text-sm">Event</th>
                    <th className="px-3 py-3 text-left text-white/90 text-sm">Payment</th>
                    <th className="px-3 py-3 text-left text-white/90 text-sm hidden md:table-cell">Proof</th>
                    <th className="px-3 py-3 text-left text-white/90 text-sm hidden xl:table-cell">Date</th>
                    <th className="px-3 py-3 text-left text-white/90 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    // Skeleton Rows
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-t border-red-600/20">
                        <td className="px-3 py-4"><Skeleton className="h-4 w-4 bg-white/10" /></td>
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-9 w-9 rounded-full bg-white/10" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-32 bg-white/10" />
                              <Skeleton className="h-3 w-20 bg-white/10" />
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="space-y-2">
                            <Skeleton className="h-3 w-32 bg-white/10" />
                            <Skeleton className="h-3 w-24 bg-white/10" />
                          </div>
                        </td>
                        <td className="px-3 py-4 hidden lg:table-cell">
                          <div className="space-y-2">
                            <Skeleton className="h-3 w-24 bg-white/10" />
                            <Skeleton className="h-3 w-20 bg-white/10" />
                          </div>
                        </td>
                        <td className="px-3 py-4"><Skeleton className="h-6 w-24 bg-white/10 rounded-full" /></td>
                        <td className="px-3 py-4"><Skeleton className="h-8 w-28 bg-white/10 rounded-md" /></td>
                        <td className="px-3 py-4 hidden md:table-cell"><Skeleton className="h-8 w-16 bg-white/10 rounded-md" /></td>
                        <td className="px-3 py-4 hidden xl:table-cell"><Skeleton className="h-4 w-24 bg-white/10" /></td>
                        <td className="px-3 py-4"><Skeleton className="h-8 w-8 bg-white/10 rounded-md" /></td>
                      </tr>
                    ))
                  ) : (
                    filteredRegistrations.map((reg, index) => (
                      <tr 
                        key={reg.id} 
                        className="border-t border-red-600/20 hover:bg-red-600/5 transition-colors"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-3 py-4">
                          <Checkbox
                            checked={selectedIds.has(reg.id)}
                            onCheckedChange={() => toggleSelect(reg.id)}
                            className="border-white/30"
                          />
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-red-900/20">
                              {reg.profiles?.full_name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div className="text-white font-medium text-sm">{reg.profiles?.full_name}</div>
                              {reg.teams?.name && (
                                <Badge variant="outline" className="text-xs text-white/50 border-white/20 mt-1">
                                  Team: {reg.teams.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-white/70 text-xs">
                              <Mail className="w-3 h-3" />
                              <span className="break-all">{reg.profiles?.email}</span>
                            </div>
                            <div className="flex items-center gap-1 text-white/50 text-xs">
                              <Phone className="w-3 h-3" />
                              {reg.profiles?.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 hidden lg:table-cell">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-white/70 text-xs">
                              <Building className="w-3 h-3" />
                              {reg.profiles?.college}
                            </div>
                            <div className="flex items-center gap-1 text-white/50 text-xs">
                              <GraduationCap className="w-3 h-3" />
                              {reg.profiles?.year} - {reg.profiles?.branch}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <Badge variant="outline" className="text-white/80 border-white/20">
                            {reg.events?.name}
                          </Badge>
                        </td>
                        <td className="px-3 py-4">
                          <Select
                            value={reg.payment_status}
                            onValueChange={(value) => updatePaymentStatus(reg.id, value)}
                          >
                            <SelectTrigger className={`w-28 text-xs ${reg.payment_status === 'completed'
                                ? 'bg-green-600/20 text-green-500 border-green-500/30'
                                : reg.payment_status === 'failed'
                                  ? 'bg-red-600/20 text-red-500 border-red-500/30'
                                  : 'bg-yellow-600/20 text-yellow-500 border-yellow-500/30'
                              }`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-black border-red-600/30 text-white">
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                          </Select>
                          {reg.payment_id && (
                            <p className="text-white/40 text-xs mt-1 truncate max-w-[100px]" title={reg.payment_id}>
                              ID: {reg.payment_id}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-4 hidden md:table-cell">
                          {reg.payment_proof_url ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setImagePreview(reg.payment_proof_url)}
                              className="text-cyan-500 hover:bg-cyan-500/10"
                            >
                              <Image className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          ) : (
                            <span className="text-white/30 text-xs">No proof</span>
                          )}
                        </td>
                        <td className="px-3 py-4 hidden xl:table-cell">
                          <div className="flex items-center gap-1 text-white/60 text-xs">
                            <Calendar className="w-3 h-3" />
                            {new Date(reg.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-500 hover:bg-blue-500/10"
                            onClick={() => navigate(`/admin/registrations/${reg.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {filteredRegistrations.length === 0 && !loading && (
            <Card className="bg-black/40 backdrop-blur-md border-red-600/30 p-12 text-center animate-in fade-in zoom-in duration-500">
              <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 text-lg">No registrations found</p>
              <p className="text-white/40 text-sm mt-1">Try adjusting your search or filters</p>
            </Card>
          )}

          {/* Image Preview Modal */}
          <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
            <DialogContent className="bg-black/95 border-red-600/30 max-w-3xl">
              <DialogHeader>
                <DialogTitle className="text-white">Payment Proof</DialogTitle>
              </DialogHeader>
              <div className="relative">
                {imagePreview && (
                  <>
                    <img
                      src={imagePreview}
                      alt="Payment proof"
                      className="w-full rounded-lg"
                    />
                    <Button
                      size="sm"
                      onClick={() => window.open(imagePreview, '_blank')}
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Open Full
                    </Button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Bulk Action Confirmation Dialog */}
          <AlertDialog open={!!bulkAction} onOpenChange={(open) => !open && setBulkAction(null)}>
            <AlertDialogContent className="bg-black/95 border-red-600/30">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">
                  {bulkAction?.type === 'completed' ? 'Approve' : 'Reject'} {bulkAction?.count} Registrations?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-white/60">
                  Are you sure you want to {bulkAction?.type === 'completed' ? 'approve' : 'reject'} the selected registrations?
                  {bulkAction?.type === 'completed' && " This will send confirmation emails to the students."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-red-600/30 text-white hover:bg-white/10 hover:text-white">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={executeBulkUpdate} 
                  className={bulkAction?.type === 'completed' ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
                >
                  {bulkProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Confirm"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}

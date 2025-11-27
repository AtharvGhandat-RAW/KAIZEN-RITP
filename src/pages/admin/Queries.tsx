import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Eye, Trash2, MessageSquare, Search, Filter, Mail, Clock,
  CheckCircle, AlertCircle, Send, RefreshCw, User, Calendar,
  MessageCircle, Archive, Inbox
} from 'lucide-react';

interface Query {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export default function Queries() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [replyDialog, setReplyDialog] = useState<Query | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  // Stats
  const stats = useMemo(() => {
    const total = queries.length;
    const newQueries = queries.filter(q => q.status === 'new').length;
    const seen = queries.filter(q => q.status === 'seen').length;
    const resolved = queries.filter(q => q.status === 'resolved').length;
    return { total, newQueries, seen, resolved };
  }, [queries]);

  // Filtered queries
  const filteredQueries = useMemo(() => {
    return queries.filter(q => {
      const matchesSearch =
        q.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.message.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [queries, searchQuery, statusFilter]);

  useEffect(() => {
    fetchQueries();

    const channel = supabase
      .channel('queries-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queries' }, () => {
        fetchQueries();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchQueries = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('queries')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setQueries(data);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('queries')
      .update({ status: 'seen' })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('queries')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Query marked as ${status}` });
    }
  };

  const sendReply = async () => {
    if (!replyDialog || !replyMessage.trim()) return;

    setSending(true);
    try {
      // Try to send email via edge function
      await supabase.functions.invoke('send-registration-email', {
        body: {
          to: replyDialog.email,
          type: 'query_reply',
          data: {
            name: replyDialog.name,
            subject: `Re: ${replyDialog.subject}`,
            message: replyMessage,
          }
        }
      });

      // Update query status to resolved
      await supabase
        .from('queries')
        .update({ status: 'resolved' })
        .eq('id', replyDialog.id);

      toast({ title: 'Success', description: 'Reply sent successfully!' });
      setReplyDialog(null);
      setReplyMessage('');
    } catch (error) {
      // Even if email fails, mark as resolved
      await supabase
        .from('queries')
        .update({ status: 'resolved' })
        .eq('id', replyDialog.id);

      toast({
        title: 'Note',
        description: 'Query marked as resolved. Email may not have been sent.',
      });
      setReplyDialog(null);
      setReplyMessage('');
    }
    setSending(false);
  };

  const deleteQuery = async (id: string) => {
    if (!confirm('Are you sure you want to delete this query?')) return;

    const { error } = await supabase
      .from('queries')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Query deleted successfully' });
    }
  };

  return (
        <ProtectedRoute requiredRoles={['super_admin', 'event_manager']}>
      <AdminLayout>
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-red-500" />
                Queries & Support
              </h1>
              <p className="text-white/60 mt-1">Manage and respond to user inquiries</p>
            </div>
            <Button onClick={fetchQueries} variant="outline" className="border-red-600/30 hover:bg-red-600/10 backdrop-blur-sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-8 duration-700 delay-100">
            <Card className="bg-black/40 backdrop-blur-md border-red-600/30 p-4 hover:bg-red-900/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Inbox className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-white/60 text-xs">Total</p>
                </div>
              </div>
            </Card>
            <Card className="bg-black/40 backdrop-blur-md border-yellow-600/30 p-4 cursor-pointer hover:bg-yellow-600/10 transition-all hover:scale-105" onClick={() => setStatusFilter('new')}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-500">{stats.newQueries}</p>
                  <p className="text-white/60 text-xs">New</p>
                </div>
              </div>
            </Card>
            <Card className="bg-black/40 backdrop-blur-md border-orange-600/30 p-4 cursor-pointer hover:bg-orange-600/10 transition-all hover:scale-105" onClick={() => setStatusFilter('seen')}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Eye className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-500">{stats.seen}</p>
                  <p className="text-white/60 text-xs">Seen</p>
                </div>
              </div>
            </Card>
            <Card className="bg-black/40 backdrop-blur-md border-green-600/30 p-4 cursor-pointer hover:bg-green-600/10 transition-all hover:scale-105" onClick={() => setStatusFilter('resolved')}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">{stats.resolved}</p>
                  <p className="text-white/60 text-xs">Resolved</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-black/40 backdrop-blur-md border-red-600/30 p-4 animate-in fade-in slide-in-from-top-12 duration-700 delay-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Search queries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black/40 border-red-600/30 text-white focus:border-red-500 transition-all"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-black/40 border-red-600/30 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-red-600/30 text-white">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="seen">Seen</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Queries List */}
          <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            {filteredQueries.map((query, index) => (
              <Card 
                key={query.id} 
                className={`bg-black/40 backdrop-blur-md border-red-600/20 p-4 sm:p-6 transition-all duration-300 hover:border-red-500/50 ${query.status === 'new' ? 'border-l-4 border-l-yellow-500' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col lg:flex-row gap-4 justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`${query.status === 'new' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' :
                          query.status === 'seen' ? 'bg-orange-500/20 text-orange-500 border-orange-500/30' :
                            'bg-green-500/20 text-green-500 border-green-500/30'
                        }`}>
                        {query.status === 'new' && <AlertCircle className="w-3 h-3 mr-1" />}
                        {query.status === 'seen' && <Eye className="w-3 h-3 mr-1" />}
                        {query.status === 'resolved' && <CheckCircle className="w-3 h-3 mr-1" />}
                        <span className="capitalize">{query.status}</span>
                      </Badge>
                      <span className="text-white/40 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(query.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{query.subject}</h3>
                      <p className="text-white/80 text-sm leading-relaxed bg-white/5 p-3 rounded-lg border border-white/10">
                        {query.message}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-white/60">
                        <User className="w-4 h-4" />
                        {query.name}
                      </div>
                      <div className="flex items-center gap-2 text-white/60">
                        <Mail className="w-4 h-4" />
                        {query.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row lg:flex-col gap-2 justify-end border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-4 mt-2 lg:mt-0">
                    {query.status === 'new' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsRead(query.id)}
                        className="text-orange-500 hover:bg-orange-500/10 justify-start"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Mark Seen
                      </Button>
                    )}
                    {query.status !== 'resolved' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsResolved(query.id)}
                        className="text-green-500 hover:bg-green-500/10 justify-start"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Resolve
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setReplyDialog(query)}
                      className="text-blue-500 hover:bg-blue-500/10 justify-start"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Reply
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteQuery(query.id)}
                      className="text-red-500 hover:bg-red-500/10 justify-start"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {filteredQueries.length === 0 && !loading && (
              <Card className="bg-black/40 backdrop-blur-md border-red-600/30 p-12 text-center animate-in fade-in zoom-in duration-500">
                <MessageSquare className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 text-lg">No queries found</p>
              </Card>
            )}
          </div>
      <AdminLayout>
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                <MessageSquare className="w-8 h-8 text-red-500" />
                Contact Queries
              </h1>
              <p className="text-white/60 mt-1">Manage and respond to visitor inquiries</p>
            </div>
            <Button onClick={fetchQueries} variant="outline" className="border-red-600/30 hover:bg-red-600/10">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="bg-black/40 border-red-600/30 p-4 cursor-pointer hover:bg-black/50" onClick={() => setStatusFilter('all')}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Inbox className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-white/60 text-xs">Total</p>
                </div>
              </div>
            </Card>
            <Card className="bg-black/40 border-red-600/30 p-4 cursor-pointer hover:bg-red-600/5" onClick={() => setStatusFilter('new')}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg relative">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  {stats.newQueries > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  )}
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-500">{stats.newQueries}</p>
                  <p className="text-white/60 text-xs">New</p>
                </div>
              </div>
            </Card>
            <Card className="bg-black/40 border-yellow-600/30 p-4 cursor-pointer hover:bg-yellow-600/5" onClick={() => setStatusFilter('seen')}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Eye className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-500">{stats.seen}</p>
                  <p className="text-white/60 text-xs">Seen</p>
                </div>
              </div>
            </Card>
            <Card className="bg-black/40 border-green-600/30 p-4 cursor-pointer hover:bg-green-600/5" onClick={() => setStatusFilter('resolved')}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">{stats.resolved}</p>
                  <p className="text-white/60 text-xs">Resolved</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-black/40 border-red-600/30 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Search queries by name, email, or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black/40 border-red-600/30"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px] bg-black/40 border-red-600/30">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="seen">Seen</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Queries List */}
          <div className="space-y-4">
            {filteredQueries.map((query) => (
              <Card
                key={query.id}
                className={`bg-black/40 p-4 sm:p-6 transition-all duration-300 hover:border-red-500/50 ${query.status === 'new'
                    ? 'border-red-600/50 shadow-lg shadow-red-600/10'
                    : 'border-red-600/20'
                  }`}
              >
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Query Content */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-red-500" />
                        {query.name}
                      </h3>
                      <Badge className={`text-xs ${query.status === 'new'
                          ? 'bg-red-500/20 text-red-500 border-red-500/30'
                          : query.status === 'seen'
                            ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
                            : 'bg-green-500/20 text-green-500 border-green-500/30'
                        }`}>
                        {query.status === 'new' && <AlertCircle className="w-3 h-3 mr-1" />}
                        {query.status === 'seen' && <Eye className="w-3 h-3 mr-1" />}
                        {query.status === 'resolved' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {query.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${query.email}`} className="hover:text-red-400 transition-colors">
                        {query.email}
                      </a>
                    </div>

                    <div className="bg-black/30 rounded-lg p-4 mb-3">
                      <div className="flex items-center gap-2 text-white/90 font-medium mb-2">
                        <MessageCircle className="w-4 h-4 text-red-500" />
                        {query.subject}
                      </div>
                      <p className="text-white/70 text-sm whitespace-pre-wrap">{query.message}</p>
                    </div>

                    <div className="flex items-center gap-2 text-white/40 text-xs">
                      <Calendar className="w-3 h-3" />
                      {new Date(query.created_at).toLocaleString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row lg:flex-col gap-2 justify-end">
                    {query.status === 'new' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsRead(query.id)}
                        className="text-yellow-500 hover:bg-yellow-600/10"
                        title="Mark as seen"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setReplyDialog(query);
                        if (query.status === 'new') markAsRead(query.id);
                      }}
                      className="text-blue-500 hover:bg-blue-600/10"
                      title="Reply"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    {query.status !== 'resolved' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateStatus(query.id, 'resolved')}
                        className="text-green-500 hover:bg-green-600/10"
                        title="Mark as resolved"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteQuery(query.id)}
                      className="text-red-500 hover:bg-red-600/10"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {filteredQueries.length === 0 && !loading && (
              <Card className="bg-black/40 border-red-600/30 p-12 text-center">
                <MessageSquare className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 text-lg">No queries found</p>
                <p className="text-white/40 text-sm mt-1">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No contact queries received yet'}
                </p>
              </Card>
            )}

            {loading && (
              <div className="text-center py-12">
                <div className="w-10 h-10 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin mx-auto" />
              </div>
            )}
          </div>

          {/* Reply Dialog */}
          <Dialog open={!!replyDialog} onOpenChange={() => setReplyDialog(null)}>
            <DialogContent className="bg-black/95 border-red-600/30 max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-red-500" />
                  Reply to {replyDialog?.name}
                </DialogTitle>
              </DialogHeader>

              {replyDialog && (
                <div className="space-y-4">
                  <div className="bg-black/30 rounded-lg p-3 border border-red-600/20">
                    <p className="text-white/60 text-xs mb-1">Original message:</p>
                    <p className="text-white/80 text-sm font-medium">{replyDialog.subject}</p>
                    <p className="text-white/60 text-sm mt-1">{replyDialog.message}</p>
                  </div>

                  <div>
                    <label className="text-white/70 text-sm mb-2 block">Your reply:</label>
                    <Textarea
                      placeholder="Type your reply here..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="bg-black/40 border-red-600/30 min-h-[150px]"
                    />
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setReplyDialog(null)}
                  className="border-red-600/30"
                >
                  Cancel
                </Button>
                <Button
                  onClick={sendReply}
                  disabled={!replyMessage.trim() || sending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {sending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send Reply
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
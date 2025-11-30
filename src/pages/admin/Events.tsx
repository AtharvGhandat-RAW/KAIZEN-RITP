import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Plus, Edit, Trash2, Eye, EyeOff, Calendar, MapPin, Users,
  IndianRupee, Search, Filter, Star, Clock, CheckCircle,
  AlertCircle, TrendingUp, Copy, ExternalLink, RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Event {
  id: string;
  name: string;
  category: string;
  event_date: string;
  venue: string;
  registration_fee: number;
  max_participants: number;
  current_participants: number;
  status: string;
  is_featured: boolean;
  description?: string;
  registrations?: { count: number }[];
}

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(events.map(e => e.category))];
    return cats.filter(Boolean);
  }, [events]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [events, searchQuery, statusFilter, categoryFilter]);

  // Stats summary
  const stats = useMemo(() => {
    const totalEvents = events.length;
    const upcomingEvents = events.filter(e => e.status === 'upcoming').length;
    const totalRegistrations = events.reduce((sum, e) => sum + (e.registrations?.[0]?.count ?? e.current_participants ?? 0), 0);
    const totalCapacity = events.reduce((sum, e) => sum + e.max_participants, 0);
    const featuredCount = events.filter(e => e.is_featured).length;
    const expectedRevenue = events.reduce((sum, e) => sum + ((e.registrations?.[0]?.count ?? e.current_participants ?? 0) * e.registration_fee), 0);
    return { totalEvents, upcomingEvents, totalRegistrations, totalCapacity, featuredCount, expectedRevenue };
  }, [events]);

  const fetchEvents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const { data } = await supabase
      .from('events')
      .select('*, registrations(count)')
      .order('created_at', { ascending: false });

    if (data) setEvents(data);
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();

    const channel = supabase
      .channel('events-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchEvents(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEvents]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);

    // Optimistic update
    const previousEvents = [...events];
    setEvents(prev => prev.filter(e => e.id !== id));

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      setEvents(previousEvents); // Revert
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Event deleted successfully' });
    }
  };

  const toggleFeatured = async (event: Event) => {
    // Optimistic update
    const previousEvents = [...events];
    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, is_featured: !e.is_featured } : e));

    const { error } = await supabase
      .from('events')
      .update({ is_featured: !event.is_featured })
      .eq('id', event.id);

    if (error) {
      setEvents(previousEvents); // Revert
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: !event.is_featured ? 'Featured' : 'Unfeatured',
        description: `${event.name} has been ${!event.is_featured ? 'added to' : 'removed from'} featured events`
      });
    }
  };

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Clock className="w-3 h-3" />;
      case 'ongoing':
        return <TrendingUp className="w-3 h-3" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  return (
    <ProtectedRoute requiredRoles={['super_admin', 'event_manager']}>
      <AdminLayout>
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                <Calendar className="w-8 h-8 text-red-500" />
                Events Management
              </h1>
              <p className="text-white/60 mt-1">Create, manage and track all KAIZEN events</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={() => fetchEvents(false)} variant="outline" className="border-red-600/30 hover:bg-red-600/10 backdrop-blur-sm">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={() => navigate('/admin/events/new')}
                className="bg-red-600 hover:bg-red-700 flex-1 sm:flex-none shadow-lg shadow-red-900/20 transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* ... Stats Cards ... */}
            <Card className="bg-black/60 border-red-600/20 p-4 hover:bg-red-900/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalEvents}</p>
                  <p className="text-white/60 text-xs">Total Events</p>
                </div>
              </div>
            </Card>
            <Card className="bg-black/60 border-red-600/20 p-4 hover:bg-red-900/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.upcomingEvents}</p>
                  <p className="text-white/60 text-xs">Upcoming</p>
                </div>
              </div>
            </Card>
            <Card className="bg-black/60 border-red-600/20 p-4 hover:bg-red-900/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalRegistrations}</p>
                  <p className="text-white/60 text-xs">Registrations</p>
                </div>
              </div>
            </Card>
            <Card className="bg-black/60 border-red-600/20 p-4 hover:bg-red-900/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.featuredCount}</p>
                  <p className="text-white/60 text-xs">Featured</p>
                </div>
              </div>
            </Card>
            <Card className="bg-black/60 border-red-600/20 p-4 hover:bg-red-900/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-cyan-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalCapacity > 0 ? Math.round((stats.totalRegistrations / stats.totalCapacity) * 100) : 0}%</p>
                  <p className="text-white/60 text-xs">Capacity Used</p>
                </div>
              </div>
            </Card>
            <Card className="bg-black/60 border-red-600/20 p-4 hover:bg-red-900/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <IndianRupee className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">₹{stats.expectedRevenue.toLocaleString()}</p>
                  <p className="text-white/60 text-xs">Expected Revenue</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 bg-black/60 p-4 rounded-lg border border-red-600/20">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-black/40 border-red-600/20 text-white focus:border-red-500 transition-all"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-black/40 border-red-600/20 text-white">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-black border-red-600/20 text-white">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-black/40 border-red-600/20 text-white">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <SelectValue placeholder="Category" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-black border-red-600/20 text-white">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {loading ? (
              // Skeleton Loaders
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="bg-black/60 border-red-600/20 p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-1/2 bg-white/10" />
                      <Skeleton className="h-6 w-20 bg-white/10" />
                    </div>
                    <Skeleton className="h-4 w-24 bg-white/10" />
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-10 w-full bg-white/10" />
                      <Skeleton className="h-10 w-full bg-white/10" />
                      <Skeleton className="h-10 w-full bg-white/10" />
                      <Skeleton className="h-10 w-full bg-white/10" />
                    </div>
                    <Skeleton className="h-2 w-full bg-white/10" />
                  </div>
                </Card>
              ))
            ) : (
              <>
                {filteredEvents.length === 0 && (
                  <Card className="bg-black/60 border-red-600/30 p-12 text-center col-span-full">
                    <Calendar className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <p className="text-white/60 text-lg">No events found</p>
                    <p className="text-white/40 text-sm mt-1">
                      {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Create your first event to get started'}
                    </p>
                  </Card>
                )}

                {filteredEvents.map((event) => {
                  const currentParticipants = event.registrations?.[0]?.count ?? event.current_participants ?? 0;
                  const capacityPercentage = (currentParticipants / event.max_participants) * 100;
                  const daysUntil = Math.ceil((new Date(event.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                  return (
                    <Card
                      key={event.id}
                      className="bg-black/60 border-red-600/20 p-4 sm:p-6 hover:border-red-500/50 transition-colors group"
                    >
                      <div className="flex flex-col lg:flex-row justify-between gap-4">
                        {/* Event Info */}
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">{event.name}</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFeatured(event)}
                              className={`h-6 px-2 text-xs ${event.is_featured
                                ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
                                : 'text-white/40 hover:text-yellow-500 hover:bg-yellow-500/10'}`}
                            >
                              <Star className={`w-3 h-3 mr-1 ${event.is_featured ? 'fill-yellow-500' : ''}`} />
                              {event.is_featured ? 'Featured' : 'Feature'}
                            </Button>
                            <Badge className={`${event.status === 'upcoming' ? 'bg-green-500/20 text-green-500 border-green-500/30' :
                              event.status === 'ongoing' ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' :
                                'bg-gray-500/20 text-gray-500 border-gray-500/30'
                              }`}>
                              {getStatusIcon(event.status)}
                              <span className="ml-1 capitalize">{event.status}</span>
                            </Badge>
                            {daysUntil > 0 && daysUntil <= 7 && (
                              <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 animate-pulse">
                                {daysUntil} days left
                              </Badge>
                            )}
                          </div>

                          <Badge variant="outline" className="text-white/60 border-white/20 mb-3">{event.category}</Badge>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-red-500/70" />
                              <div>
                                <p className="text-white/40 text-xs">Date</p>
                                <p className="text-white text-sm">{new Date(event.event_date).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-red-500/70" />
                              <div>
                                <p className="text-white/40 text-xs">Venue</p>
                                <p className="text-white text-sm">{event.venue}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <IndianRupee className="w-4 h-4 text-red-500/70" />
                              <div>
                                <p className="text-white/40 text-xs">Fee</p>
                                <p className="text-white text-sm">₹{event.registration_fee}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-red-500/70" />
                              <div>
                                <p className="text-white/40 text-xs">Revenue</p>
                                <p className="text-emerald-500 text-sm font-medium">₹{(currentParticipants * event.registration_fee).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>

                          {/* Capacity Progress Bar */}
                          <div className="mt-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-white/60 text-sm">Capacity</span>
                              <span className={`text-sm font-medium ${getCapacityColor(capacityPercentage)}`}>
                                {currentParticipants}/{event.max_participants} ({Math.round(capacityPercentage)}%)
                              </span>
                            </div>
                            <Progress
                              value={Math.min(capacityPercentage, 100)}
                              className="h-2"
                            />
                            {capacityPercentage >= 90 && (
                              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Almost full! Consider increasing capacity.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-row lg:flex-col gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/admin/events/${event.id}`)}
                            className="text-blue-500 hover:bg-blue-600/10"
                            title="Edit event"
                            aria-label={`Edit ${event.name}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteId(event.id)}
                            className="text-red-500 hover:bg-red-600/10"
                            title="Delete event"
                            aria-label={`Delete ${event.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </>
            )}
          </div>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
            <AlertDialogContent className="bg-black/95 border-red-600/30">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Delete Event</AlertDialogTitle>
                <AlertDialogDescription className="text-white/60">
                  Are you sure you want to delete this event? This action cannot be undone and will remove all associated registrations.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-red-600/30 text-white hover:bg-white/10 hover:text-white">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}

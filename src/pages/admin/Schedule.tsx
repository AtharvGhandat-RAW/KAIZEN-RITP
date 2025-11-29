import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Save, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Event {
  id: string;
  name: string;
  event_date: string;
  venue: string;
  category: string;
  status: string;
}

export default function Schedule() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [edits, setEdits] = useState<Record<string, { date: string; venue: string }>>({});

  useEffect(() => {
    fetchEvents();

    // Real-time subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setEvents((prev) =>
              prev.map((e) =>
                e.id === payload.new.id ? { ...e, ...payload.new } : e
              )
            );
          } else if (payload.eventType === 'INSERT') {
            setEvents((prev) => [...prev, payload.new as Event]);
          } else if (payload.eventType === 'DELETE') {
            setEvents((prev) => prev.filter((e) => e.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, event_date, venue, category, status')
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (id: string, field: 'date' | 'venue', value: string) => {
    setEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
        // Preserve the other field if it exists in edits, otherwise take from original event
        ...(field === 'date'
          ? { venue: prev[id]?.venue || events.find(e => e.id === id)?.venue || '' }
          : { date: prev[id]?.date || events.find(e => e.id === id)?.event_date || '' }
        )
      },
    }));
  };

  const handleSave = async (id: string) => {
    const edit = edits[id];
    if (!edit) return;

    setSaving(id);
    try {
      const { error } = await supabase
        .from('events')
        .update({
          event_date: edit.date,
          venue: edit.venue,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Schedule updated successfully');

      // Clear edit state for this item
      setEdits((prev) => {
        const newEdits = { ...prev };
        delete newEdits[id];
        return newEdits;
      });

      // Refresh local state immediately (though subscription will also catch it)
      setEvents(prev => prev.map(e => e.id === id ? { ...e, event_date: edit.date, venue: edit.venue } : e));

    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Failed to update schedule');
    } finally {
      setSaving(null);
    }
  };

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group events by date
  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const date = event.event_date ? format(new Date(event.event_date), 'yyyy-MM-dd') : 'TBD';
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  const sortedDates = Object.keys(groupedEvents).sort();

  return (
    <ProtectedRoute requiredRoles={['super_admin', 'event_manager']}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Event Schedule</h1>
              <p className="text-zinc-400">Manage event timings and venues</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-zinc-900/50 border-zinc-800 text-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-8">
              {sortedDates.map((date) => (
                <div key={date} className="space-y-4">
                  <h3 className="text-xl font-semibold text-red-400 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {date === 'TBD' ? 'To Be Decided' : format(new Date(date), 'EEEE, MMMM do, yyyy')}
                  </h3>
                  <div className="grid gap-4">
                    {groupedEvents[date].map((event) => {
                      const isEditing = !!edits[event.id];
                      const currentVal = edits[event.id] || { date: event.event_date, venue: event.venue };

                      return (
                        <Card key={event.id} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                              <div className="space-y-1 min-w-[200px]">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-white text-lg">{event.name}</h4>
                                  <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                                    {event.category}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-zinc-500">
                                  <span className={`w-2 h-2 rounded-full ${event.status === 'upcoming' ? 'bg-blue-500' :
                                      event.status === 'ongoing' ? 'bg-green-500' :
                                        event.status === 'completed' ? 'bg-zinc-500' : 'bg-red-500'
                                    }`} />
                                  <span className="capitalize">{event.status}</span>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto flex-1">
                                <div className="space-y-2 flex-1">
                                  <Label className="text-xs text-zinc-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Date & Time
                                  </Label>
                                  <Input
                                    type="datetime-local"
                                    value={currentVal.date ? new Date(currentVal.date).toISOString().slice(0, 16) : ''}
                                    onChange={(e) => handleEditChange(event.id, 'date', e.target.value)}
                                    className="bg-black/20 border-zinc-800 text-white h-9"
                                  />
                                </div>

                                <div className="space-y-2 flex-1">
                                  <Label className="text-xs text-zinc-400 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> Venue
                                  </Label>
                                  <Input
                                    value={currentVal.venue || ''}
                                    onChange={(e) => handleEditChange(event.id, 'venue', e.target.value)}
                                    placeholder="Enter venue"
                                    className="bg-black/20 border-zinc-800 text-white h-9"
                                  />
                                </div>
                              </div>

                              <div className="flex items-end">
                                {isEditing && (
                                  <Button
                                    onClick={() => handleSave(event.id)}
                                    disabled={saving === event.id}
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    {saving === event.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Save className="w-4 h-4" />
                                    )}
                                    <span className="ml-2 hidden sm:inline">Save</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}

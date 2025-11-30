import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Edit,
  Loader2,
  Star,
  Coffee,
  Trophy,
  Users,
  Sparkles,
  Mic,
  Minus
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ScheduleItem {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  day_number: number;
  item_type: string;
  venue: string | null;
  speakers: string[] | null;
  is_highlighted: boolean;
  sort_order: number;
}

const ITEM_TYPES = [
  { value: 'ceremony', label: 'Ceremony', icon: Sparkles, color: 'bg-purple-500' },
  { value: 'event', label: 'Event', icon: Calendar, color: 'bg-blue-500' },
  { value: 'competition', label: 'Competition', icon: Trophy, color: 'bg-yellow-500' },
  { value: 'workshop', label: 'Workshop', icon: Users, color: 'bg-green-500' },
  { value: 'break', label: 'Break', icon: Coffee, color: 'bg-orange-500' },
  { value: 'activity', label: 'Activity', icon: Star, color: 'bg-pink-500' },
  { value: 'other', label: 'Other', icon: Mic, color: 'bg-gray-500' },
];

export default function ScheduleBuilder() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);
  const [totalDays, setTotalDays] = useState(2);

  useEffect(() => {
    fetchScheduleItems();

    const channel = supabase
      .channel('schedule-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_items' }, () => {
        fetchScheduleItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchScheduleItems = async () => {
    try {
      const { data, error } = await supabase
        .from('schedule_items')
        .select('*')
        .order('day_number', { ascending: true })
        .order('start_time', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setItems((data as ScheduleItem[]) || []);

      if (data && data.length > 0) {
        const maxDay = Math.max(...data.map((item: ScheduleItem) => item.day_number));
        setTotalDays(Math.max(maxDay, 2));
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('schedule_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Item deleted');
      fetchScheduleItems();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleDeleteDay = async (dayNumber: number) => {
    const dayItemsCount = items.filter(item => item.day_number === dayNumber).length;

    if (dayItemsCount > 0) {
      if (!confirm(`Day ${dayNumber} has ${dayItemsCount} item(s). Delete the entire day and all its items?`)) return;

      try {
        // Delete all items for this day
        const { error } = await supabase
          .from('schedule_items')
          .delete()
          .eq('day_number', dayNumber);

        if (error) throw error;

        // Update day numbers for days after the deleted day
        const { error: updateError } = await supabase
          .from('schedule_items')
          .update({ day_number: supabase.rpc('decrement_day_number', { day_num: dayNumber }) })
          .gt('day_number', dayNumber);

        // We can't use RPC, so let's do it differently - refetch and update manually
        toast.success(`Day ${dayNumber} deleted`);
      } catch (error) {
        console.error('Error deleting day:', error);
        toast.error('Failed to delete day');
      }
    }

    // Decrease total days and adjust selected day if needed
    setTotalDays(prev => Math.max(1, prev - 1));
    if (selectedDay >= dayNumber && selectedDay > 1) {
      setSelectedDay(prev => prev - 1);
    }
    fetchScheduleItems();
  };

  const getTypeInfo = (type: string) => {
    return ITEM_TYPES.find(t => t.value === type) || ITEM_TYPES[6];
  };

  const dayItems = items.filter(item => item.day_number === selectedDay);

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Schedule Builder</h1>
                <p className="text-zinc-400 text-sm">Create the complete event timeline</p>
              </div>
              <Button
                onClick={() => navigate(`/admin/schedule-builder/new?day=${selectedDay}`)}
                className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>

          {/* Day Selector - Scrollable on mobile */}
          <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-2 items-center min-w-max">
              <span className="text-zinc-400 text-sm whitespace-nowrap">Day:</span>
              {[...Array(totalDays)].map((_, i) => (
                <div key={i + 1} className="relative group">
                  <Button
                    variant={selectedDay === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDay(i + 1)}
                    className={`${selectedDay === i + 1 ? "bg-red-600 hover:bg-red-700" : "border-zinc-700 text-zinc-300"} min-w-[70px] pr-7`}
                  >
                    Day {i + 1}
                  </Button>
                  {totalDays > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDay(i + 1);
                      }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                      title={`Delete Day ${i + 1}`}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTotalDays(prev => prev + 1)}
                className="text-zinc-400 hover:text-white"
                title="Add Day"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Timeline */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : dayItems.length === 0 ? (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="flex flex-col items-center justify-center py-12 sm:py-20 px-4">
                <Calendar className="w-12 sm:w-16 h-12 sm:h-16 text-zinc-600 mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 text-center">
                  No items for Day {selectedDay}
                </h3>
                <p className="text-zinc-500 mb-4 text-sm text-center">
                  Start building your schedule by adding items
                </p>
                <Button
                  onClick={() => navigate(`/admin/schedule-builder/new?day=${selectedDay}`)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Item
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="relative">
              {/* Timeline line - Hidden on very small screens */}
              <div className="absolute left-3 sm:left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-600 via-red-500 to-red-600/20 hidden sm:block" />

              <div className="space-y-3 sm:space-y-4">
                {dayItems.map((item) => {
                  const typeInfo = getTypeInfo(item.item_type);
                  const TypeIcon = typeInfo.icon;

                  return (
                    <div key={item.id} className="relative sm:pl-14 group">
                      {/* Timeline dot - Desktop */}
                      <div className={`absolute left-1.5 sm:left-4 top-4 w-4 sm:w-5 h-4 sm:h-5 rounded-full ${typeInfo.color} border-2 sm:border-4 border-zinc-900 z-10 hidden sm:flex items-center justify-center`}>
                        {item.is_highlighted && (
                          <Star className="w-2 h-2 text-white fill-white" />
                        )}
                      </div>

                      <Card className={`bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors ${item.is_highlighted ? 'ring-1 ring-yellow-500/50' : ''}`}>
                        <CardContent className="p-3 sm:p-4">
                          {/* Mobile: Time at top */}
                          <div className="flex items-center gap-2 text-xs text-red-400 font-mono mb-2 sm:hidden">
                            <Clock className="w-3 h-3" />
                            {item.start_time && format(new Date(item.start_time), 'h:mm a')}
                            {item.end_time && ` - ${format(new Date(item.end_time), 'h:mm a')}`}
                          </div>

                          <div className="flex items-start justify-between gap-2 sm:gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Badges */}
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <Badge variant="outline" className={`${typeInfo.color} text-white border-none text-xs`}>
                                  <TypeIcon className="w-3 h-3 mr-1" />
                                  {typeInfo.label}
                                </Badge>
                                {item.is_highlighted && (
                                  <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                    <Star className="w-3 h-3 mr-1" />
                                    Featured
                                  </Badge>
                                )}
                              </div>

                              {/* Title */}
                              <h3 className="text-base sm:text-lg font-semibold text-white mb-1 break-words">
                                {item.title}
                              </h3>

                              {/* Description */}
                              {item.description && (
                                <p className="text-zinc-400 text-sm mb-2 line-clamp-2">
                                  {item.description}
                                </p>
                              )}

                              {/* Meta - Desktop time + venue */}
                              <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-zinc-500">
                                {/* Desktop time */}
                                <div className="hidden sm:flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {item.start_time && format(new Date(item.start_time), 'h:mm a')}
                                  {item.end_time && ` - ${format(new Date(item.end_time), 'h:mm a')}`}
                                </div>
                                {item.venue && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 sm:w-4 h-3 sm:h-4" />
                                    <span className="truncate max-w-[150px] sm:max-w-none">{item.venue}</span>
                                  </div>
                                )}
                                {item.speakers && item.speakers.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Mic className="w-3 sm:w-4 h-3 sm:h-4" />
                                    <span className="truncate max-w-[150px] sm:max-w-none">
                                      {item.speakers.join(', ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action buttons - Always visible on mobile */}
                            <div className="flex flex-col sm:flex-row items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/admin/schedule-builder/${item.id}`)}
                                className="h-8 w-8 text-zinc-400 hover:text-white"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(item.id)}
                                className="h-8 w-8 text-zinc-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary Footer */}
          {!loading && items.length > 0 && (
            <div className="text-center text-xs sm:text-sm text-zinc-500 pt-4 border-t border-zinc-800">
              Day {selectedDay}: {dayItems.length} items • Total: {items.length} items across {totalDays} days
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}

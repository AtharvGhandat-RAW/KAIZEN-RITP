import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, MapPin, Ghost, Star, Coffee, Trophy, Users, Sparkles, Mic } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
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
}

interface ScheduleModalProps {
  onClose: () => void;
}

const ITEM_TYPES: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  ceremony: { icon: Sparkles, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  event: { icon: Calendar, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  competition: { icon: Trophy, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  workshop: { icon: Users, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  break: { icon: Coffee, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  activity: { icon: Star, color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
  other: { icon: Mic, color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
};

export function ScheduleModal({ onClose }: ScheduleModalProps) {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);
  const [totalDays, setTotalDays] = useState(1);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const { data, error } = await supabase
          .from('schedule_items')
          .select('*')
          .order('day_number', { ascending: true })
          .order('start_time', { ascending: true });
        
        if (error) throw error;
        
        const scheduleData = (data as ScheduleItem[]) || [];
        setItems(scheduleData);
        
        if (scheduleData.length > 0) {
          const maxDay = Math.max(...scheduleData.map(item => item.day_number));
          setTotalDays(maxDay);
        }
      } catch (err) {
        console.error('Error fetching schedule:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const dayItems = items.filter(item => item.day_number === selectedDay);

  const getTypeInfo = (type: string) => {
    return ITEM_TYPES[type] || ITEM_TYPES.other;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl bg-gradient-to-br from-zinc-900 via-black to-zinc-950 border border-red-900/50 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-red-900/30 bg-red-950/20 sticky top-0 z-10 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20 animate-pulse">
                <Calendar className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-wide">Event Schedule</h2>
                <p className="text-xs text-red-400/60">Complete Timeline of KAIZEN</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-red-900/20 rounded-full transition-colors text-white/60 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Day Tabs */}
          {totalDays > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[...Array(totalDays)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setSelectedDay(i + 1)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    selectedDay === i + 1
                      ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                      : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  Day {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-16 h-16 rounded-full bg-red-900/20" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-3/4 h-6 bg-white/5 rounded-lg" />
                    <Skeleton className="w-1/2 h-4 bg-white/5 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/50 space-y-4">
              <div className="p-6 bg-white/5 rounded-full">
                <Ghost className="w-12 h-12 opacity-50 animate-bounce" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">Schedule Coming Soon</h3>
                <p className="text-zinc-500">The complete event timeline will be announced shortly...</p>
              </div>
            </div>
          ) : dayItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/50 space-y-4">
              <Calendar className="w-12 h-12 opacity-50" />
              <p className="text-zinc-500">No events scheduled for Day {selectedDay}</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-red-600 via-red-500/50 to-transparent" />

              <div className="space-y-6">
                {dayItems.map((item, index) => {
                  const typeInfo = getTypeInfo(item.item_type);
                  const TypeIcon = typeInfo.icon;

                  return (
                    <div 
                      key={item.id} 
                      className="relative pl-16 animate-in slide-in-from-left-4 duration-500"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Timeline dot */}
                      <div className={`absolute left-4 w-5 h-5 rounded-full ${typeInfo.bgColor} border-2 border-zinc-900 z-10 flex items-center justify-center`}>
                        <TypeIcon className={`w-2.5 h-2.5 ${typeInfo.color}`} />
                      </div>

                      {/* Time label */}
                      <div className="absolute left-0 -top-0.5 text-xs text-red-400 font-mono font-bold">
                        {item.start_time && format(new Date(item.start_time), 'HH:mm')}
                      </div>

                      <div className={`group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/30 rounded-xl p-5 transition-all duration-300 ${
                        item.is_highlighted ? 'ring-1 ring-yellow-500/50 bg-yellow-500/5' : ''
                      }`}>
                        <div className="flex flex-col gap-3">
                          {/* Type Badge & Highlight */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${typeInfo.bgColor} ${typeInfo.color} border border-current/20`}>
                              <TypeIcon className="w-3 h-3" />
                              {item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1)}
                            </span>
                            {item.is_highlighted && (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                <Star className="w-3 h-3 fill-current" />
                                Featured
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h4 className="text-lg font-semibold text-white group-hover:text-red-400 transition-colors">
                            {item.title}
                          </h4>

                          {/* Description */}
                          {item.description && (
                            <p className="text-zinc-400 text-sm">
                              {item.description}
                            </p>
                          )}

                          {/* Meta info */}
                          <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-red-500/70" />
                              {item.start_time && format(new Date(item.start_time), 'h:mm a')}
                              {item.end_time && ` - ${format(new Date(item.end_time), 'h:mm a')}`}
                            </div>
                            {item.venue && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-red-500/70" />
                                {item.venue}
                              </div>
                            )}
                            {item.speakers && item.speakers.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <Mic className="w-4 h-4 text-red-500/70" />
                                {item.speakers.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer with day info */}
        {!loading && items.length > 0 && (
          <div className="p-4 border-t border-red-900/30 bg-black/50 text-center">
            <p className="text-xs text-zinc-500">
              Showing {dayItems.length} items for Day {selectedDay} • Total {items.length} scheduled items
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Ghost, Star, Coffee, Trophy, Users, Sparkles, Mic, ArrowLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/SEOHead';

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

const ITEM_TYPES: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
    ceremony: { icon: Sparkles, color: 'text-purple-400', bgColor: 'bg-purple-500/20', label: 'Ceremony' },
    event: { icon: Calendar, color: 'text-blue-400', bgColor: 'bg-blue-500/20', label: 'Event' },
    competition: { icon: Trophy, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', label: 'Competition' },
    workshop: { icon: Users, color: 'text-green-400', bgColor: 'bg-green-500/20', label: 'Workshop' },
    break: { icon: Coffee, color: 'text-orange-400', bgColor: 'bg-orange-500/20', label: 'Break' },
    activity: { icon: Star, color: 'text-pink-400', bgColor: 'bg-pink-500/20', label: 'Activity' },
    other: { icon: Mic, color: 'text-gray-400', bgColor: 'bg-gray-500/20', label: 'Other' },
};

// Helper function to format time without timezone conversion
const formatTimeFromString = (timeString: string): string => {
    if (!timeString) return '';
    try {
        // Extract just the time part if it's a full timestamp
        // The time is stored as 'HH:MM:SS' or as a full ISO timestamp
        if (timeString.includes('T')) {
            // Full ISO timestamp - extract time part
            const timePart = timeString.split('T')[1];
            const [hours, minutes] = timePart.split(':');
            const hour = parseInt(hours, 10);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minutes} ${ampm}`;
        } else if (timeString.includes(':')) {
            // Just time string 'HH:MM:SS'
            const [hours, minutes] = timeString.split(':');
            const hour = parseInt(hours, 10);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minutes} ${ampm}`;
        }
        return timeString;
    } catch {
        return timeString;
    }
};

export default function SchedulePage() {
    const [items, setItems] = useState<ScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(1);
    const [totalDays, setTotalDays] = useState(2); // Default 2 days for fest

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
                    setTotalDays(Math.max(maxDay, 2));
                }
            } catch (err) {
                console.error('Error fetching schedule:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, []);

    const dayItems = useMemo(() =>
        items.filter(item => item.day_number === selectedDay),
        [items, selectedDay]
    );

    const getTypeInfo = (type: string) => {
        return ITEM_TYPES[type] || ITEM_TYPES.other;
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <SEOHead
                title="Event Schedule - KAIZEN 2025"
                description="Complete event schedule and timeline for KAIZEN 2025 tech fest"
            />

            {/* Background */}
            <div className="fixed inset-0 bg-gradient-to-b from-red-950/20 via-black to-black pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-[60] bg-black/95 backdrop-blur-sm border-b border-red-900/30">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">Back to Home</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                            <Calendar className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold tracking-wide">Event Schedule</h1>
                            <p className="text-[10px] sm:text-xs text-red-400/60 hidden sm:block">KAIZEN 2025</p>
                        </div>
                    </div>

                    <div className="w-20" /> {/* Spacer for centering */}
                </div>
            </header>

            {/* Day Selector */}
            <div className="sticky top-[73px] z-40 bg-black/90 border-b border-red-900/20 py-3">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {[...Array(totalDays)].map((_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => setSelectedDay(i + 1)}
                                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${selectedDay === i + 1
                                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5'
                                    }`}
                            >
                                Day {i + 1}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="relative z-10 max-w-4xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="space-y-6">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex gap-4 animate-pulse">
                                <div className="w-16 h-16 rounded-full bg-red-900/20 flex-shrink-0" />
                                <div className="flex-1 space-y-3 py-2">
                                    <div className="w-3/4 h-5 bg-white/5 rounded-lg" />
                                    <div className="w-1/2 h-4 bg-white/5 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-white/50 space-y-6">
                        <div className="p-8 bg-white/5 rounded-full">
                            <Ghost className="w-16 h-16 opacity-50 animate-bounce" />
                        </div>
                        <div className="text-center max-w-md">
                            <h3 className="text-2xl font-bold text-white mb-3">Schedule Coming Soon</h3>
                            <p className="text-zinc-500 mb-6">The complete event timeline will be announced shortly. Stay tuned for exciting events!</p>
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Home
                            </Link>
                        </div>
                    </div>
                ) : dayItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-white/50 space-y-4">
                        <Calendar className="w-16 h-16 opacity-50" />
                        <p className="text-zinc-500 text-lg">No events scheduled for Day {selectedDay}</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-[27px] sm:left-8 top-6 bottom-6 w-0.5 bg-gradient-to-b from-red-600 via-red-500/50 to-transparent" />

                        <div className="space-y-5">
                            {dayItems.map((item, index) => {
                                const typeInfo = getTypeInfo(item.item_type);
                                const TypeIcon = typeInfo.icon;

                                return (
                                    <div
                                        key={item.id}
                                        className="relative pl-16 sm:pl-20"
                                        style={{
                                            animation: `fadeSlideIn 0.4s ease-out ${index * 0.05}s both`
                                        }}
                                    >
                                        {/* Timeline dot */}
                                        <div className={`absolute left-4 sm:left-5 w-6 h-6 sm:w-7 sm:h-7 rounded-full ${typeInfo.bgColor} border-2 border-black z-10 flex items-center justify-center shadow-lg`}>
                                            <TypeIcon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${typeInfo.color}`} />
                                        </div>

                                        {/* Card */}
                                        <div className={`group bg-zinc-900/50 hover:bg-zinc-900/80 border border-white/5 hover:border-red-500/30 rounded-xl p-4 sm:p-5 transition-all duration-200 ${item.is_highlighted ? 'ring-1 ring-yellow-500/40 bg-yellow-500/5' : ''
                                            }`}>
                                            {/* Badges row */}
                                            <div className="flex items-center gap-2 flex-wrap mb-3">
                                                <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${typeInfo.bgColor} ${typeInfo.color} font-medium`}>
                                                    <TypeIcon className="w-3 h-3" />
                                                    {typeInfo.label}
                                                </span>
                                                {item.is_highlighted && (
                                                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 font-medium">
                                                        <Star className="w-3 h-3 fill-current" />
                                                        Featured
                                                    </span>
                                                )}
                                            </div>

                                            {/* Title */}
                                            <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-red-400 transition-colors mb-2 leading-tight">
                                                {item.title}
                                            </h3>

                                            {/* Description */}
                                            {item.description && (
                                                <p className="text-zinc-400 text-sm mb-3 line-clamp-2">
                                                    {item.description}
                                                </p>
                                            )}

                                            {/* Meta info */}
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-zinc-500">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-red-500/70" />
                                                    <span>
                                                        {formatTimeFromString(item.start_time)}
                                                        {item.end_time && ` - ${formatTimeFromString(item.end_time)}`}
                                                    </span>
                                                </div>
                                                {item.venue && (
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin className="w-3.5 h-3.5 text-red-500/70" />
                                                        <span className="truncate max-w-[150px]">{item.venue}</span>
                                                    </div>
                                                )}
                                                {item.speakers && item.speakers.length > 0 && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Mic className="w-3.5 h-3.5 text-red-500/70" />
                                                        <span className="truncate max-w-[150px]">{item.speakers.join(', ')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Summary footer */}
                {!loading && items.length > 0 && (
                    <div className="mt-10 pt-6 border-t border-red-900/20 text-center">
                        <p className="text-sm text-zinc-500">
                            {dayItems.length} event{dayItems.length !== 1 ? 's' : ''} on Day {selectedDay} • {items.length} total scheduled
                        </p>
                    </div>
                )}
            </main>

            {/* CSS for animations */}
            <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
        </div>
    );
}

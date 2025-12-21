import React from 'react';
import { X, Calendar, Clock, MapPin, Mic, Sparkles, Trophy, Users, Coffee, Star, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
  image_url?: string | null;
}

interface ScheduleDetailsModalProps {
  item: ScheduleItem | null;
  isOpen: boolean;
  onClose: () => void;
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

const formatTime = (timeString: string) => {
  try {
    return format(new Date(timeString), 'h:mm a');
  } catch {
    return '';
  }
};

const formatDate = (timeString: string) => {
  try {
    return format(new Date(timeString), 'EEEE, MMMM d, yyyy');
  } catch {
    return '';
  }
};

export function ScheduleDetailsModal({ item, isOpen, onClose }: ScheduleDetailsModalProps) {
  if (!item) return null;

  const typeInfo = ITEM_TYPES[item.item_type] || ITEM_TYPES.other;
  const TypeIcon = typeInfo.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed left-0 top-0 w-screen h-screen max-w-none m-0 rounded-none border-none bg-black p-0 translate-x-0 translate-y-0 data-[state=open]:slide-in-from-bottom-10 data-[state=open]:slide-in-from-top-0 data-[state=open]:zoom-in-100 overflow-y-auto focus:outline-none">
        
        {/* Sticky Navigation Header */}
        <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-4 bg-black/80 backdrop-blur-md border-b border-white/10">
            <button 
                onClick={onClose}
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
            >
                <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm sm:text-base">Back to Event Schedule</span>
            </button>
        </div>

        <div className="max-w-4xl mx-auto w-full pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8">
            <div className="px-4 sm:px-10 space-y-8 relative">
                {/* Header Info */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${typeInfo.bgColor} ${typeInfo.color} font-medium backdrop-blur-md border border-white/10`}>
                        <TypeIcon className="w-3 h-3" />
                        {typeInfo.label}
                    </span>
                    {item.is_highlighted && (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 font-medium backdrop-blur-md border border-yellow-500/20">
                        <Star className="w-3 h-3 fill-current" />
                        Featured
                        </span>
                    )}
                    </div>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight">
                    {item.title}
                    </h2>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-4 text-zinc-300 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                        <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                            <Calendar className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Date</p>
                            <p className="font-medium text-base text-white">{formatDate(item.start_time)}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-zinc-300 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                        <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                            <Clock className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Time</p>
                            <p className="font-medium text-base text-white">
                            {formatTime(item.start_time)}
                            {item.end_time && ` - ${formatTime(item.end_time)}`}
                            </p>
                        </div>
                    </div>

                    {item.venue && (
                    <div className="flex items-center gap-4 text-zinc-300 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                        <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                        <MapPin className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Venue</p>
                        <p className="font-medium text-base text-white">{item.venue}</p>
                        </div>
                    </div>
                    )}

                    {item.speakers && item.speakers.length > 0 && (
                    <div className="flex items-center gap-4 text-zinc-300 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                        <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                        <Mic className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Speakers / Hosts</p>
                        <p className="font-medium text-base text-white">{item.speakers.join(', ')}</p>
                        </div>
                    </div>
                    )}
                </div>

                {/* Description */}
                {item.description && (
                    <div className="space-y-4 pt-4 border-t border-zinc-800/50">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        About this event
                    </h3>
                    <div className="prose prose-invert max-w-none">
                        <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap text-base sm:text-lg">
                            {item.description}
                        </p>
                    </div>
                    </div>
                )}

                {/* Event Poster */}
                {item.image_url && (
                    <div className="mt-8 border-t border-zinc-800/50 pt-8">
                        <h3 className="text-lg font-semibold text-white mb-4">Event Poster</h3>
                        <div className="rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                            <img 
                                src={item.image_url} 
                                alt={item.title} 
                                className="w-full h-auto"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

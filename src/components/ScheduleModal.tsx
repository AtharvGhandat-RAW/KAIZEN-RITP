import React, { useEffect, useState } from 'react';
import { X, Calendar, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  description: string;
  category: string;
}

interface ScheduleModalProps {
  onClose: () => void;
}

export function ScheduleModal({ onClose }: ScheduleModalProps) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const { data, error } = await supabase
          .from('schedules')
          .select('*')
          .order('time');
        
        if (error) throw error;
        setSchedule(data || []);
      } catch (err) {
        console.error('Error fetching schedule:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl bg-black/90 border border-red-900/50 rounded-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-red-900/30 flex items-center justify-between bg-red-950/20">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold text-white tracking-wide">Event Schedule</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-red-900/20 rounded-full transition-colors text-white/60 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-24 h-8 bg-red-900/20" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-3/4 h-6 bg-red-900/20" />
                    <Skeleton className="w-1/2 h-4 bg-red-900/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : schedule.length === 0 ? (
            <div className="text-center py-12 text-white/50">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Schedule coming soon...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {schedule.map((item) => (
                <div 
                  key={item.id} 
                  className="relative pl-8 border-l-2 border-red-900/30 pb-6 last:pb-0 last:border-l-0"
                >
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-red-900 border-2 border-red-500" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
                    <div className="min-w-[100px] pt-0.5">
                      <div className="flex items-center gap-2 text-red-400 font-mono font-bold">
                        <Clock className="w-4 h-4" />
                        {item.time}
                      </div>
                    </div>
                    
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-lg p-4 hover:border-red-500/30 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-white">{item.title}</h3>
                        {item.category && (
                          <span className="text-xs px-2 py-1 bg-red-950/50 border border-red-900/50 rounded text-red-300">
                            {item.category}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-white/60 text-sm">{item.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

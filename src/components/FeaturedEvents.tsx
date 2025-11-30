import React, { useEffect, useState, memo, useCallback } from 'react';
import { Code, Cpu, Lightbulb, Trophy, Zap, Users, ChevronRight, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Lazy load supabase to reduce initial bundle TBT
const getSupabase = () => import('@/integrations/supabase/client').then(m => m.supabase);

interface FeaturedEventsProps {
  onViewAll?: () => void;
  onEventClick?: (eventId: string) => void;
}

interface Event {
  id: string;
  name: string;
  description: string;
  category: string;
}

const getIconForCategory = (category: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'Hackathon': Code,
    'Coding': Cpu,
    'Design': Lightbulb,
    'AI/ML': Zap,
    'Gaming': Trophy,
    'Robotics': Users,
    'Workshop': Cpu,
  };
  return iconMap[category] || Zap;
};

export const FeaturedEvents = memo(function FeaturedEvents({ onViewAll, onEventClick }: FeaturedEventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeaturedEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('events')
        .select('id, name, description, category')
        .in('status', ['upcoming', 'ongoing'])
        .order('event_date')
        .limit(6);

      if (error) throw error;
      setEvents(data || []);
    } catch (err: unknown) {
      console.error('Error fetching events:', err);
      setError('Failed to load featured events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Defer fetch to reduce TBT
    const timeoutId = setTimeout(() => {
      fetchFeaturedEvents();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [fetchFeaturedEvents]);

  return (
    <section id="events" className="relative py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 lg:px-12 w-full max-w-[1440px] mx-auto">
      <div className="text-center mb-12 sm:mb-16">
        <h2 className="text-3xl sm:text-4xl md:text-5xl text-white/90 mb-4" style={{
          textShadow: '0 0 30px rgba(255, 69, 0, 0.3)'
        }}>
          Events
        </h2>
        <p className="text-white/60 text-base sm:text-lg md:text-xl max-w-2xl mx-auto">
          Step into the unknown. Choose your challenge.
        </p>
        <div className="h-px w-20 sm:w-24 md:w-32 bg-gradient-to-r from-transparent via-red-600/60 to-transparent mx-auto mt-6" />
      </div>

      {error && (
        <div className="max-w-2xl mx-auto mb-8">
          <Alert variant="destructive" className="bg-red-950/50 border-red-800 text-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[300px] border border-red-900/20 bg-black/40 p-6 rounded-lg">
              <Skeleton className="h-12 w-12 rounded-full bg-red-900/20 mb-6" />
              <Skeleton className="h-8 w-3/4 bg-red-900/20 mb-4" />
              <Skeleton className="h-4 w-full bg-red-900/10 mb-2" />
              <Skeleton className="h-4 w-5/6 bg-red-900/10 mb-2" />
              <Skeleton className="h-4 w-4/6 bg-red-900/10" />
            </div>
          ))}
        </div>
      ) : events.length === 0 && !error ? (
        <div className="text-center py-12">
          <p className="text-red-500/60">No events available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {events.map((event) => {
            const Icon = getIconForCategory(event.category);
            return (
              <div
                key={event.id}
                className="event-card group relative cursor-pointer"
              >
                <div className="relative h-full bg-black/40 border border-red-600/20 p-6 sm:p-8 hover:border-red-600/50 transition-colors duration-200">
                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="mb-5 sm:mb-6">
                      <div className="inline-flex p-3 sm:p-4 border border-red-600/30 group-hover:border-red-600/60 transition-colors duration-200">
                        <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl sm:text-2xl text-white mb-3 sm:mb-4 group-hover:text-red-400 transition-colors duration-200">
                      {event.name}
                    </h3>

                    {/* Description */}
                    <p className="text-white/60 text-sm sm:text-base leading-relaxed group-hover:text-white/80 transition-colors duration-200 line-clamp-3">
                      {event.description}
                    </p>

                    {/* Learn More Link */}
                    <div
                      className="mt-4 sm:mt-6 flex items-center gap-2 text-red-500 group-hover:text-red-400 transition-colors duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEventClick) {
                          onEventClick(event.id);
                        } else {
                          onViewAll?.();
                        }
                      }}
                    >
                      <span className="text-sm sm:text-base">Learn More</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Corner decorations */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-red-600/40" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-red-600/40" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {onViewAll && (
        <div className="text-center mt-12 sm:mt-16 relative z-50">
          <button
            type="button"
            onClick={onViewAll}
            className="group px-8 sm:px-12 py-4 sm:py-5 border-2 border-red-700 bg-red-900/30 hover:bg-red-900/50 text-red-400 hover:text-red-300 transition-colors duration-200 cursor-pointer"
            aria-label="View all events"
          >
            <span className="relative z-10 flex items-center gap-3 text-base sm:text-lg">
              <span>View All Events</span>
              <ChevronRight className="w-5 h-5" />
            </span>
          </button>

          <p className="text-red-500/60 text-sm mt-4">
            Explore all exciting tech events and competitions
          </p>
        </div>
      )}
    </section>
  );
});

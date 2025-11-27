import React, { useEffect, useState, memo } from 'react';
import { Code, Cpu, Lightbulb, Trophy, Zap, Users, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FeaturedEventsProps {
  onViewAll?: () => void;
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

export const FeaturedEvents = memo(function FeaturedEvents({ onViewAll }: FeaturedEventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedEvents();

    // Real-time listener
    const channel = supabase
      .channel('featured-events-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchFeaturedEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFeaturedEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, description, category')
        .in('status', ['upcoming', 'ongoing'])
        .order('event_date')
        .limit(6);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

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

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-red-500/60">Loading featured events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-red-500/60">No events available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {events.map((event, index) => {
            const Icon = getIconForCategory(event.category);
            return (
              <div
                key={event.id}
                className="event-card group relative cursor-pointer"
                style={{
                  animation: `fadeInScale 0.6s ease-out ${index * 0.1}s forwards`,
                  opacity: 0
                }}
              >
                <div className="relative h-full bg-black/40 backdrop-blur-sm border border-red-600/20 p-6 sm:p-8 hover:border-red-600/50 transition-all duration-500 hover:-translate-y-2">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-600/0 via-red-600/0 to-red-600/0 group-hover:from-red-600/10 group-hover:via-red-600/5 group-hover:to-transparent transition-all duration-500" />

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="mb-5 sm:mb-6">
                      <div className="inline-flex p-3 sm:p-4 border border-red-600/30 group-hover:border-red-600/60 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                        <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl sm:text-2xl text-white mb-3 sm:mb-4 group-hover:text-red-400 transition-colors duration-300">
                      {event.name}
                    </h3>

                    {/* Description */}
                    <p className="text-white/60 text-sm sm:text-base leading-relaxed group-hover:text-white/80 transition-colors duration-300">
                      {event.description}
                    </p>

                    {/* Learn More Link */}
                    <div className="mt-4 sm:mt-6 flex items-center gap-2 text-red-500 group-hover:text-red-400 transition-colors duration-300">
                      <span className="text-sm sm:text-base">Learn More</span>
                      <svg
                        className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  {/* Corner decorations */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-red-600/40 group-hover:border-red-600/80 transition-colors duration-300" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-red-600/40 group-hover:border-red-600/80 transition-colors duration-300" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>

      {onViewAll && (
        <div className="text-center mt-12 sm:mt-16 relative z-50">
          <button
            type="button"
            onClick={onViewAll}
            className="group px-8 sm:px-12 py-4 sm:py-5 border-2 border-red-700 bg-gradient-to-r from-red-900/40 via-red-800/30 to-red-900/40 hover:from-red-900/60 hover:via-red-800/50 hover:to-red-900/60 text-red-400 hover:text-red-300 transition-all duration-300 hover:scale-105 hover:shadow-2xl relative overflow-hidden cursor-pointer"
            style={{
              boxShadow: '0 0 30px rgba(220, 38, 38, 0.3)',
              pointerEvents: 'auto',
            }}
            aria-label="View all events"
          >
            {/* Animated glow effect */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: 'radial-gradient(circle at center, rgba(220, 38, 38, 0.2) 0%, transparent 70%)',
              }}
            />

            <span className="relative z-10 flex items-center gap-3 text-base sm:text-lg">
              <span>View All Events</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
            </span>

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-600 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-600 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          <p className="text-red-500/60 text-sm mt-4">
            Explore all exciting tech events and competitions
          </p>
        </div>
      )}
    </section>
  );
});

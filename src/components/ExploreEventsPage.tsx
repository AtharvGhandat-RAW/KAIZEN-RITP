import React, { useState, useEffect } from 'react';
import { X, Search, Calendar, MapPin, Users, ChevronRight, Star, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface ExploreEventsPageProps {
  onClose: () => void;
  onRegister: () => void;
}

interface Event {
  id: string;
  name: string;
  category: string;
  description: string;
  event_date: string;
  venue: string;
  max_participants: number;
  current_participants: number;
  registration_fee: number;
  prize_pool: number;
  is_featured: boolean;
  image_url: string;
}

export function ExploreEventsPage({ onClose, onRegister }: ExploreEventsPageProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('status', ['upcoming', 'ongoing'])
        .order('is_featured', { ascending: false })
        .order('event_date');

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/95 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-sm border-b border-red-900/50 p-3 sm:p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-red-500" style={{
            textShadow: '0 0 20px rgba(255, 0, 0, 0.5)',
            fontFamily: 'serif'
          }}>
            EXPLORE EVENTS
          </h1>
          <button
            onClick={onClose}
            className="p-2 border-2 border-red-600 bg-black text-red-500 hover:text-red-400 hover:bg-red-950/30 transition-all flex-shrink-0"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8 w-full overflow-x-hidden">
        {/* Search Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-red-500/60" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-black/50 border border-red-900/50 text-white text-sm sm:text-base placeholder:text-red-800/50 focus:border-red-700 focus:outline-none"
            />
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-12 sm:py-16">
            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-red-500 text-sm sm:text-base">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <p className="text-red-500 text-lg sm:text-xl mb-2">No events found</p>
            <p className="text-red-400/60 text-sm sm:text-base">Try adjusting your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="group relative bg-gradient-to-br from-red-950/20 to-black/80 border-2 border-red-900/40 hover:border-red-800/70 transition-all duration-300 hover:-translate-y-2 overflow-hidden"
              >
                {/* Event Image */}
                {event.image_url && (
                  <div className="relative h-40 sm:h-48 overflow-hidden bg-black/60">
                    <img 
                      src={event.image_url} 
                      alt={event.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    
                    {event.is_featured && (
                      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex items-center gap-1 px-2 sm:px-3 py-1 bg-red-600/90 text-white text-xs">
                        <Star className="w-3 h-3" />
                        <span className="hidden sm:inline">Featured</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="p-4 sm:p-5">
                  <h3 className="text-lg sm:text-xl font-bold mb-2 text-red-500 group-hover:text-red-400 transition-colors">
                    {event.name}
                  </h3>

                  <p className="text-red-400/60 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                    {event.description}
                  </p>

                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-red-500/70 mb-3 sm:mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{new Date(event.event_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">
                        {event.current_participants}/{event.max_participants || '∞'} registered
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3 sm:mb-4">
                    <div className="bg-black/40 border border-red-900/40 p-2 text-center">
                      <div className="text-red-600/60 text-[10px] sm:text-xs">Prize Pool</div>
                      <div className="text-red-400 text-xs sm:text-sm font-bold">₹{event.prize_pool?.toLocaleString() || '0'}</div>
                    </div>
                    <div className="bg-black/40 border border-red-900/40 p-2 text-center">
                      <div className="text-red-600/60 text-[10px] sm:text-xs">Entry Fee</div>
                      <div className="text-red-400 text-xs sm:text-sm font-bold">₹{event.registration_fee || 0}</div>
                    </div>
                  </div>

                  <Button
                    onClick={onRegister}
                    className="w-full bg-red-900/40 hover:bg-red-900/60 border-2 border-red-700 text-red-400 text-sm py-4 sm:py-5"
                  >
                    <span>Register Now</span>
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                {/* Corner decorations */}
                <div className="absolute top-0 left-0 w-4 sm:w-6 h-4 sm:h-6 border-t-2 border-l-2 border-red-900/60 group-hover:border-red-700 transition-colors" />
                <div className="absolute bottom-0 right-0 w-4 sm:w-6 h-4 sm:h-6 border-b-2 border-r-2 border-red-900/60 group-hover:border-red-700 transition-colors" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

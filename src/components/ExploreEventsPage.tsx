import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Search, Calendar, MapPin, Users, ChevronRight, Star, Trophy, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ExploreEventsPageProps {
  onClose: () => void;
  onRegister: (eventId?: string) => void;
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
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('status', ['upcoming', 'ongoing'])
        .order('is_featured', { ascending: false })
        .order('event_date');

      if (error) throw error;
      setEvents(data || []);
    } catch (err: unknown) {
      console.error('Error fetching events:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load events. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const filteredEvents = useMemo(() => {
    return events.filter(event =>
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [events, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 overflow-y-auto animate-in fade-in duration-300">
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
            className="p-2 border-2 border-red-600 bg-black text-red-500 hover:text-red-400 hover:bg-red-950/30 transition-all flex-shrink-0 rounded-full"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8 w-full overflow-x-hidden">
        {/* Search Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-red-500/60" />
            <input
              type="text"
              placeholder="Search events by name, category, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-black/50 border border-red-900/50 text-white text-sm sm:text-base placeholder:text-red-800/50 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none rounded-lg transition-all"
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <Alert variant="destructive" className="bg-red-950/20 border-red-900/50 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="flex items-center justify-between gap-4">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={fetchEvents} className="border-red-500/50 hover:bg-red-950/50 text-red-400">
                  <RefreshCw className="w-4 h-4 mr-2" /> Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-black/40 border border-red-900/30 rounded-lg overflow-hidden">
                <Skeleton className="h-40 sm:h-48 w-full bg-red-900/10" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4 bg-red-900/10" />
                  <Skeleton className="h-4 w-full bg-red-900/10" />
                  <Skeleton className="h-4 w-2/3 bg-red-900/10" />
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Skeleton className="h-12 w-full bg-red-900/10" />
                    <Skeleton className="h-12 w-full bg-red-900/10" />
                  </div>
                  <Skeleton className="h-10 w-full bg-red-900/10 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 && !error ? (
          <div className="text-center py-12 sm:py-16 bg-black/40 border border-red-900/30 rounded-lg max-w-2xl mx-auto">
            <Search className="w-12 h-12 sm:w-16 sm:h-16 text-red-900/40 mx-auto mb-4" />
            <p className="text-red-500 text-lg sm:text-xl mb-2 font-bold">No events found</p>
            <p className="text-red-400/60 text-sm sm:text-base">
              We couldn't find any events matching "{searchQuery}".
            </p>
            <Button
              variant="link"
              onClick={() => setSearchQuery('')}
              className="text-red-400 mt-2"
            >
              Clear search
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="group relative bg-gradient-to-br from-red-950/20 to-black/80 border-2 border-red-900/40 hover:border-red-600/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-900/20 overflow-hidden rounded-lg flex flex-col"
              >
                {/* Event Image */}
                <div className="relative h-40 sm:h-48 overflow-hidden bg-black/60">
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-red-950/10">
                      <Trophy className="w-12 h-12 text-red-900/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                  {event.is_featured && (
                    <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex items-center gap-1 px-2 sm:px-3 py-1 bg-yellow-600/90 text-white text-xs font-bold rounded shadow-lg">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="hidden sm:inline">Featured</span>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black to-transparent">
                    <div className="inline-block px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-sm">
                      {event.category}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col">
                  <h3 className="text-lg sm:text-xl font-bold mb-2 text-red-500 group-hover:text-red-400 transition-colors line-clamp-1">
                    {event.name}
                  </h3>

                  <p className="text-red-400/60 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 flex-1">
                    {event.description}
                  </p>

                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-red-500/70 mb-3 sm:mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 text-red-600" />
                      <span className="truncate">{new Date(event.event_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 text-red-600" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 text-red-600" />
                      <span className="truncate">
                        {event.current_participants}/{event.max_participants || '∞'} registered
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3 sm:mb-4">
                    <div className="bg-black/40 border border-red-900/40 p-2 text-center rounded">
                      <div className="text-red-600/60 text-[10px] sm:text-xs uppercase tracking-wider">Prize Pool</div>
                      <div className="text-red-400 text-xs sm:text-sm font-bold">₹{event.prize_pool?.toLocaleString() || '0'}</div>
                    </div>
                    <div className="bg-black/40 border border-red-900/40 p-2 text-center rounded">
                      <div className="text-red-600/60 text-[10px] sm:text-xs uppercase tracking-wider">Entry Fee</div>
                      <div className="text-red-400 text-xs sm:text-sm font-bold">
                        {event.registration_fee === 0 ? 'FREE' : `₹${event.registration_fee}`}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => onRegister(event.id)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white border-none shadow-lg shadow-red-900/20 group-hover:shadow-red-900/40 transition-all"
                  >
                    <span>Register Now</span>
                    <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

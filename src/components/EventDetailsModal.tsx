import React, { useEffect, useState } from 'react';
import { X, Calendar, MapPin, Users, Trophy, DollarSign, Info, CheckCircle, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface EventDetailsModalProps {
  eventId: string;
  onClose: () => void;
  onRegister: (eventId: string) => void;
}

interface Event {
  id: string;
  name: string;
  description: string;
  category: string;
  event_type: string;
  max_team_size: number;
  min_team_size: number;
  registration_fee: number;
  prize_pool: number;
  venue: string;
  event_date: string;
  registration_deadline: string;
  max_participants: number;
  current_participants: number;
  image_url: string;
  rules: string[];
  coordinators: string[];
  is_featured: boolean;
  status: string;
}

export function EventDetailsModal({ eventId, onClose, onRegister }: EventDetailsModalProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (error) throw error;
        setEvent(data);
      } catch (err: unknown) {
        console.error('Error fetching event details:', err);
        setError('Failed to load event details.');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  if (!eventId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl bg-black border border-red-900/50 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-red-950/50 text-white rounded-full transition-colors border border-white/10"
        >
          <X className="w-6 h-6" />
        </button>

        {loading ? (
          <div className="p-8 space-y-6">
            <Skeleton className="w-full h-64 rounded-lg bg-red-900/20" />
            <Skeleton className="w-3/4 h-10 bg-red-900/20" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20 bg-red-900/10" />
              <Skeleton className="h-20 bg-red-900/10" />
            </div>
            <Skeleton className="w-full h-32 bg-red-900/10" />
          </div>
        ) : error ? (
          <div className="p-8 flex flex-col items-center justify-center h-full text-center">
            <Alert variant="destructive" className="bg-red-950/20 border-red-900/50 text-red-200 mb-6 max-w-md">
              <Info className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={onClose} variant="outline" className="border-red-500 text-red-500 hover:bg-red-950">
              Close
            </Button>
          </div>
        ) : event ? (
          <>
            {/* Header Image */}
            <div className="relative h-48 sm:h-64 md:h-80 flex-shrink-0">
              {event.image_url ? (
                <img 
                  src={event.image_url} 
                  alt={event.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-red-950 to-black flex items-center justify-center">
                  <Trophy className="w-24 h-24 text-red-900/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              
              <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8">
                <div className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-sm mb-3">
                  {event.category}
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                  {event.name}
                </h2>
              </div>
            </div>

            {/* Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
              {/* Key Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                  <Calendar className="w-5 h-5 text-red-500 mb-2" />
                  <div className="text-xs text-white/50 uppercase">Date</div>
                  <div className="text-sm font-medium text-white">
                    {new Date(event.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                  <MapPin className="w-5 h-5 text-red-500 mb-2" />
                  <div className="text-xs text-white/50 uppercase">Venue</div>
                  <div className="text-sm font-medium text-white">{event.venue}</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                  <DollarSign className="w-5 h-5 text-red-500 mb-2" />
                  <div className="text-xs text-white/50 uppercase">Entry Fee</div>
                  <div className="text-sm font-medium text-white">
                    {event.registration_fee === 0 ? 'FREE' : `₹${event.registration_fee}`}
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                  <Trophy className="w-5 h-5 text-red-500 mb-2" />
                  <div className="text-xs text-white/50 uppercase">Prize Pool</div>
                  <div className="text-sm font-medium text-white">₹{event.prize_pool?.toLocaleString()}</div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xl font-bold text-red-400 mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5" /> About Event
                </h3>
                <p className="text-white/80 leading-relaxed text-lg">
                  {event.description}
                </p>
              </div>

              {/* Rules */}
              {event.rules && event.rules.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-red-400 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" /> Rules & Guidelines
                  </h3>
                  <ul className="space-y-2">
                    {event.rules.map((rule, index) => (
                      <li key={index} className="flex items-start gap-3 text-white/70">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Coordinators */}
              {event.coordinators && event.coordinators.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-red-400 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5" /> Coordinators
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {event.coordinators.map((coordinator, index) => (
                      <div key={index} className="bg-white/5 border border-white/10 p-3 rounded flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-900/30 flex items-center justify-center text-red-500 font-bold">
                          {coordinator.charAt(0)}
                        </div>
                        <span className="text-white/80">{coordinator}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="p-6 border-t border-white/10 bg-black/50 backdrop-blur-sm flex justify-end gap-4">
              <Button variant="outline" onClick={onClose} className="border-white/20 text-white hover:bg-white/10">
                Close
              </Button>
              <Button 
                onClick={() => onRegister(event.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-8"
              >
                Register Now
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

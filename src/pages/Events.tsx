import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Calendar, MapPin, Users, ChevronRight, Star, Trophy, AlertCircle, RefreshCw, Skull, Ghost, Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
    event_type: string;
}

// Generate a simple UUID fallback for older browsers
function generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export default function Events() {
    const navigate = useNavigate();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
        // Scroll to top on mount
        window.scrollTo(0, 0);
        fetchEvents();
    }, [fetchEvents]);

    const categories = useMemo(() => {
        const cats = [...new Set(events.map(e => e.category))];
        return ['all', ...cats];
    }, [events]);

    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.category.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [events, searchQuery, selectedCategory]);

    const handleRegister = (eventId: string) => {
        navigate('/register', { state: { selectedEvent: eventId } });
    };

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-black via-red-950/10 to-black" />
                {/* Floating particles */}
                <div className="absolute inset-0 opacity-20">
                    {[...Array(30)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-red-500/50 rounded-full animate-pulse"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 3}s`,
                                animationDuration: `${2 + Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>
                {/* Red glow */}
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        background: 'radial-gradient(ellipse at center top, rgba(139, 0, 0, 0.4) 0%, transparent 60%)'
                    }}
                />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-black/90 border-b border-red-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">Back to Home</span>
                    </Link>
                    <Link to="/" className="text-xl sm:text-2xl font-bold text-red-500" style={{ fontFamily: 'Cinzel, serif' }}>
                        KAIZEN RITP
                    </Link>
                    <Button
                        onClick={() => navigate('/register')}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm"
                    >
                        Register
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                {/* Hero Section */}
                <div className="text-center mb-10 sm:mb-16">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <Skull className="w-8 h-8 sm:w-10 sm:h-10 text-red-600 animate-pulse" />
                        <Ghost className="w-6 h-6 sm:w-8 sm:h-8 text-red-500/60" />
                        <Flame className="w-7 h-7 sm:w-9 sm:h-9 text-orange-500/70" />
                    </div>

                    <h1
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-red-500"
                        style={{
                            fontFamily: 'Cinzel, serif',
                            textShadow: '0 0 40px rgba(255, 0, 0, 0.5), 0 0 80px rgba(139, 0, 0, 0.3)',
                            letterSpacing: '0.05em'
                        }}
                    >
                        EXPLORE EVENTS
                    </h1>

                    <p className="text-lg sm:text-xl text-red-200/70 max-w-2xl mx-auto mb-2">
                        Step into the unknown. Choose your challenge.
                    </p>
                    <p className="text-sm text-red-400/50">
                        The Upside Down awaits those brave enough to compete
                    </p>
                </div>

                {/* Search & Filter */}
                <div className="mb-8 space-y-4">
                    {/* Search Bar */}
                    <div className="relative max-w-2xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500/60" />
                        <input
                            type="text"
                            placeholder="Search events by name, category, or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-black/60 border border-red-900/50 text-white placeholder:text-red-800/50 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none rounded-lg transition-all"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === category
                                        ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                                        : 'bg-black/50 border border-red-900/40 text-red-400 hover:border-red-600/60 hover:text-red-300'
                                    }`}
                            >
                                {category === 'all' ? 'All Events' : category}
                            </button>
                        ))}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-black/40 border border-red-900/30 rounded-xl overflow-hidden">
                                <Skeleton className="h-48 w-full bg-red-900/10" />
                                <div className="p-5 space-y-3">
                                    <Skeleton className="h-6 w-3/4 bg-red-900/10" />
                                    <Skeleton className="h-4 w-full bg-red-900/10" />
                                    <Skeleton className="h-4 w-2/3 bg-red-900/10" />
                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                        <Skeleton className="h-14 w-full bg-red-900/10" />
                                        <Skeleton className="h-14 w-full bg-red-900/10" />
                                    </div>
                                    <Skeleton className="h-11 w-full bg-red-900/10 mt-2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredEvents.length === 0 && !error ? (
                    <div className="text-center py-16 bg-black/40 border border-red-900/30 rounded-xl max-w-2xl mx-auto">
                        <Search className="w-16 h-16 text-red-900/40 mx-auto mb-4" />
                        <p className="text-red-500 text-xl mb-2 font-bold">No events found</p>
                        <p className="text-red-400/60 mb-4">
                            {searchQuery ? `No events matching "${searchQuery}"` : 'No events available at the moment'}
                        </p>
                        {searchQuery && (
                            <Button
                                variant="outline"
                                onClick={() => setSearchQuery('')}
                                className="border-red-600 text-red-400 hover:bg-red-950/50"
                            >
                                Clear search
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEvents.map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                onRegister={() => handleRegister(event.id)}
                            />
                        ))}
                    </div>
                )}

                {/* Stats Section */}
                {!loading && filteredEvents.length > 0 && (
                    <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <StatCard label="Total Events" value={events.length} />
                        <StatCard label="Categories" value={categories.length - 1} />
                        <StatCard label="Featured" value={events.filter(e => e.is_featured).length} />
                        <StatCard label="Total Prizes" value={`₹${events.reduce((sum, e) => sum + (e.prize_pool || 0), 0).toLocaleString()}`} />
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-red-900/50 py-8 mt-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-red-500/60 text-sm mb-4">
                        Ready to face your fears?
                    </p>
                    <Button
                        onClick={() => navigate('/register')}
                        className="bg-red-600 hover:bg-red-700 text-white px-8 py-3"
                    >
                        Register Now
                    </Button>
                    <p className="text-red-500/40 text-xs mt-6">
                        © 2025 KAIZEN RITP. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}

function EventCard({ event, onRegister }: { event: Event; onRegister: () => void }) {
    return (
        <div className="group relative bg-gradient-to-br from-red-950/20 to-black/80 border border-red-900/40 hover:border-red-600/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-900/20 rounded-xl overflow-hidden flex flex-col">
            {/* Event Image */}
            <div className="relative h-48 overflow-hidden bg-black/60">
                {event.image_url ? (
                    <img
                        src={event.image_url}
                        alt={event.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-950/30 to-black">
                        <Trophy className="w-16 h-16 text-red-900/30" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                {event.is_featured && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 bg-yellow-600/90 text-white text-xs font-bold rounded-full shadow-lg">
                        <Star className="w-3 h-3 fill-current" />
                        Featured
                    </div>
                )}

                <div className="absolute bottom-0 left-0 w-full p-4">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded">
                            {event.category}
                        </span>
                        <span className="px-2 py-1 bg-black/60 border border-red-900/50 text-red-400 text-xs rounded">
                            {event.event_type}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-bold mb-2 text-red-500 group-hover:text-red-400 transition-colors line-clamp-1">
                    {event.name}
                </h3>

                <p className="text-red-400/60 text-sm mb-4 line-clamp-2 flex-1">
                    {event.description}
                </p>

                <div className="space-y-2 text-sm text-red-500/70 mb-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0 text-red-600" />
                        <span>{new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0 text-red-600" />
                        <span className="truncate">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 flex-shrink-0 text-red-600" />
                        <span>
                            {event.current_participants || 0}/{event.max_participants || '∞'} registered
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-black/50 border border-red-900/40 p-3 text-center rounded-lg">
                        <div className="text-red-600/60 text-xs uppercase tracking-wider">Prize Pool</div>
                        <div className="text-red-400 font-bold">₹{event.prize_pool?.toLocaleString() || '0'}</div>
                    </div>
                    <div className="bg-black/50 border border-red-900/40 p-3 text-center rounded-lg">
                        <div className="text-red-600/60 text-xs uppercase tracking-wider">Entry Fee</div>
                        <div className="text-red-400 font-bold">
                            {event.registration_fee === 0 ? 'FREE' : `₹${event.registration_fee}`}
                        </div>
                    </div>
                </div>

                <Button
                    onClick={onRegister}
                    className="w-full bg-red-600 hover:bg-red-700 text-white border-none shadow-lg shadow-red-900/20 group-hover:shadow-red-900/40 transition-all py-3"
                >
                    <span>Register Now</span>
                    <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="bg-black/50 border border-red-900/40 rounded-xl p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-red-500">{value}</div>
            <div className="text-red-400/60 text-sm">{label}</div>
        </div>
    );
}

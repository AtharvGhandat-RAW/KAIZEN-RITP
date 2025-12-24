import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, Trophy, Clock, AlertTriangle, Skull, Ghost } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface EventDetails {
    id: string;
    name: string;
    description: string;
    event_date: string;
    venue: string;
    max_participants: number;
    current_participants: number;
    registration_fee: number;
    prize_pool: number;
    rules?: string | string[];
}export default function HorrorDramatics() {
    const navigate = useNavigate();
    const [event, setEvent] = useState<EventDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Scroll to top on mount
        window.scrollTo(0, 0);

        const fetchEvent = async () => {
            try {
                // Try to find Horror Dramatics event in database
                const { data, error } = await supabase
                    .from('events')
                    .select('*')
                    .ilike('name', '%horror%dramatics%')
                    .single();

                if (error || !data) {
                    // Use default data if not found
                    setEvent({
                        id: 'horror-dramatics',
                        name: 'Horror Dramatics',
                        description: 'Step into the shadows and unleash your darkest performance. Horror Dramatics is an electrifying theatrical competition where participants bring spine-chilling stories to life on stage. From psychological thrillers to supernatural tales, showcase your acting prowess in a night that will haunt the audience forever.',
                        event_date: '2025-02-15',
                        venue: 'Main Auditorium, RITP',
                        max_participants: 50,
                        current_participants: 0,
                        registration_fee: 150,
                        prize_pool: 15000,
                        rules: 'Each team can have 3-8 members. Performance time: 10-15 minutes. Props and costumes allowed. Original or adapted scripts only.'
                    });
                } else {
                    setEvent(data);
                }
            } catch (err) {
                console.error('Error fetching event:', err);
                // Use fallback data
                setEvent({
                    id: 'horror-dramatics',
                    name: 'Horror Dramatics',
                    description: 'Step into the shadows and unleash your darkest performance. Horror Dramatics is an electrifying theatrical competition where participants bring spine-chilling stories to life on stage.',
                    event_date: '2025-02-15',
                    venue: 'Main Auditorium, RITP',
                    max_participants: 50,
                    current_participants: 0,
                    registration_fee: 150,
                    prize_pool: 15000,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, []);

    const handleRegister = () => {
        navigate('/register', { state: { selectedEvent: event?.id } });
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Animated Background */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-black via-red-950/20 to-black" />
                <div className="absolute inset-0 opacity-30">
                    {/* Floating particles */}
                    {[...Array(20)].map((_, i) => (
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
                {/* Fog overlay */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(139, 0, 0, 0.3) 0%, transparent 70%)'
                    }}
                />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-[60] bg-black/95 backdrop-blur-sm border-b border-red-900/50">
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
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                    </div>
                ) : event ? (
                    <>
                        {/* Hero Section */}
                        <div className="text-center mb-12 sm:mb-16">
                            <div className="flex items-center justify-center gap-4 mb-6">
                                <Skull className="w-8 h-8 sm:w-10 sm:h-10 text-red-600 animate-pulse" />
                                <Ghost className="w-6 h-6 sm:w-8 sm:h-8 text-red-500/60" />
                            </div>

                            <h1
                                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-red-500"
                                style={{
                                    fontFamily: 'Cinzel, serif',
                                    textShadow: '0 0 40px rgba(255, 0, 0, 0.5), 0 0 80px rgba(139, 0, 0, 0.3)',
                                    letterSpacing: '0.1em'
                                }}
                            >
                                {event.name.toUpperCase()}
                            </h1>

                            <p
                                className="text-lg sm:text-xl md:text-2xl text-red-200/80 max-w-3xl mx-auto leading-relaxed"
                                style={{ fontFamily: 'Playfair Display, serif' }}
                            >
                                {event.description}
                            </p>

                            {/* Warning Banner */}
                            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-red-950/50 border border-red-900/50 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                <span className="text-red-300 text-sm sm:text-base">Warning: Not for the faint-hearted</span>
                            </div>
                        </div>

                        {/* Event Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
                            <DetailCard
                                icon={<Calendar className="w-6 h-6" />}
                                label="Event Date"
                                value={new Date(event.event_date).toLocaleDateString('en-US', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            />
                            <DetailCard
                                icon={<MapPin className="w-6 h-6" />}
                                label="Venue"
                                value={event.venue}
                            />
                            <DetailCard
                                icon={<Users className="w-6 h-6" />}
                                label="Team Size"
                                value="3-8 Members"
                            />
                            <DetailCard
                                icon={<Clock className="w-6 h-6" />}
                                label="Duration"
                                value="10-15 Minutes"
                            />
                        </div>

                        {/* Prize & Registration Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                            {/* Prize Pool */}
                            <div className="bg-gradient-to-br from-red-950/40 to-black/60 border border-red-900/50 rounded-xl p-6 sm:p-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <Trophy className="w-8 h-8 text-yellow-500" />
                                    <h3 className="text-xl sm:text-2xl font-bold text-white">Prize Pool</h3>
                                </div>
                                <p
                                    className="text-4xl sm:text-5xl font-bold text-yellow-400"
                                    style={{ textShadow: '0 0 20px rgba(234, 179, 8, 0.4)' }}
                                >
                                    ₹{event.prize_pool.toLocaleString()}
                                </p>
                                <div className="mt-4 space-y-2 text-red-200/70">
                                    <p>🥇 1st Place: ₹{Math.floor(event.prize_pool * 0.5).toLocaleString()}</p>
                                    <p>🥈 2nd Place: ₹{Math.floor(event.prize_pool * 0.3).toLocaleString()}</p>
                                    <p>🥉 3rd Place: ₹{Math.floor(event.prize_pool * 0.2).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Registration */}
                            <div className="bg-gradient-to-br from-black/60 to-red-950/40 border border-red-900/50 rounded-xl p-6 sm:p-8">
                                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">Registration</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-red-900/30">
                                        <span className="text-red-200/70">Registration Fee</span>
                                        <span className="text-xl font-bold text-red-400">₹{event.registration_fee} / team</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-red-900/30">
                                        <span className="text-red-200/70">Spots Remaining</span>
                                        <span className="text-xl font-bold text-green-400">
                                            {event.max_participants - event.current_participants} / {event.max_participants}
                                        </span>
                                    </div>
                                    <Button
                                        onClick={handleRegister}
                                        className="w-full mt-4 py-6 text-lg font-bold bg-red-600 hover:bg-red-700 text-white border-2 border-red-500 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,0,0,0.4)]"
                                    >
                                        Register Your Team
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Rules Section */}
                        <div className="bg-black/60 border border-red-900/50 rounded-xl p-6 sm:p-8 mb-12">
                            <h3 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                                Rules & Guidelines
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <RuleItem text="Teams of 3-8 members allowed" />
                                <RuleItem text="Performance duration: 10-15 minutes" />
                                <RuleItem text="Props and costumes are permitted" />
                                <RuleItem text="Original or adapted scripts only" />
                                <RuleItem text="No pyrotechnics or real weapons" />
                                <RuleItem text="Background music allowed" />
                                <RuleItem text="Judges' decision is final" />
                                <RuleItem text="Report 30 minutes before slot" />
                            </div>
                        </div>

                        {/* CTA Section */}
                        <div className="text-center py-8">
                            <p className="text-red-200/60 mb-6 text-lg">
                                Dare to perform? The stage awaits your darkest tale.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button
                                    onClick={handleRegister}
                                    className="px-8 py-6 text-lg bg-red-600 hover:bg-red-700 text-white"
                                >
                                    Register Now
                                </Button>
                                <Link to="/schedule">
                                    <Button
                                        variant="outline"
                                        className="px-8 py-6 text-lg border-red-600 text-red-400 hover:bg-red-950/50"
                                    >
                                        View Full Schedule
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-red-400 text-xl">Event details not available</p>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-red-900/50 py-6">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-red-500/60 text-sm">
                        © 2026 KAIZEN RITP. All rights reserved.
                    </p>
                </div>
            </footer>

            {/* CSS for animations */}
            <style>{`
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
          75% { opacity: 0.9; }
        }
      `}</style>
        </div>
    );
}

function DetailCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="bg-black/60 border border-red-900/50 rounded-xl p-4 sm:p-6 text-center hover:border-red-600/50 transition-colors">
            <div className="text-red-500 mb-3 flex justify-center">{icon}</div>
            <p className="text-red-200/60 text-sm mb-1">{label}</p>
            <p className="text-white font-semibold">{value}</p>
        </div>
    );
}

function RuleItem({ text }: { text: string }) {
    return (
        <div className="flex items-start gap-3 p-3 bg-red-950/20 rounded-lg">
            <span className="text-red-500 mt-0.5">•</span>
            <span className="text-red-200/80">{text}</span>
        </div>
    );
}

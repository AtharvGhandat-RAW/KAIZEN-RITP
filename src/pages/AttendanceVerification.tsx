import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, CheckCircle, XCircle, User, Mail, Phone, Calendar, MapPin, Loader2, AlertCircle, QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SEOHead } from '@/components/SEOHead';

interface RegistrationResult {
    id: string;
    registration_type: string;
    payment_status: string;
    created_at: string;
    profile: {
        id: string;
        full_name: string;
        email: string;
        phone: string;
        college: string;
        year: string;
        branch: string;
    };
    event: {
        id: string;
        name: string;
        venue: string;
        event_date: string;
    };
    team?: {
        name: string;
    };
    attendance_marked?: boolean;
}

export default function AttendanceVerification() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState<'email' | 'phone' | 'name'>('email');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<RegistrationResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [markedAttendance, setMarkedAttendance] = useState<Set<string>>(new Set());

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) {
            setError('Please enter a search query');
            return;
        }

        setLoading(true);
        setError(null);
        setResults([]);

        try {
            // First search profiles based on search type
            let profileQuery = supabase.from('profiles').select('id, full_name, email, phone, college, year, branch');

            if (searchType === 'email') {
                profileQuery = profileQuery.ilike('email', `%${searchQuery.trim()}%`);
            } else if (searchType === 'phone') {
                profileQuery = profileQuery.ilike('phone', `%${searchQuery.trim()}%`);
            } else {
                profileQuery = profileQuery.ilike('full_name', `%${searchQuery.trim()}%`);
            }

            const { data: profiles, error: profileError } = await profileQuery;

            if (profileError) throw profileError;

            if (!profiles || profiles.length === 0) {
                setError('No registered students found with the given details');
                setLoading(false);
                return;
            }

            // Get registrations for found profiles
            const profileIds = profiles.map(p => p.id);

            const { data: registrations, error: regError } = await supabase
                .from('registrations')
                .select(`
          id,
          registration_type,
          payment_status,
          created_at,
          profile_id,
          event_id,
          team_id
        `)
                .in('profile_id', profileIds)
                .eq('payment_status', 'completed');

            if (regError) throw regError;

            if (!registrations || registrations.length === 0) {
                setError('No confirmed registrations found. Only students with completed payment can attend.');
                setLoading(false);
                return;
            }

            // Get event details
            const eventIds = [...new Set(registrations.map(r => r.event_id))];
            const { data: events, error: eventError } = await supabase
                .from('events')
                .select('id, name, venue, event_date')
                .in('id', eventIds);

            if (eventError) throw eventError;

            // Get team details if any
            const teamIds = registrations.filter(r => r.team_id).map(r => r.team_id);
            let teams: { id: string; name: string }[] = [];
            if (teamIds.length > 0) {
                const { data: teamData } = await supabase
                    .from('teams')
                    .select('id, name')
                    .in('id', teamIds);
                teams = teamData || [];
            }

            // Combine all data
            const combinedResults: RegistrationResult[] = registrations.map(reg => {
                const profile = profiles.find(p => p.id === reg.profile_id)!;
                const event = events?.find(e => e.id === reg.event_id);
                const team = teams.find(t => t.id === reg.team_id);

                return {
                    id: reg.id,
                    registration_type: reg.registration_type,
                    payment_status: reg.payment_status || 'pending',
                    created_at: reg.created_at,
                    profile: {
                        id: profile.id,
                        full_name: profile.full_name,
                        email: profile.email,
                        phone: profile.phone || '',
                        college: profile.college || '',
                        year: profile.year || '',
                        branch: profile.branch || '',
                    },
                    event: event ? {
                        id: event.id,
                        name: event.name,
                        venue: event.venue,
                        event_date: event.event_date,
                    } : {
                        id: reg.event_id,
                        name: 'Unknown Event',
                        venue: '',
                        event_date: '',
                    },
                    team: team ? { name: team.name } : undefined,
                };
            });

            setResults(combinedResults);
        } catch (err) {
            console.error('Search error:', err);
            setError('Failed to search. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [searchQuery, searchType]);

    const markAttendance = useCallback((registrationId: string) => {
        setMarkedAttendance(prev => new Set(prev).add(registrationId));
    }, []);

    return (
        <div className="min-h-screen bg-black text-white">
            <SEOHead
                title="Attendance Verification - KAIZEN 2025"
                description="Verify student registrations and mark attendance for KAIZEN 2025 events"
            />

            {/* Background */}
            <div className="fixed inset-0 bg-gradient-to-b from-green-950/20 via-black to-black pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-[60] bg-black/95 backdrop-blur-sm border-b border-green-900/50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-green-500 hover:text-green-400 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">Back to Home</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                            <QrCode className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold tracking-wide">Attendance Verification</h1>
                            <p className="text-[10px] sm:text-xs text-green-400/60 hidden sm:block">KAIZEN 2025</p>
                        </div>
                    </div>
                    <div className="w-20" />
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-4xl mx-auto px-4 py-8">
                {/* Search Section */}
                <div className="bg-black/60 border border-green-900/40 rounded-xl p-6 mb-8">
                    <h2 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Search Registered Students
                    </h2>

                    {/* Search Type Selector */}
                    <div className="flex gap-2 mb-4">
                        {(['email', 'phone', 'name'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setSearchType(type)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${searchType === type
                                        ? 'bg-green-600 text-white'
                                        : 'bg-black/50 border border-green-900/40 text-green-400 hover:border-green-600/60'
                                    }`}
                            >
                                By {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div className="flex gap-3">
                        <Input
                            type={searchType === 'email' ? 'email' : searchType === 'phone' ? 'tel' : 'text'}
                            placeholder={
                                searchType === 'email'
                                    ? 'Enter student email...'
                                    : searchType === 'phone'
                                        ? 'Enter phone number...'
                                        : 'Enter student name...'
                            }
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="flex-1 bg-black/50 border-green-900/40 text-white h-12 focus:border-green-500"
                        />
                        <Button
                            onClick={handleSearch}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white px-6"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        </Button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <Alert className="mt-4 bg-red-950/20 border-red-900/50 text-red-400">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Results */}
                {results.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-green-400 mb-4">
                            Found {results.length} Registration(s)
                        </h3>

                        {results.map((result) => (
                            <div
                                key={result.id}
                                className={`bg-black/60 border rounded-xl p-6 transition-all ${markedAttendance.has(result.id)
                                        ? 'border-green-500 bg-green-950/20'
                                        : 'border-green-900/40 hover:border-green-600/50'
                                    }`}
                            >
                                {/* Student Info */}
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-green-500/10 rounded-full">
                                            <User className="w-6 h-6 text-green-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-white">{result.profile.full_name}</h4>
                                            <p className="text-green-400/70">{result.profile.college}</p>
                                            <p className="text-green-400/50 text-sm">
                                                {result.profile.branch} - Year {result.profile.year}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className={`px-4 py-2 rounded-full text-sm font-semibold ${markedAttendance.has(result.id)
                                            ? 'bg-green-500 text-white'
                                            : result.payment_status === 'completed'
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                                                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                                        }`}>
                                        {markedAttendance.has(result.id) ? '✓ Attendance Marked' : result.payment_status === 'completed' ? '✓ Payment Verified' : 'Payment Pending'}
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
                                    <div className="flex items-center gap-2 text-green-300/70">
                                        <Mail className="w-4 h-4 text-green-500" />
                                        <span>{result.profile.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-green-300/70">
                                        <Phone className="w-4 h-4 text-green-500" />
                                        <span>{result.profile.phone || 'N/A'}</span>
                                    </div>
                                </div>

                                {/* Event Info */}
                                <div className="bg-black/40 border border-green-900/30 rounded-lg p-4 mb-4">
                                    <h5 className="font-semibold text-green-400 mb-2">{result.event.name}</h5>
                                    <div className="flex flex-wrap gap-4 text-sm text-green-300/60">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {result.event.event_date ? new Date(result.event.event_date).toLocaleDateString() : 'TBD'}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {result.event.venue || 'TBD'}
                                        </div>
                                        {result.team && (
                                            <div className="flex items-center gap-1">
                                                <User className="w-4 h-4" />
                                                Team: {result.team.name}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    {!markedAttendance.has(result.id) ? (
                                        <Button
                                            onClick={() => markAttendance(result.id)}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <CheckCircle className="w-5 h-5 mr-2" />
                                            Mark Present
                                        </Button>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500/20 text-green-400 rounded-lg">
                                            <CheckCircle className="w-5 h-5" />
                                            Attendance Confirmed
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Instructions */}
                {results.length === 0 && !loading && !error && (
                    <div className="text-center py-12">
                        <div className="p-6 bg-green-500/5 rounded-full inline-block mb-6">
                            <QrCode className="w-16 h-16 text-green-500/50" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">How to Verify Attendance</h3>
                        <ol className="text-green-400/70 space-y-2 max-w-md mx-auto text-left">
                            <li>1. Ask the student for their registered email, phone, or name</li>
                            <li>2. Search using the form above</li>
                            <li>3. Verify their details match their ID card</li>
                            <li>4. Click "Mark Present" to confirm attendance</li>
                        </ol>
                        <p className="mt-6 text-sm text-green-400/50">
                            Only students with completed payment verification can attend events.
                        </p>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-green-900/50 py-6 mt-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-green-500/60 text-sm">
                        © 2025 KAIZEN RITP. Attendance Verification System.
                    </p>
                </div>
            </footer>
        </div>
    );
}

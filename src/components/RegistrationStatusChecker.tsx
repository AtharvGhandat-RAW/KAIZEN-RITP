import { useState } from 'react';
import { Search, CheckCircle, Clock, XCircle, Mail, Phone, Calendar, Trophy, X, QrCode, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QRPassGenerator } from './QRPassGenerator';

interface Registration {
    id: string;
    created_at: string;
    payment_status: string;
    event_id: string;
    profiles: { full_name: string; email: string; phone: string | null; college: string | null } | null;
    events: { name: string; event_date: string; venue: string } | null;
    teams: { name: string } | null;
}

interface RegistrationStatusCheckerProps {
    onClose: () => void;
}

export function RegistrationStatusChecker({ onClose }: RegistrationStatusCheckerProps) {
    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [registrations, setRegistrations] = useState<Registration[] | null>(null);
    const [studentName, setStudentName] = useState('');
    const [expandedPass, setExpandedPass] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!searchValue.trim()) {
            toast.error('Please enter your email');
            return;
        }

        // Validate input
        if (!searchValue.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        setLoading(true);
        setRegistrations(null);

        try {
            // First find the profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('email', searchValue.trim())
                .single();

            if (profileError || !profile) {
                toast.info('No registrations found', {
                    description: 'No registrations found with this email'
                });
                setRegistrations([]);
                setLoading(false);
                return;
            }

            setStudentName(profile.full_name);

            // Fetch all registrations for this profile
            const { data: regs, error: regError } = await supabase
                .from('registrations')
                .select(`
          id,
          created_at,
          payment_status,
          event_id,
          profiles (full_name, email, phone, college),
          events (name, event_date, venue),
          teams (name)
        `)
                .eq('profile_id', profile.id)
                .order('created_at', { ascending: false });

            if (regError) throw regError;

            setRegistrations(regs as Registration[] || []);

            if (!regs || regs.length === 0) {
                toast.info('No registrations found');
            }
        } catch (error) {
            console.error('Search error:', error);
            toast.error('Failed to search. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
            case 'verified':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'pending':
                return <Clock className="w-5 h-5 text-yellow-500" />;
            case 'rejected':
            case 'failed':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Clock className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            completed: 'bg-green-500/20 text-green-500 border-green-500/30',
            verified: 'bg-green-500/20 text-green-500 border-green-500/30',
            pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
            rejected: 'bg-red-500/20 text-red-500 border-red-500/30',
            failed: 'bg-red-500/20 text-red-500 border-red-500/30',
        };
        return styles[status] || 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    };

    const getStatusMessage = (status: string) => {
        switch (status) {
            case 'completed':
            case 'verified':
                return '✅ You are registered! See you at the event.';
            case 'pending':
                return '⏳ Payment verification in progress. Usually takes 24-48 hours.';
            case 'rejected':
            case 'failed':
                return '❌ Payment was not verified. Please contact support.';
            default:
                return 'Status unknown';
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/95 overflow-y-auto">
            <div className="w-full min-h-full flex flex-col items-center justify-start p-4 py-8">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="fixed top-4 right-4 z-50 p-2 border-2 border-red-600 bg-black text-red-500 hover:text-red-400 hover:bg-red-950/30 transition-all"
                >
                    <X size={24} />
                </button>

                <div className="w-full max-w-lg mt-12">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl sm:text-3xl font-bold text-red-500 mb-2" style={{
                            textShadow: '0 0 20px rgba(255, 0, 0, 0.5)',
                            fontFamily: 'serif'
                        }}>
                            CHECK YOUR STATUS
                        </h2>
                        <p className="text-red-400/60 text-sm">
                            Enter your email to view your registrations
                        </p>
                    </div>

                    {/* Search Form */}
                    <Card className="bg-black/40 border-red-600/30 p-6 mb-6">
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    type="email"
                                    placeholder="your.email@example.com"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    className="bg-black/40 border-red-600/30 flex-1"
                                    maxLength={100}
                                />
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Search className="w-5 h-5" />
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Card>

                    {/* Results */}
                    {registrations !== null && (
                        <div className="space-y-4">
                            {studentName && registrations.length > 0 && (
                                <p className="text-white/80 text-center">
                                    Welcome back, <span className="text-red-400 font-semibold">{studentName}</span>!
                                </p>
                            )}

                            {registrations.length === 0 ? (
                                <Card className="bg-black/40 border-red-600/30 p-8 text-center">
                                    <div className="text-4xl mb-4">🔍</div>
                                    <p className="text-white/70 mb-2">No registrations found</p>
                                    <p className="text-white/50 text-sm">
                                        Make sure you entered the correct email
                                    </p>
                                </Card>
                            ) : (
                                registrations.map((reg) => (
                                    <Card key={reg.id} className="bg-black/40 border-red-600/30 p-4 hover:border-red-500/50 transition-all">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Trophy className="w-5 h-5 text-red-500" />
                                                    <h3 className="text-white font-semibold">{reg.events?.name}</h3>
                                                </div>

                                                {reg.teams?.name && (
                                                    <p className="text-white/60 text-sm mb-1">
                                                        Team: {reg.teams.name}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-2 text-white/50 text-xs mb-3">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>Registered on {new Date(reg.created_at).toLocaleDateString()}</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(reg.payment_status)}
                                                    <Badge className={getStatusBadge(reg.payment_status)}>
                                                        {reg.payment_status.toUpperCase()}
                                                    </Badge>
                                                </div>

                                                <p className="text-white/60 text-xs mt-2">
                                                    {getStatusMessage(reg.payment_status)}
                                                </p>

                                                {/* Show QR Pass button for completed registrations */}
                                                {(reg.payment_status === 'completed' || reg.payment_status === 'verified') && (
                                                    <Button
                                                        onClick={() => setExpandedPass(expandedPass === reg.id ? null : reg.id)}
                                                        className="mt-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white w-full"
                                                        size="sm"
                                                    >
                                                        <QrCode className="w-4 h-4 mr-2" />
                                                        {expandedPass === reg.id ? 'Hide Event Pass' : 'View Event Pass'}
                                                        {expandedPass === reg.id ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* QR Pass Section */}
                                        {expandedPass === reg.id && (reg.payment_status === 'completed' || reg.payment_status === 'verified') && (
                                            <div className="mt-4 pt-4 border-t border-red-600/30">
                                                <QRPassGenerator
                                                    registration={{
                                                        id: reg.id,
                                                        event_id: reg.event_id,
                                                        name: reg.profiles?.full_name || studentName,
                                                        email: reg.profiles?.email || searchValue,
                                                        phone: reg.profiles?.phone || null,
                                                        college: reg.profiles?.college || null,
                                                        education_type: ''
                                                    }}
                                                    eventName={reg.events?.name || 'KAIZEN Event'}
                                                    eventDate={reg.events?.event_date ? new Date(reg.events.event_date).toLocaleDateString() : undefined}
                                                    eventVenue={reg.events?.venue}
                                                />
                                            </div>
                                        )}
                                    </Card>
                                ))
                            )}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

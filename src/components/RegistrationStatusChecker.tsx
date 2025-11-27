import { useState } from 'react';
import { Search, CheckCircle, Clock, XCircle, Mail, Phone, Calendar, Trophy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Registration {
    id: string;
    created_at: string;
    payment_status: string;
    events: { name: string; event_date: string; venue: string };
    teams: { name: string } | null;
}

interface RegistrationStatusCheckerProps {
    onClose: () => void;
}

export function RegistrationStatusChecker({ onClose }: RegistrationStatusCheckerProps) {
    const [searchType, setSearchType] = useState<'email' | 'phone'>('email');
    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [registrations, setRegistrations] = useState<Registration[] | null>(null);
    const [studentName, setStudentName] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!searchValue.trim()) {
            toast.error('Please enter your email or phone number');
            return;
        }

        // Validate input
        if (searchType === 'email' && !searchValue.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }
        if (searchType === 'phone' && !/^[6-9]\d{9}$/.test(searchValue)) {
            toast.error('Please enter a valid 10-digit phone number');
            return;
        }

        setLoading(true);
        setRegistrations(null);

        try {
            // First find the profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq(searchType === 'email' ? 'email' : 'phone', searchValue.trim())
                .single();

            if (profileError || !profile) {
                toast.info('No registrations found', {
                    description: 'No registrations found with this ' + searchType
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
                            Enter your email or phone to view your registrations
                        </p>
                    </div>

                    {/* Search Form */}
                    <Card className="bg-black/40 border-red-600/30 p-6 mb-6">
                        <form onSubmit={handleSearch} className="space-y-4">
                            {/* Toggle between email/phone */}
                            <div className="flex gap-2 mb-4">
                                <Button
                                    type="button"
                                    variant={searchType === 'email' ? 'default' : 'outline'}
                                    onClick={() => { setSearchType('email'); setSearchValue(''); }}
                                    className={searchType === 'email' ? 'bg-red-600' : 'border-red-600/30'}
                                    size="sm"
                                >
                                    <Mail className="w-4 h-4 mr-2" />
                                    Email
                                </Button>
                                <Button
                                    type="button"
                                    variant={searchType === 'phone' ? 'default' : 'outline'}
                                    onClick={() => { setSearchType('phone'); setSearchValue(''); }}
                                    className={searchType === 'phone' ? 'bg-red-600' : 'border-red-600/30'}
                                    size="sm"
                                >
                                    <Phone className="w-4 h-4 mr-2" />
                                    Phone
                                </Button>
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    type={searchType === 'email' ? 'email' : 'tel'}
                                    placeholder={searchType === 'email' ? 'your.email@example.com' : '9876543210'}
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    className="bg-black/40 border-red-600/30 flex-1"
                                    maxLength={searchType === 'phone' ? 10 : 100}
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
                                        Make sure you entered the correct {searchType}
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
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            )}

                            {/* Help Section */}
                            <Card className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-600/30 p-4">
                                <p className="text-green-400 text-sm font-medium mb-2">Need Help?</p>
                                <p className="text-white/60 text-xs mb-3">
                                    If your payment is pending for more than 48 hours or you have any issues:
                                </p>
                                <a
                                    href="https://wa.me/919876543210?text=Hi! I need help with my KAIZEN registration."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                    WhatsApp Support
                                </a>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

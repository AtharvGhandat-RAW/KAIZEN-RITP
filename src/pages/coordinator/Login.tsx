import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { QrCode, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import CryptoJS from 'crypto-js';

export default function CoordinatorLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const hashPassword = (password: string) => {
        return CryptoJS.SHA256(password).toString();
    };

    const [debugInfo, setDebugInfo] = useState<string>('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedEmail = email.trim().toLowerCase();
        const trimmedPassword = password.trim();

        if (!trimmedEmail || !trimmedPassword) {
            toast.error('Please enter both email and password');
            return;
        }

        setLoading(true);
        setDebugInfo('Starting login...');

        try {
            console.log('Attempting login for:', trimmedEmail);
            setDebugInfo(`Querying database for: ${trimmedEmail}`);

            // Test connection first
            const { error: pingError } = await supabase.from('coordinators').select('count').limit(1);
            if (pingError) {
                console.error('Connection test failed:', pingError);
                setDebugInfo(`Connection error: ${pingError.message}`);
            }

            // Fetch coordinator by email
            const { data: coordinator, error } = await supabase
                .from('coordinators')
                .select('id, name, email, phone, assigned_events, is_active, password_hash')
                .eq('email', trimmedEmail)
                .maybeSingle();

            console.log('Query result:', { coordinator: coordinator ? 'found' : 'not found', error });
            setDebugInfo(`Query done. Found: ${coordinator ? 'Yes' : 'No'}, Error: ${error ? error.message : 'None'}`);

            if (error) {
                console.error('Database error:', error);
                setDebugInfo(`DB Error: ${error.code} - ${error.message}`);
                // Check if it's an RLS error
                if (error.code === 'PGRST301' || error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy') || error.message?.includes('RLS')) {
                    toast.error('Database access denied. RLS policy issue - contact admin.');
                } else {
                    toast.error(`Login failed: ${error.message}`);
                }
                setLoading(false);
                return;
            }

            if (!coordinator) {
                console.log('No coordinator found for email:', trimmedEmail);
                setDebugInfo(`No coordinator found for: ${trimmedEmail}`);
                toast.error('No account found with this email. Please check spelling.');
                setLoading(false);
                return;
            }

            setDebugInfo(`Found: ${coordinator.name}, checking password...`);

            // Check if active
            if (!coordinator.is_active) {
                toast.error('Your account has been deactivated. Please contact admin.');
                setLoading(false);
                return;
            }

            // Verify password
            const passwordHash = hashPassword(trimmedPassword);
            console.log('Password verification:', {
                inputHashStart: passwordHash.substring(0, 10) + '...',
                storedHashStart: coordinator.password_hash?.substring(0, 10) + '...',
                match: passwordHash === coordinator.password_hash
            });

            if (passwordHash !== coordinator.password_hash) {
                setDebugInfo('Password mismatch');
                toast.error('Incorrect password');
                setLoading(false);
                return;
            }

            // Store coordinator in localStorage (excluding password hash)
            const { password_hash, ...coordinatorData } = coordinator;
            localStorage.setItem('coordinator', JSON.stringify(coordinatorData));

            setDebugInfo('Login successful!');
            toast.success(`Welcome, ${coordinator.name}!`);
            navigate('/coordinator/scan');
        } catch (error: unknown) {
            console.error('Login error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setDebugInfo(`Exception: ${errorMessage}`);
            toast.error(`Login failed: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            {/* Background effects */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-gray-950 to-gray-950"></div>

            <div className="relative z-10 w-full max-w-md">
                {/* Back to home */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-red-400 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to home
                </Link>

                <Card className="bg-black/60 border-red-600/30 backdrop-blur-sm">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-red-600/20 rounded-full">
                                <QrCode className="w-10 h-10 text-red-500" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-red-500">
                            Coordinator Login
                        </CardTitle>
                        <p className="text-gray-400 text-sm mt-2">
                            Sign in to access the QR scanner
                        </p>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-gray-300">
                                    Email
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="coordinator@example.com"
                                        className="bg-black/40 border-red-600/30 pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-gray-300">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="bg-black/40 border-red-600/30 pl-10 pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-red-600 hover:bg-red-700"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    'Sign In'
                                )}
                            </Button>

                            {/* Debug info - visible during development */}
                            {debugInfo && (
                                <div className="mt-3 p-2 bg-gray-800/50 rounded text-xs text-gray-400 break-all">
                                    Debug: {debugInfo}
                                </div>
                            )}
                        </form>

                        <div className="mt-6 pt-6 border-t border-red-600/20 text-center">
                            <p className="text-gray-500 text-sm">
                                Need access? Contact your event administrator.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* KAIZEN branding */}
                <div className="text-center mt-8">
                    <h1
                        className="text-3xl font-bold text-red-500"
                        style={{
                            textShadow: '0 0 30px rgba(255, 0, 0, 0.5)',
                            fontFamily: 'serif',
                        }}
                    >
                        KAIZEN 2026
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Event Management System</p>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
    ArrowLeft,
    UserPlus,
    Eye,
    EyeOff,
    Copy,
    Check,
    Loader2,
} from 'lucide-react';
import CryptoJS from 'crypto-js';

interface Event {
    id: string;
    name: string;
}

interface Coordinator {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    assigned_events: string[];
    is_active: boolean;
}

export default function CoordinatorForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [copiedPassword, setCopiedPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        assigned_events: [] as string[],
        is_active: true,
    });

    useEffect(() => {
        fetchEvents();
        if (isEditing) {
            fetchCoordinator();
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, isEditing]);

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('id, name')
                .order('name');

            if (error) throw error;
            console.log('Fetched events:', data);
            setEvents((data || []) as Event[]);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const fetchCoordinator = async () => {
        try {
            const { data, error } = await supabase
                .from('coordinators')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    name: data.name,
                    email: data.email,
                    phone: data.phone || '',
                    password: '',
                    assigned_events: data.assigned_events || [],
                    is_active: data.is_active,
                });
            }
        } catch (error) {
            console.error('Error fetching coordinator:', error);
            toast.error('Failed to load coordinator');
            navigate('/admin/coordinators');
        } finally {
            setLoading(false);
        }
    };

    const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setGeneratedPassword(password);
        setFormData({ ...formData, password });
        return password;
    };

    const copyPassword = () => {
        navigator.clipboard.writeText(generatedPassword);
        setCopiedPassword(true);
        setTimeout(() => setCopiedPassword(false), 2000);
        toast.success('Password copied to clipboard');
    };

    const hashPassword = (password: string) => {
        return CryptoJS.SHA256(password).toString();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.email.trim()) {
            toast.error('Name and email are required');
            return;
        }

        if (!isEditing && !formData.password) {
            toast.error('Password is required for new coordinators');
            return;
        }

        setSaving(true);

        try {
            if (isEditing) {
                const updateData: Record<string, unknown> = {
                    name: formData.name.trim(),
                    email: formData.email.trim().toLowerCase(),
                    phone: formData.phone.trim() || null,
                    assigned_events: formData.assigned_events,
                    is_active: formData.is_active,
                };
                if (formData.password) {
                    updateData.password_hash = hashPassword(formData.password);
                }

                const { error } = await supabase
                    .from('coordinators')
                    .update(updateData)
                    .eq('id', id);

                if (error) throw error;
                toast.success('Coordinator updated successfully');
            } else {
                const { error } = await supabase
                    .from('coordinators')
                    .insert({
                        name: formData.name.trim(),
                        email: formData.email.trim().toLowerCase(),
                        phone: formData.phone.trim() || null,
                        assigned_events: formData.assigned_events,
                        is_active: formData.is_active,
                        password_hash: hashPassword(formData.password),
                    });

                if (error) {
                    if (error.code === '23505') {
                        toast.error('A coordinator with this email already exists');
                        setSaving(false);
                        return;
                    }
                    throw error;
                }
                toast.success('Coordinator created successfully');
            }

            navigate('/admin/coordinators');
        } catch (error) {
            console.error('Error saving coordinator:', error);
            toast.error('Failed to save coordinator');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/admin/coordinators')}
                        className="text-white hover:bg-white/10"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                            <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                            {isEditing ? 'Edit Coordinator' : 'Add New Coordinator'}
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            {isEditing ? 'Update coordinator details' : 'Create a new event coordinator'}
                        </p>
                    </div>
                </div>

                {/* Form Card */}
                <Card className="bg-black/40 border-red-600/30">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-red-500 text-lg">Coordinator Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-white">Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-black/40 border-red-600/30 text-white h-11"
                                    placeholder="Enter coordinator name"
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-white">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="bg-black/40 border-red-600/30 text-white h-11"
                                    placeholder="coordinator@example.com"
                                    required
                                />
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-white">Phone</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="bg-black/40 border-red-600/30 text-white h-11"
                                    placeholder="9876543210"
                                    maxLength={10}
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-white">
                                    Password {isEditing ? '(leave blank to keep current)' : '*'}
                                </Label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={(e) => {
                                                setFormData({ ...formData, password: e.target.value });
                                                setGeneratedPassword(e.target.value);
                                            }}
                                            className="bg-black/40 border-red-600/30 text-white pr-10 h-11"
                                            placeholder="Enter password"
                                            required={!isEditing}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={generatePassword}
                                        className="border-red-600/30 text-white hover:bg-red-600/10 h-11"
                                    >
                                        Generate
                                    </Button>
                                </div>
                                {generatedPassword && (
                                    <div className="flex items-center gap-2 mt-2 p-3 bg-green-900/20 border border-green-600/30 rounded-lg">
                                        <code className="text-green-400 text-sm flex-1 break-all">{generatedPassword}</code>
                                        <button
                                            type="button"
                                            onClick={copyPassword}
                                            className="text-green-400 hover:text-green-300 p-1"
                                        >
                                            {copiedPassword ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Assigned Events */}
                            <div className="space-y-2">
                                <Label className="text-white">Assigned Events</Label>
                                <div className="border border-red-600/30 rounded-lg p-4 max-h-48 overflow-y-auto space-y-3 bg-black/20">
                                    {events.length === 0 ? (
                                        <p className="text-gray-400 text-sm">No events available</p>
                                    ) : (
                                        events.map((event) => (
                                            <div key={event.id} className="flex items-center space-x-3">
                                                <Checkbox
                                                    id={`event-${event.id}`}
                                                    checked={formData.assigned_events.includes(event.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setFormData({
                                                                ...formData,
                                                                assigned_events: [...formData.assigned_events, event.id],
                                                            });
                                                        } else {
                                                            setFormData({
                                                                ...formData,
                                                                assigned_events: formData.assigned_events.filter((id) => id !== event.id),
                                                            });
                                                        }
                                                    }}
                                                    className="border-red-600/50 h-5 w-5"
                                                />
                                                <label
                                                    htmlFor={`event-${event.id}`}
                                                    className="text-sm text-gray-300 cursor-pointer flex-1"
                                                >
                                                    {event.name}
                                                </label>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <p className="text-gray-500 text-xs">
                                    Coordinators can only scan QR codes for their assigned events
                                </p>
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center space-x-3 py-2">
                                <Checkbox
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, is_active: checked as boolean })
                                    }
                                    className="border-red-600/50 h-5 w-5"
                                />
                                <label htmlFor="is_active" className="text-sm text-gray-300 cursor-pointer">
                                    Active (can log in and scan QR codes)
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-red-600/30">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate('/admin/coordinators')}
                                    className="border-red-600/30 text-white hover:bg-red-600/10 h-11"
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-red-600 hover:bg-red-700 h-11"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>{isEditing ? 'Update' : 'Create'} Coordinator</>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Login URL Info */}
                <Card className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border-blue-600/30">
                    <CardContent className="pt-6">
                        <h3 className="text-blue-400 font-semibold mb-2">Coordinator Login URL</h3>
                        <p className="text-gray-300 text-sm mb-3">
                            Share this URL with your coordinators:
                        </p>
                        <code className="bg-black/40 px-3 py-2 rounded text-blue-300 block text-sm break-all">
                            https://kaizen-ritp.in/coordinator/login
                        </code>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}

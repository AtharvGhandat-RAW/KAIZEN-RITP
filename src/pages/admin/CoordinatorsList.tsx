import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
    Plus,
    Pencil,
    Trash2,
    Users,
    Shield,
    Mail,
    Phone,
    Loader2,
    ExternalLink,
} from 'lucide-react';

interface Coordinator {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    assigned_events: string[];
    is_active: boolean;
    created_at: string;
}

interface Event {
    id: string;
    name: string;
}

export default function CoordinatorsPage() {
    const navigate = useNavigate();
    const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCoordinators();
        fetchEvents();
    }, []);

    const fetchCoordinators = async () => {
        try {
            const { data, error } = await supabase
                .from('coordinators')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCoordinators(data || []);
        } catch (error) {
            console.error('Error fetching coordinators:', error);
            toast.error('Failed to load coordinators');
        } finally {
            setLoading(false);
        }
    };

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('id, name')
                .order('name');

            if (error) throw error;
            setEvents((data || []) as Event[]);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;

        try {
            const { error } = await supabase
                .from('coordinators')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Coordinator deleted');
            fetchCoordinators();
        } catch (error) {
            console.error('Error deleting coordinator:', error);
            toast.error('Failed to delete coordinator');
        }
    };

    const toggleActive = async (coordinator: Coordinator) => {
        try {
            const { error } = await supabase
                .from('coordinators')
                .update({ is_active: !coordinator.is_active })
                .eq('id', coordinator.id);

            if (error) throw error;
            toast.success(`Coordinator ${coordinator.is_active ? 'deactivated' : 'activated'}`);
            fetchCoordinators();
        } catch (error) {
            console.error('Error toggling coordinator status:', error);
            toast.error('Failed to update coordinator status');
        }
    };

    const getEventName = (eventId: string) => {
        return events.find(e => e.id === eventId)?.name || 'Unknown Event';
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
            <div className="space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                            Coordinators
                        </h1>
                        <p className="text-gray-400 text-xs sm:text-sm mt-1">
                            Manage event coordinators who can scan QR codes
                        </p>
                    </div>

                    <Button
                        onClick={() => navigate('/admin/coordinators/new')}
                        className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Coordinator
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <Card className="bg-black/40 border-red-600/30">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                    <p className="text-gray-400 text-xs sm:text-sm">Total</p>
                                    <p className="text-xl sm:text-2xl font-bold text-white">{coordinators.length}</p>
                                </div>
                                <Users className="hidden sm:block w-8 h-8 text-red-500/50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-black/40 border-green-600/30">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                    <p className="text-gray-400 text-xs sm:text-sm">Active</p>
                                    <p className="text-xl sm:text-2xl font-bold text-green-400">
                                        {coordinators.filter((c) => c.is_active).length}
                                    </p>
                                </div>
                                <Shield className="hidden sm:block w-8 h-8 text-green-500/50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-black/40 border-yellow-600/30">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                    <p className="text-gray-400 text-xs sm:text-sm">Inactive</p>
                                    <p className="text-xl sm:text-2xl font-bold text-yellow-400">
                                        {coordinators.filter((c) => !c.is_active).length}
                                    </p>
                                </div>
                                <Shield className="hidden sm:block w-8 h-8 text-yellow-500/50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Coordinators List */}
                <Card className="bg-black/40 border-red-600/30">
                    <CardHeader className="pb-2 sm:pb-4">
                        <CardTitle className="text-white text-lg">All Coordinators</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {coordinators.length === 0 ? (
                            <div className="text-center py-8 sm:py-12">
                                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400">No coordinators yet</p>
                                <p className="text-gray-500 text-sm mb-4">Add your first coordinator to get started</p>
                                <Button
                                    onClick={() => navigate('/admin/coordinators/new')}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Coordinator
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {coordinators.map((coordinator) => (
                                    <div
                                        key={coordinator.id}
                                        className="bg-black/30 border border-red-600/20 rounded-lg p-4 hover:border-red-600/40 transition-colors"
                                    >
                                        {/* Mobile & Desktop Layout */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            {/* Info Section */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-white font-semibold truncate">
                                                        {coordinator.name}
                                                    </h3>
                                                    <Badge
                                                        className={`text-xs flex-shrink-0 ${coordinator.is_active
                                                            ? 'bg-green-500/20 text-green-500 border-green-500/30'
                                                            : 'bg-gray-500/20 text-gray-500 border-gray-500/30'
                                                            }`}
                                                    >
                                                        {coordinator.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                                                    <div className="flex items-center gap-1 text-gray-400">
                                                        <Mail className="w-3 h-3 flex-shrink-0" />
                                                        <span className="truncate">{coordinator.email}</span>
                                                    </div>
                                                    {coordinator.phone && (
                                                        <div className="flex items-center gap-1 text-gray-400">
                                                            <Phone className="w-3 h-3 flex-shrink-0" />
                                                            <span>{coordinator.phone}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Assigned Events */}
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {coordinator.assigned_events?.length > 0 ? (
                                                        <>
                                                            {coordinator.assigned_events.slice(0, 2).map((eventId) => (
                                                                <Badge
                                                                    key={eventId}
                                                                    variant="outline"
                                                                    className="text-xs border-red-600/30 text-red-400"
                                                                >
                                                                    {getEventName(eventId)}
                                                                </Badge>
                                                            ))}
                                                            {coordinator.assigned_events.length > 2 && (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs border-gray-600/30 text-gray-400"
                                                                >
                                                                    +{coordinator.assigned_events.length - 2} more
                                                                </Badge>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-500 text-xs">No events assigned</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 sm:gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => toggleActive(coordinator)}
                                                    className={`flex-1 sm:flex-none ${coordinator.is_active
                                                        ? 'text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10'
                                                        : 'text-green-500 hover:text-green-400 hover:bg-green-500/10'
                                                        }`}
                                                >
                                                    <Shield className="w-4 h-4 sm:mr-0 mr-1" />
                                                    <span className="sm:hidden">{coordinator.is_active ? 'Deactivate' : 'Activate'}</span>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => navigate(`/admin/coordinators/${coordinator.id}`)}
                                                    className="flex-1 sm:flex-none text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                                                >
                                                    <Pencil className="w-4 h-4 sm:mr-0 mr-1" />
                                                    <span className="sm:hidden">Edit</span>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(coordinator.id, coordinator.name)}
                                                    className="flex-1 sm:flex-none text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="w-4 h-4 sm:mr-0 mr-1" />
                                                    <span className="sm:hidden">Delete</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Login Instructions Card */}
                <Card className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border-blue-600/30">
                    <CardContent className="p-4 sm:pt-6 sm:p-6">
                        <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                            <ExternalLink className="w-4 h-4" />
                            Coordinator Login URL
                        </h3>
                        <p className="text-gray-300 text-sm mb-3">
                            Share this URL with your coordinators to access the QR scanner:
                        </p>
                        <div className="bg-black/40 p-3 rounded-lg">
                            <code className="text-blue-300 text-sm break-all">
                                https://kaizen-ritp.in/coordinator/login
                            </code>
                        </div>
                        <p className="text-gray-400 text-xs mt-2">
                            Coordinators will use their email and password to log in
                        </p>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}

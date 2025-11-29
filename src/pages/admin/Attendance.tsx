import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Users,
    CheckCircle,
    TrendingUp,
    Download,
    Search,
    Filter,
    RefreshCw,
    QrCode,
    UserCheck,
    Calendar,
    Mail,
    Phone,
    Building2,
    Clock,
    Loader2,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface AttendanceRecord {
    id: string;
    marked_at: string;
    verification_method: string;
    registrations: {
        id: string;
        profiles: {
            full_name: string;
            email: string;
            phone: string | null;
            college: string | null;
        };
    };
    events: {
        id: string;
        name: string;
    };
    coordinators: {
        id: string;
        name: string;
    } | null;
}

interface Event {
    id: string;
    name: string;
}

interface Stats {
    totalRegistrations: number;
    totalAttendance: number;
    attendanceRate: number;
    todayAttendance: number;
}

export default function AttendancePage() {
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Stats>({
        totalRegistrations: 0,
        totalAttendance: 0,
        attendanceRate: 0,
        todayAttendance: 0,
    });

    const fetchEvents = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('id, name')
                .order('name');

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    }, []);

    const fetchAttendance = useCallback(async () => {
        try {
            let query = supabase
                .from('attendance')
                .select(`
          id,
          marked_at,
          verification_method,
          registrations (
            id,
            profiles (
              full_name,
              email,
              phone,
              college
            )
          ),
          events (
            id,
            name
          ),
          coordinators (
            id,
            name
          )
        `)
                .order('marked_at', { ascending: false })
                .limit(100);

            if (selectedEvent !== 'all') {
                query = query.eq('event_id', selectedEvent);
            }

            const { data, error } = await query;

            if (error) throw error;
            setAttendance((data as unknown as AttendanceRecord[]) || []);
        } catch (error) {
            console.error('Error fetching attendance:', error);
            toast.error('Failed to load attendance records');
        } finally {
            setLoading(false);
        }
    }, [selectedEvent]);

    const fetchStats = useCallback(async () => {
        try {
            // Get total registrations (completed)
            let regQuery = supabase
                .from('registrations')
                .select('*', { count: 'exact', head: true })
                .in('payment_status', ['completed', 'verified']);

            if (selectedEvent !== 'all') {
                regQuery = regQuery.eq('event_id', selectedEvent);
            }

            const { count: regCount } = await regQuery;

            // Get total attendance
            let attQuery = supabase
                .from('attendance')
                .select('*', { count: 'exact', head: true });

            if (selectedEvent !== 'all') {
                attQuery = attQuery.eq('event_id', selectedEvent);
            }

            const { count: attCount } = await attQuery;

            // Get today's attendance
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let todayQuery = supabase
                .from('attendance')
                .select('*', { count: 'exact', head: true })
                .gte('marked_at', today.toISOString());

            if (selectedEvent !== 'all') {
                todayQuery = todayQuery.eq('event_id', selectedEvent);
            }

            const { count: todayCount } = await todayQuery;

            const totalReg = regCount || 0;
            const totalAtt = attCount || 0;

            setStats({
                totalRegistrations: totalReg,
                totalAttendance: totalAtt,
                attendanceRate: totalReg > 0 ? Math.round((totalAtt / totalReg) * 100) : 0,
                todayAttendance: todayCount || 0,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }, [selectedEvent]);

    useEffect(() => {
        fetchEvents();
        fetchAttendance();
        fetchStats();

        // Set up real-time subscription
        const channel = supabase
            .channel('attendance-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'attendance' },
                () => {
                    fetchAttendance();
                    fetchStats();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchEvents, fetchAttendance, fetchStats]);

    const exportToCSV = () => {
        const filteredRecords = getFilteredRecords();

        if (filteredRecords.length === 0) {
            toast.error('No records to export');
            return;
        }

        const headers = ['Name', 'Email', 'Phone', 'College', 'Event', 'Marked At', 'Method', 'Marked By'];
        const rows = filteredRecords.map(record => [
            record.registrations?.profiles?.full_name || '',
            record.registrations?.profiles?.email || '',
            record.registrations?.profiles?.phone || '',
            record.registrations?.profiles?.college || '',
            record.events?.name || '',
            new Date(record.marked_at).toLocaleString(),
            record.verification_method,
            record.coordinators?.name || 'Admin',
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `attendance-${selectedEvent === 'all' ? 'all-events' : selectedEvent}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        toast.success('Attendance exported successfully');
    };

    const getFilteredRecords = () => {
        if (!searchQuery.trim()) return attendance;

        const query = searchQuery.toLowerCase();
        return attendance.filter(
            (record) =>
                record.registrations?.profiles?.full_name?.toLowerCase().includes(query) ||
                record.registrations?.profiles?.email?.toLowerCase().includes(query) ||
                record.registrations?.profiles?.phone?.includes(query) ||
                record.registrations?.profiles?.college?.toLowerCase().includes(query)
        );
    };

    const getMethodBadge = (method: string) => {
        const styles: Record<string, string> = {
            qr_scan: 'bg-green-500/20 text-green-500 border-green-500/30',
            manual: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
            bulk: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
        };
        const icons: Record<string, React.ReactNode> = {
            qr_scan: <QrCode className="w-3 h-3 mr-1" />,
            manual: <UserCheck className="w-3 h-3 mr-1" />,
            bulk: <Users className="w-3 h-3 mr-1" />,
        };
        return (
            <Badge className={`${styles[method] || styles.manual} flex items-center`}>
                {icons[method]}
                {method === 'qr_scan' ? 'QR Scan' : method.charAt(0).toUpperCase() + method.slice(1)}
            </Badge>
        );
    };

    const filteredRecords = getFilteredRecords();

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
                <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                                <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0" />
                                <span className="truncate">Attendance</span>
                            </h1>
                            <p className="text-gray-400 text-xs sm:text-sm mt-1">
                                Real-time tracking
                            </p>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    fetchAttendance();
                                    fetchStats();
                                }}
                                className="border-red-600/30 flex-1 sm:flex-none h-9 px-3"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span className="hidden sm:inline ml-2">Refresh</span>
                            </Button>
                            <Button
                                size="sm"
                                onClick={exportToCSV}
                                className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none h-9 px-3"
                            >
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:inline ml-2">Export</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                    <Card className="bg-black/40 border-blue-600/30">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                    <p className="text-gray-400 text-xs sm:text-sm">Total Reg.</p>
                                    <p className="text-xl sm:text-2xl font-bold text-blue-400">
                                        {stats.totalRegistrations}
                                    </p>
                                </div>
                                <Users className="hidden sm:block w-8 h-8 text-blue-500/50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-black/40 border-green-600/30">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                    <p className="text-gray-400 text-xs sm:text-sm">Attendance</p>
                                    <p className="text-xl sm:text-2xl font-bold text-green-400">
                                        {stats.totalAttendance}
                                    </p>
                                </div>
                                <CheckCircle className="hidden sm:block w-8 h-8 text-green-500/50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-black/40 border-yellow-600/30">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                    <p className="text-gray-400 text-xs sm:text-sm">Rate</p>
                                    <p className="text-xl sm:text-2xl font-bold text-yellow-400">
                                        {stats.attendanceRate}%
                                    </p>
                                </div>
                                <TrendingUp className="hidden sm:block w-8 h-8 text-yellow-500/50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-black/40 border-red-600/30">
                        <CardContent className="p-3 sm:pt-6 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                    <p className="text-gray-400 text-xs sm:text-sm">Today</p>
                                    <p className="text-xl sm:text-2xl font-bold text-red-400">
                                        {stats.todayAttendance}
                                    </p>
                                </div>
                                <Calendar className="hidden sm:block w-8 h-8 text-red-500/50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="bg-black/40 border-red-600/30">
                    <CardContent className="p-3 sm:pt-6 sm:p-6">
                        <div className="flex flex-col gap-3 sm:gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <Input
                                    placeholder="Search name, email, phone..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-black/40 border-red-600/30 pl-10 text-sm"
                                />
                            </div>
                            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                                <SelectTrigger className="w-full bg-black/40 border-red-600/30 text-sm">
                                    <Filter className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="Filter by event" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900 border-red-600/30">
                                    <SelectItem value="all">All Events</SelectItem>
                                    {events.map((event) => (
                                        <SelectItem key={event.id} value={event.id}>
                                            {event.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Attendance Records */}
                <Card className="bg-black/40 border-red-600/30">
                    <CardHeader className="pb-2 sm:pb-4">
                        <CardTitle className="text-white flex items-center justify-between text-lg">
                            <span>Attendance Records</span>
                            <Badge variant="outline" className="border-gray-600 text-xs">
                                {filteredRecords.length} records
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredRecords.length === 0 ? (
                            <div className="text-center py-8">
                                <UserCheck className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400">No attendance records found</p>
                                {searchQuery && (
                                    <p className="text-gray-500 text-sm">
                                        Try adjusting your search query
                                    </p>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Mobile Card View */}
                                <div className="block lg:hidden space-y-3">
                                    {filteredRecords.map((record) => (
                                        <div
                                            key={record.id}
                                            className="bg-black/30 border border-red-600/20 rounded-lg p-4 hover:border-red-600/40 transition-colors"
                                        >
                                            {/* Name and Event */}
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-white font-semibold truncate">
                                                        {record.registrations?.profiles?.full_name}
                                                    </h3>
                                                    <p className="text-gray-500 text-xs truncate">
                                                        {record.registrations?.profiles?.college}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className="border-red-600/30 text-red-400 text-xs flex-shrink-0"
                                                >
                                                    {record.events?.name}
                                                </Badge>
                                            </div>

                                            {/* Contact Info */}
                                            <div className="space-y-1.5 mb-3">
                                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                    <Mail className="w-3 h-3 flex-shrink-0" />
                                                    <span className="truncate">{record.registrations?.profiles?.email}</span>
                                                </div>
                                                {record.registrations?.profiles?.phone && (
                                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                        <Phone className="w-3 h-3 flex-shrink-0" />
                                                        <span>{record.registrations?.profiles?.phone}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Method and Time */}
                                            <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-red-600/10">
                                                <div className="flex items-center gap-2">
                                                    {getMethodBadge(record.verification_method)}
                                                    <span className="text-gray-500 text-xs">
                                                        by {record.coordinators?.name || 'Admin'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 text-gray-500 text-xs">
                                                    <Clock className="w-3 h-3" />
                                                    <span>
                                                        {new Date(record.marked_at).toLocaleDateString()}{' '}
                                                        {new Date(record.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden lg:block overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-red-600/30">
                                                <TableHead className="text-gray-400">Attendee</TableHead>
                                                <TableHead className="text-gray-400">Contact</TableHead>
                                                <TableHead className="text-gray-400">Event</TableHead>
                                                <TableHead className="text-gray-400">Method</TableHead>
                                                <TableHead className="text-gray-400">Marked By</TableHead>
                                                <TableHead className="text-gray-400">Time</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredRecords.map((record) => (
                                                <TableRow key={record.id} className="border-red-600/20">
                                                    <TableCell>
                                                        <div>
                                                            <p className="text-white font-medium">
                                                                {record.registrations?.profiles?.full_name}
                                                            </p>
                                                            <p className="text-gray-500 text-xs">
                                                                {record.registrations?.profiles?.college}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <p className="text-gray-300 text-sm">
                                                                {record.registrations?.profiles?.email}
                                                            </p>
                                                            <p className="text-gray-500 text-xs">
                                                                {record.registrations?.profiles?.phone}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className="border-red-600/30 text-red-400"
                                                        >
                                                            {record.events?.name}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{getMethodBadge(record.verification_method)}</TableCell>
                                                    <TableCell className="text-gray-400 text-sm">
                                                        {record.coordinators?.name || 'Admin'}
                                                    </TableCell>
                                                    <TableCell className="text-gray-400 text-sm">
                                                        <div>
                                                            <p>{new Date(record.marked_at).toLocaleDateString()}</p>
                                                            <p className="text-gray-500 text-xs">
                                                                {new Date(record.marked_at).toLocaleTimeString()}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}

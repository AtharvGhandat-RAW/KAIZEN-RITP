import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Download, FileText, Users, DollarSign, Calendar, TrendingUp } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  event_date: string;
}

interface ReportStats {
  totalRegistrations: number;
  totalRevenue: number;
  pendingPayments: number;
  completedPayments: number;
  upcomingEvents: number;
  totalParticipants: number;
}

export default function Reports() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [stats, setStats] = useState<ReportStats>({
    totalRegistrations: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    upcomingEvents: 0,
    totalParticipants: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('id, name, event_date')
      .order('event_date', { ascending: false });

    if (data) setEvents(data);
  };

  const fetchStats = async (eventId: string, eventList: Event[]) => {
    // Fetch registrations
    let registrationsQuery = supabase
      .from('registrations')
      .select('*, events(name, registration_fee), profiles(full_name, email, phone, college)');

    if (eventId !== 'all') {
      registrationsQuery = registrationsQuery.eq('event_id', eventId);
    }

    const { data: registrations } = await registrationsQuery;
    if (registrations) {
      const totalRegistrations = registrations.length;
      const completedPayments = registrations.filter(r => r.payment_status === 'completed').length;
      const pendingPayments = registrations.filter(r => r.payment_status === 'pending').length;

      const totalRevenue = registrations
        .filter(r => r.payment_status === 'completed')
        .reduce((sum, r) => sum + (r.events?.registration_fee || 0), 0);

      setStats({
        totalRegistrations,
        totalRevenue,
        pendingPayments,
        completedPayments,
        upcomingEvents: eventList.filter(e => new Date(e.event_date) > new Date()).length,
        totalParticipants: totalRegistrations,
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase
        .from('events')
        .select('id, name, event_date')
        .order('event_date', { ascending: false });

      if (data) {
        setEvents(data);
        fetchStats(selectedEvent, data);
      }
    };

    init();

    // Real-time listener for registrations
    const channel = supabase
      .channel('reports-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => {
        fetchStats(selectedEvent, events);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Separate effect for fetching stats when selectedEvent changes
  useEffect(() => {
    if (events.length > 0) {
      fetchStats(selectedEvent, events);
    }
  }, [selectedEvent, events]);

  const generateCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row =>
      Object.values(row).map(val => {
        // Handle null/undefined
        if (val === null || val === undefined) return '';
        // Convert to string and escape
        const stringVal = String(val);
        // Escape quotes and wrap in quotes if contains comma, newline, or quote
        if (stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('"')) {
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      }).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportRegistrationsReport = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('registrations')
        .select('*, events(name, event_date, registration_fee), profiles(full_name, email, phone, college, year, branch), teams(name)');

      if (selectedEvent !== 'all') {
        query = query.eq('event_id', selectedEvent);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const csvData = data.map(reg => ({
          'Registration ID': reg.id || '',
          'Student Name': reg.profiles?.full_name || '',
          'Email': reg.profiles?.email || '',
          'Phone': reg.profiles?.phone || '',
          'College': reg.profiles?.college || '',
          'Year': reg.profiles?.year || '',
          'Branch': reg.profiles?.branch || '',
          'Event Name': reg.events?.name || '',
          'Event Date': reg.events?.event_date ? new Date(reg.events.event_date).toLocaleDateString() : '',
          'Team Name': reg.teams?.name || 'Individual',
          'Registration Type': reg.registration_type || '',
          'Payment Status': reg.payment_status || '',
          'Payment Proof URL': reg.payment_proof_url || 'Not uploaded',
          'Registration Fee': reg.events?.registration_fee || 0,
          'Registered On': new Date(reg.created_at).toLocaleDateString(),
        }));

        generateCSV(csvData, `registrations_report_${new Date().toISOString().split('T')[0]}.csv`);
        toast.success('Report exported successfully');
      } else {
        toast.error('No registrations found to export');
      }
    } catch (error) {
      toast.error('Failed to export report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportPaymentReport = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('registrations')
        .select('*, events(name, registration_fee), profiles(full_name, email, phone)');

      if (selectedEvent !== 'all') {
        query = query.eq('event_id', selectedEvent);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const csvData = data.map(reg => ({
          'Student Name': reg.profiles?.full_name || '',
          'Email': reg.profiles?.email || '',
          'Phone': reg.profiles?.phone || '',
          'Event Name': reg.events?.name || '',
          'Registration Fee': reg.events?.registration_fee || 0,
          'Payment Status': reg.payment_status || '',
          'Payment ID': reg.payment_id || 'N/A',
          'Registration Date': new Date(reg.created_at).toLocaleDateString(),
        }));

        generateCSV(csvData, `payment_report_${new Date().toISOString().split('T')[0]}.csv`);
        toast.success('Payment report exported successfully');
      } else {
        toast.error('No payment data found to export');
      }
    } catch (error) {
      toast.error('Failed to export payment report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportEventSummaryReport = async () => {
    setLoading(true);
    try {
      const { data: eventData, error } = await supabase
        .from('events')
        .select('*, registrations(id, payment_status)');

      if (error) {
        throw error;
      }

      if (eventData && eventData.length > 0) {
        const csvData = eventData.map(event => ({
          'Event Name': event.name || '',
          'Category': event.category || '',
          'Event Type': event.event_type || '',
          'Event Date': new Date(event.event_date).toLocaleDateString(),
          'Venue': event.venue || '',
          'Registration Fee': event.registration_fee || 0,
          'Total Registrations': event.registrations?.length || 0,
          'Completed Payments': event.registrations?.filter(r => r.payment_status === 'completed').length || 0,
          'Pending Payments': event.registrations?.filter(r => r.payment_status === 'pending').length || 0,
          'Revenue': (event.registrations?.filter(r => r.payment_status === 'completed').length || 0) * (event.registration_fee || 0),
          'Status': event.status || '',
        }));

        generateCSV(csvData, `event_summary_${new Date().toISOString().split('T')[0]}.csv`);
        toast.success('Event summary exported successfully');
      } else {
        toast.error('No events found to export');
      }
    } catch (error) {
      toast.error('Failed to export event summary');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportAttendanceSheet = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('registrations')
        .select('*, events(name, event_date, venue), profiles(full_name, phone, college)')
        .eq('payment_status', 'completed');

      if (selectedEvent !== 'all') {
        query = query.eq('event_id', selectedEvent);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const csvData = data.map((reg, index) => ({
          'S.No': index + 1,
          'Student Name': reg.profiles?.full_name || '',
          'Phone': reg.profiles?.phone || '',
          'College': reg.profiles?.college || '',
          'Event Name': reg.events?.name || '',
          'Event Date': reg.events?.event_date ? new Date(reg.events.event_date).toLocaleDateString() : '',
          'Venue': reg.events?.venue || '',
          'Attendance': '',
          'Signature': '',
        }));

        generateCSV(csvData, `attendance_sheet_${new Date().toISOString().split('T')[0]}.csv`);
        toast.success('Attendance sheet exported successfully');
      } else {
        toast.error('No completed registrations found to export');
      }
    } catch (error) {
      toast.error('Failed to export attendance sheet');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">Reports & Analytics</h1>
            <p className="text-foreground/60 mt-1 text-sm sm:text-base">Generate comprehensive reports for events, registrations, and payments</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRegistrations}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{stats.totalRevenue}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <span className="text-green-600 font-semibold">{stats.completedPayments} Completed</span>
                  {' / '}
                  <span className="text-yellow-600 font-semibold">{stats.pendingPayments} Pending</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Reports</CardTitle>
              <CardDescription>Select an event to generate specific reports</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Report Types */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>Registration Report</CardTitle>
                </div>
                <CardDescription>
                  Complete student details with registration information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={exportRegistrationsReport}
                  disabled={loading}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Registrations
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <CardTitle>Payment Report</CardTitle>
                </div>
                <CardDescription>
                  Payment status and transaction details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={exportPaymentReport}
                  disabled={loading}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Payments
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle>Event Summary</CardTitle>
                </div>
                <CardDescription>
                  Overview of all events with statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={exportEventSummaryReport}
                  disabled={loading}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Summary
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle>Attendance Sheet</CardTitle>
                </div>
                <CardDescription>
                  Printable attendance sheet for events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={exportAttendanceSheet}
                  disabled={loading}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Attendance
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}

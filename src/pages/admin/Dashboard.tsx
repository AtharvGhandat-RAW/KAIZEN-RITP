import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Users, Calendar, DollarSign, CheckCircle, Clock, AlertCircle,
  Download, Eye, TrendingUp, TrendingDown, Activity, Zap,
  RefreshCw, Bell, BarChart3, PieChart, ArrowUpRight, ArrowDownRight,
  Building2, UserCheck, UserX, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, BarChart, Bar, Legend, Area, AreaChart
} from 'recharts';

interface Stats {
  totalRegistrations: number;
  totalEvents: number;
  verifiedPayments: number;
  totalAmount: number;
  pendingPayments: number;
  totalColleges: number;
  rejectedPayments: number;
  todayRegistrations: number;
  weekRegistrations: number;
  conversionRate: number;
}

interface RecentRegistration {
  id: string;
  created_at: string;
  profiles: { full_name: string; email: string; college: string };
  events: { name: string; registration_fee: number };
  payment_status: string;
}

interface EventStats {
  event_id: string;
  event_name: string;
  total_registrations: number;
  verified_payments: number;
  pending_payments: number;
  registration_fee: number;
  max_participants: number;
}

interface DailyStats {
  date: string;
  registrations: number;
  revenue: number;
}

interface AdminProfile {
  full_name: string;
  role: string;
}

const CHART_COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalRegistrations: 0,
    totalEvents: 0,
    verifiedPayments: 0,
    totalAmount: 0,
    pendingPayments: 0,
    totalColleges: 0,
    rejectedPayments: 0,
    todayRegistrations: 0,
    weekRegistrations: 0,
    conversionRate: 0
  });
  const [recentRegistrations, setRecentRegistrations] = useState<RecentRegistration[]>([]);
  const [eventStats, setEventStats] = useState<EventStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [queries, setQueries] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('7days');
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  useEffect(() => {
    fetchAll();
    fetchAdminProfile();

    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => {
        fetchAll();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queries' }, () => {
        fetchQueries();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    fetchDailyStats();
  }, [timeRange]);

  const fetchAll = async () => {
    await Promise.all([
      fetchStats(),
      fetchRecentRegistrations(),
      fetchEventStats(),
      fetchQueries(),
      fetchDailyStats()
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const fetchAdminProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('admin_users')
        .select('full_name, role')
        .eq('user_id', user.id)
        .single();
      if (data) setAdminProfile(data);
    }
  };

  const fetchDailyStats = async () => {
    try {
      const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 1;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: registrations } = await supabase
        .from('registrations')
        .select('created_at, payment_status, events(registration_fee)')
        .gte('created_at', startDate.toISOString());

      if (registrations) {
        const dailyMap = new Map<string, { registrations: number; revenue: number }>();

        for (let i = 0; i < days; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dailyMap.set(dateStr, { registrations: 0, revenue: 0 });
        }

        registrations.forEach((reg: any) => {
          const dateStr = new Date(reg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const existing = dailyMap.get(dateStr) || { registrations: 0, revenue: 0 };
          existing.registrations += 1;
          if (reg.payment_status === 'verified' || reg.payment_status === 'completed') {
            existing.revenue += reg.events?.registration_fee || 0;
          }
          dailyMap.set(dateStr, existing);
        });

        const chartData = Array.from(dailyMap.entries())
          .map(([date, data]) => ({ date, ...data }))
          .reverse();

        setDailyStats(chartData);
      }
    } catch (error) {
      console.error('Error fetching daily stats:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [regsCount, eventsCount, verifiedData, pendingData, rejectedData, profilesData, todayData, weekData] = await Promise.all([
        supabase.from('registrations').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('registrations').select('events(registration_fee)').or('payment_status.eq.verified,payment_status.eq.completed'),
        supabase.from('registrations').select('*').eq('payment_status', 'pending'),
        supabase.from('registrations').select('*').eq('payment_status', 'rejected'),
        supabase.from('profiles').select('college'),
        supabase.from('registrations').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('registrations').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString())
      ]);

      const uniqueColleges = new Set(profilesData.data?.map(p => p.college).filter(Boolean));
      const totalAmount = verifiedData.data?.reduce((sum, reg: any) => sum + (Number(reg.events?.registration_fee) || 0), 0) || 0;
      const totalRegs = regsCount.count || 0;
      const verifiedCount = verifiedData.data?.length || 0;
      const conversionRate = totalRegs > 0 ? Math.round((verifiedCount / totalRegs) * 100) : 0;

      setStats({
        totalRegistrations: totalRegs,
        totalEvents: eventsCount.count || 0,
        verifiedPayments: verifiedCount,
        totalAmount: totalAmount,
        pendingPayments: pendingData.data?.length || 0,
        totalColleges: uniqueColleges.size,
        rejectedPayments: rejectedData.data?.length || 0,
        todayRegistrations: todayData.count || 0,
        weekRegistrations: weekData.count || 0,
        conversionRate
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('id, created_at, payment_status, profiles(full_name, email, college), events(name, registration_fee)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setRecentRegistrations(data as RecentRegistration[]);
      }
    } catch (error) {
      console.error('Error fetching recent registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventStats = async () => {
    try {
      const { data: events } = await supabase.from('events').select('id, name, registration_fee, max_participants');

      if (!events) return;

      const eventStatsData = await Promise.all(
        events.map(async (event) => {
          const [total, verified, pending] = await Promise.all([
            supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('event_id', event.id),
            supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('event_id', event.id).or('payment_status.eq.verified,payment_status.eq.completed'),
            supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('event_id', event.id).eq('payment_status', 'pending')
          ]);

          return {
            event_id: event.id,
            event_name: event.name,
            total_registrations: total.count || 0,
            verified_payments: verified.count || 0,
            pending_payments: pending.count || 0,
            registration_fee: Number(event.registration_fee) || 0,
            max_participants: event.max_participants || 100
          };
        })
      );

      setEventStats(eventStatsData);
    } catch (error) {
      console.error('Error fetching event stats:', error);
    }
  };

  const fetchQueries = async () => {
    try {
      const { count } = await supabase
        .from('queries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new');
      setQueries(count || 0);
    } catch (error) {
      console.error('Error fetching queries:', error);
    }
  };

  // Payment status data for pie chart
  const paymentStatusData = useMemo(() => [
    { name: 'Verified', value: stats.verifiedPayments, color: '#10B981' },
    { name: 'Pending', value: stats.pendingPayments, color: '#F59E0B' },
    { name: 'Rejected', value: stats.rejectedPayments, color: '#EF4444' }
  ].filter(item => item.value > 0), [stats]);

  // Calculate trends
  const registrationTrend = useMemo(() => {
    if (dailyStats.length < 2) return 0;
    const recent = dailyStats.slice(-3).reduce((sum, d) => sum + d.registrations, 0);
    const previous = dailyStats.slice(-6, -3).reduce((sum, d) => sum + d.registrations, 0);
    if (previous === 0) return recent > 0 ? 100 : 0;
    return Math.round(((recent - previous) / previous) * 100);
  }, [dailyStats]);

  const statCards = [
    {
      icon: Users,
      label: 'Total Registrations',
      value: stats.totalRegistrations,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      trend: registrationTrend,
      subtext: `${stats.todayRegistrations} today`
    },
    {
      icon: DollarSign,
      label: 'Revenue Collected',
      value: `₹${stats.totalAmount.toLocaleString()}`,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      subtext: `From ${stats.verifiedPayments} verified`
    },
    {
      icon: CheckCircle,
      label: 'Verified Payments',
      value: stats.verifiedPayments,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      subtext: `${stats.conversionRate}% conversion`
    },
    {
      icon: Clock,
      label: 'Pending Payments',
      value: stats.pendingPayments,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      urgent: stats.pendingPayments > 5
    },
    {
      icon: Calendar,
      label: 'Active Events',
      value: stats.totalEvents,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      icon: Building2,
      label: 'Colleges',
      value: stats.totalColleges,
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10'
    }
  ];

  const filteredRegistrations = filterStatus === 'all'
    ? recentRegistrations
    : recentRegistrations.filter(reg => reg.payment_status === filterStatus);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
          {/* Header with Greeting */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-red-500" />
                {getGreeting()}, {adminProfile?.full_name?.split(' ')[0] || 'Admin'}!
              </h1>
              <p className="text-white/60 mt-1">Here's what's happening with KAIZEN today.</p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="border-red-600/30 hover:bg-red-600/10 backdrop-blur-sm"
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[130px] bg-black/40 border-red-600/30 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Alerts Section */}
          {(stats.pendingPayments > 0 || queries > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-6 duration-500 delay-100">
              {stats.pendingPayments > 0 && (
                <Card
                  className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-600/30 p-4 cursor-pointer hover:scale-[1.02] transition-all duration-300 backdrop-blur-md"
                  onClick={() => navigate('/admin/registrations')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Payment Verification Pending</p>
                        <p className="text-white/70 text-sm">{stats.pendingPayments} payments waiting</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-yellow-500" />
                  </div>
                </Card>
              )}
              {queries > 0 && (
                <Card
                  className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-600/30 p-4 cursor-pointer hover:scale-[1.02] transition-all duration-300 backdrop-blur-md"
                  onClick={() => navigate('/admin/queries')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Bell className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-white font-medium">New Contact Queries</p>
                        <p className="text-white/70 text-sm">{queries} queries received</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-blue-500" />
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-8 duration-700 delay-200">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={stat.label}
                  className={`bg-black/40 backdrop-blur-md border-red-600/30 p-4 hover:border-red-500/50 transition-all duration-300 hover:scale-105 ${stat.bg} relative overflow-hidden group`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`w-5 h-5 ${stat.color} opacity-70`} />
                      {stat.trend !== undefined && stat.trend !== 0 && (
                        <Badge variant="outline" className={`text-xs ${stat.trend > 0 ? 'text-green-500 border-green-500/30' : 'text-red-500 border-red-500/30'}`}>
                          {stat.trend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                          {Math.abs(stat.trend)}%
                        </Badge>
                      )}
                      {stat.urgent && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                        </span>
                      )}
                    </div>
                    <p className={`text-xl sm:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-white/60 text-xs mt-1">{stat.label}</p>
                    {stat.subtext && (
                      <p className="text-white/40 text-xs mt-0.5">{stat.subtext}</p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            {/* Registration Trend Chart */}
            <Card className="lg:col-span-2 bg-black/40 backdrop-blur-md border-red-600/30 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-red-500" />
                  <h2 className="text-lg font-bold text-white">Registration Trend</h2>
                </div>
                <Badge variant="outline" className="text-white/60">
                  {timeRange === '7days' ? 'Last 7 Days' : timeRange === '30days' ? 'Last 30 Days' : 'Today'}
                </Badge>
              </div>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyStats}>
                    <defs>
                      <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#666" tick={{ fill: '#999', fontSize: 12 }} />
                    <YAxis stroke="#666" tick={{ fill: '#999', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="registrations"
                      stroke="#EF4444"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRegistrations)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Payment Status Pie Chart */}
            <Card className="bg-black/40 backdrop-blur-md border-red-600/30 p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-bold text-white">Payment Status</h2>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={paymentStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {paymentStatusData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-white/70 text-xs">{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="bg-black/40 backdrop-blur-md border-red-600/30 p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button
                onClick={() => navigate('/admin/registrations')}
                variant="outline"
                className="border-red-600/30 hover:bg-red-600/10 h-auto py-4 flex-col gap-2 backdrop-blur-sm"
              >
                <UserCheck className="w-5 h-5 text-green-500" />
                <span className="text-xs">Verify Payments</span>
              </Button>
              <Button
                onClick={() => navigate('/admin/events')}
                variant="outline"
                className="border-red-600/30 hover:bg-red-600/10 h-auto py-4 flex-col gap-2 backdrop-blur-sm"
              >
                <Calendar className="w-5 h-5 text-purple-500" />
                <span className="text-xs">Manage Events</span>
              </Button>
              <Button
                onClick={() => navigate('/admin/reports')}
                variant="outline"
                className="border-red-600/30 hover:bg-red-600/10 h-auto py-4 flex-col gap-2 backdrop-blur-sm"
              >
                <Download className="w-5 h-5 text-blue-500" />
                <span className="text-xs">Export Reports</span>
              </Button>
              <Button
                onClick={() => navigate('/admin/queries')}
                variant="outline"
                className="border-red-600/30 hover:bg-red-600/10 h-auto py-4 flex-col gap-2 relative backdrop-blur-sm"
              >
                <Bell className="w-5 h-5 text-orange-500" />
                <span className="text-xs">View Queries</span>
                {queries > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5">{queries}</Badge>
                )}
              </Button>
            </div>
          </Card>

          {/* Event-wise Overview with Progress Bars */}
          <Card className="bg-black/40 backdrop-blur-md border-red-600/30 p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-500" />
                Event Performance
              </h2>
              <Button onClick={() => navigate('/admin/reports')} variant="ghost" size="sm" className="text-red-500">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>

            <div className="space-y-4">
              {eventStats.map((event) => {
                const capacity = (event.total_registrations / event.max_participants) * 100;
                const revenue = event.verified_payments * event.registration_fee;
                return (
                  <div key={event.event_id} className="p-4 bg-black/20 border border-red-600/20 rounded-lg hover:bg-black/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-white font-medium">{event.event_name}</h3>
                        <p className="text-white/50 text-sm">₹{event.registration_fee} per registration</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-green-500 font-bold">₹{revenue.toLocaleString()}</p>
                          <p className="text-white/50 text-xs">Revenue</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/70">Capacity</span>
                        <span className="text-white">{event.total_registrations}/{event.max_participants}</span>
                      </div>
                      <Progress value={Math.min(capacity, 100)} className="h-2" />
                    </div>

                    <div className="flex gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-white/70 text-xs">Verified: {event.verified_payments}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        <span className="text-white/70 text-xs">Pending: {event.pending_payments}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {eventStats.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-white/20 mx-auto mb-2" />
                  <p className="text-white/50">No events created yet</p>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-black/40 backdrop-blur-md border-red-600/30 p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-600">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-500" />
                Recent Registrations
              </h2>

              <div className="flex gap-2 w-full sm:w-auto">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-[150px] bg-black/40 border-red-600/30 backdrop-blur-sm">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => navigate('/admin/registrations')} variant="outline" size="sm" className="border-red-600/30 backdrop-blur-sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredRegistrations.slice(0, 5).map((reg, index) => (
                <div
                  key={reg.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-black/20 border border-red-600/20 rounded-lg hover:bg-black/30 transition-all duration-300 cursor-pointer group"
                  onClick={() => navigate('/admin/registrations')}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold">
                      {reg.profiles?.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm sm:text-base group-hover:text-red-400 transition-colors">
                        {reg.profiles?.full_name}
                      </p>
                      <p className="text-white/60 text-xs sm:text-sm">{reg.profiles?.email}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="outline" className="text-xs text-white/60 border-white/20">
                          {reg.events?.name}
                        </Badge>
                        {reg.profiles?.college && (
                          <Badge variant="outline" className="text-xs text-white/40 border-white/10">
                            {reg.profiles.college}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                    <Badge className={`text-xs ${reg.payment_status === 'verified' || reg.payment_status === 'completed'
                        ? 'bg-green-600/20 text-green-500 border-green-500/30'
                        : reg.payment_status === 'rejected'
                          ? 'bg-red-600/20 text-red-500 border-red-500/30'
                          : 'bg-yellow-600/20 text-yellow-500 border-yellow-500/30'
                      }`}>
                      {reg.payment_status === 'verified' || reg.payment_status === 'completed' ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : reg.payment_status === 'rejected' ? (
                        <UserX className="w-3 h-3 mr-1" />
                      ) : (
                        <Clock className="w-3 h-3 mr-1" />
                      )}
                      {reg.payment_status}
                    </Badge>
                    <p className="text-white/40 text-xs">
                      {new Date(reg.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {filteredRegistrations.length === 0 && !loading && (
                <div className="text-center py-8 sm:py-12">
                  <Users className="w-12 h-12 text-white/20 mx-auto mb-2" />
                  <p className="text-white/60 text-sm sm:text-base mb-2">No registrations found</p>
                  <p className="text-white/40 text-xs sm:text-sm">Try changing the filter or wait for new submissions</p>
                </div>
              )}
              {loading && (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin mx-auto" />
                </div>
              )}
            </div>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
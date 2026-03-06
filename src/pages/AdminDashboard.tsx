import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { Users, MapPin, Coffee, MessageSquare, Activity, AlertTriangle, ArrowUpRight, ShieldAlert, Settings, Megaphone, UserPlus, LogIn, LogOut, QrCode, Clock, Tag, Gift, Download, Loader2, CalendarDays, RefreshCw, TrendingUp, TrendingDown, PlaneTakeoff } from 'lucide-react';
import { generateSummaryPDF } from '../utils/generateSummaryPDF';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { format } from 'date-fns';

interface ChartData {
  registrationExitTimeline: Array<{ date: string; registrations: number; exits: number }>;
  avgStayDuration: Array<{ date: string; avgHours: number }>;
  overallAvgStayHours: number;
}

interface DailyStats {
  date: string;
  hourlyTimeline: Array<{ hour: string; label: string; checkIns: number; checkOuts: number }>;
  qrRenewalTimeline: Array<{ hour: string; label: string; renewals: number }>;
  summary: {
    totalCheckIns: number;
    totalCheckOuts: number;
    totalQrRenewals: number;
    totalQrExpired: number;
    totalDeparted?: number;
    totalRegistrations: number;
    netFlow: number;
  };
}

function formatDateLabel(dateStr: string): string {
  try {
    return format(new Date(dateStr + 'T00:00:00'), 'MMM d');
  } catch {
    return dateStr;
  }
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const canWrite = true;
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [dailyStatsDate, setDailyStatsDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [dailyStatsLoading, setDailyStatsLoading] = useState(false);

  const handleExportSummary = async () => {
    setExporting(true);
    setExportError(null);
    try {
      await generateSummaryPDF();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate report';
      console.error('Export summary failed:', msg);
      setExportError(msg);
      setTimeout(() => setExportError(null), 5000);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const fetchStats = () => {
      fetch('/api/dashboard')
        .then(res => res.json())
        .then(data => setStats(data))
        .catch(err => console.error('Failed to fetch dashboard stats:', err));
    };

    const fetchChartData = () => {
      fetch('/api/dashboard/charts')
        .then(res => res.json())
        .then(data => setChartData(data))
        .catch(err => console.error('Failed to fetch chart data:', err));
    };

    fetchStats();
    fetchChartData();
    const interval = setInterval(() => {
      fetchStats();
    }, 5000);
    const chartInterval = setInterval(fetchChartData, 15000);
    return () => {
      clearInterval(interval);
      clearInterval(chartInterval);
    };
  }, []);

  // Fetch daily stats when the selected date changes
  useEffect(() => {
    const fetchDailyStats = () => {
      setDailyStatsLoading(true);
      fetch(`/api/dashboard/daily-stats?date=${dailyStatsDate}`)
        .then(res => res.json())
        .then(data => setDailyStats(data))
        .catch(err => console.error('Failed to fetch daily stats:', err))
        .finally(() => setDailyStatsLoading(false));
    };

    fetchDailyStats();
    const interval = setInterval(fetchDailyStats, 15000);
    return () => clearInterval(interval);
  }, [dailyStatsDate]);

  if (!stats) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <AdminSidebar
        activePage="overview"
        headerActions={
          <>
            <button
              onClick={handleExportSummary}
              disabled={exporting}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-full text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ring-1 ring-slate-900/5"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export Summary
                </>
              )}
            </button>
            {canWrite && (
              <button onClick={() => navigate('/control/broadcast')} className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-2 ring-1 ring-indigo-900/5">
                <ShieldAlert className="h-4 w-4" /> Broadcast Alert
              </button>
            )}
          </>
        }
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Command Center</h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Live Event: War-related cancellations
            </p>
          </div>

          {/* Export Error Toast */}
          {exportError && (
            <div className="fixed top-4 right-4 z-50 bg-rose-600 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-2 animate-fade-in">
              <AlertTriangle className="h-4 w-4" />
              {exportError}
            </div>
          )}
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Stranded</h3>
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="text-4xl font-light text-slate-900">{stats.totalPassengers}</p>
            <p className="text-sm text-emerald-600 mt-2 font-medium flex items-center gap-1">
              <ArrowUpRight className="h-4 w-4" /> Registered today
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Checked In</h3>
              <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <MapPin className="h-5 w-5" />
              </div>
            </div>
            <p className="text-4xl font-light text-slate-900">{stats.checkedIn}</p>
            <p className="text-sm text-slate-500 mt-2 font-medium">Currently in rest zones</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Checked Out</h3>
              <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <LogOut className="h-5 w-5" />
              </div>
            </div>
            <p className="text-4xl font-light text-slate-900">{stats.checkedOut}</p>
            <p className="text-sm text-slate-500 mt-2 font-medium">Left rest zones</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Departed</h3>
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <PlaneTakeoff className="h-5 w-5" />
              </div>
            </div>
            <p className="text-4xl font-light text-slate-900">{stats.departed}</p>
            <p className="text-sm text-slate-500 mt-2 font-medium">Left us</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Open Requests</h3>
              <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="h-5 w-5" />
              </div>
            </div>
            <p className="text-4xl font-light text-slate-900">{stats.messagesCount}</p>
            <p className="text-sm text-rose-600 mt-2 font-medium flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" /> Needs attention
            </p>
          </div>
        </div>



        {/* ───── Charts Section ───── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
          {/* Daily Registrations & Exits Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Daily Registrations & Exits</h2>
              <p className="text-sm text-slate-500 mt-1">
                New passengers registered per day with check-out overlay
              </p>
            </div>
            <div className="p-6">
              {chartData && chartData.registrationExitTimeline.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={chartData.registrationExitTimeline}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gradRegistrations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradExits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickFormatter={formatDateLabel}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        fontSize: '13px',
                      }}
                      labelFormatter={formatDateLabel}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="registrations"
                      name="New Registrations"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fill="url(#gradRegistrations)"
                      dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: '#6366f1' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="exits"
                      name="Exits (Check-outs)"
                      stroke="#f43f5e"
                      strokeWidth={2.5}
                      fill="url(#gradExits)"
                      dot={{ r: 3, fill: '#f43f5e', strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: '#f43f5e' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-slate-400">
                  <UserPlus className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">No registration data available yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Average Stay Duration Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Average Stay Duration</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Average hours passengers stayed per day
                  </p>
                </div>
                {chartData && chartData.overallAvgStayHours > 0 && (
                  <div className="text-right">
                    <p className="text-2xl font-light text-indigo-600">{chartData.overallAvgStayHours}h</p>
                    <p className="text-xs text-slate-500 font-medium">Overall Avg</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6">
              {chartData && chartData.avgStayDuration.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={chartData.avgStayDuration}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gradStay" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickFormatter={formatDateLabel}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      label={{
                        value: 'Hours',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fontSize: 12, fill: '#94a3b8' },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        fontSize: '13px',
                      }}
                      labelFormatter={formatDateLabel}
                      formatter={(value: number) => [`${value}h`, 'Avg Stay']}
                    />
                    {chartData.overallAvgStayHours > 0 && (
                      <ReferenceLine
                        y={chartData.overallAvgStayHours}
                        stroke="#6366f1"
                        strokeDasharray="6 4"
                        strokeWidth={1.5}
                        label={{
                          value: `Avg: ${chartData.overallAvgStayHours}h`,
                          position: 'right',
                          fill: '#6366f1',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      />
                    )}
                    <Bar
                      dataKey="avgHours"
                      name="Avg Stay (hours)"
                      fill="url(#gradStay)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-slate-400">
                  <Clock className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">No stay duration data available yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ───── Daily Check-in / Check-out & QR Renewal Section ───── */}
        <div className="mb-10">
          {/* Date Picker Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Daily Activity Breakdown</h2>
                <p className="text-sm text-slate-500">Hourly check-ins, check-outs & QR renewals</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {dailyStatsLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              )}
              <input
                type="date"
                value={dailyStatsDate}
                onChange={(e) => setDailyStatsDate(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Summary Stats Row */}
          {dailyStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <LogIn className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Check-Ins</span>
                </div>
                <p className="text-2xl font-light text-slate-900">{dailyStats.summary.totalCheckIns}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <LogOut className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Check-Outs</span>
                </div>
                <p className="text-2xl font-light text-slate-900">{dailyStats.summary.totalCheckOuts}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <PlaneTakeoff className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Departed</span>
                </div>
                <p className="text-2xl font-light text-slate-900">{dailyStats.summary.totalDeparted || 0}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  {dailyStats.summary.netFlow >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-indigo-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-rose-500" />
                  )}
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Net Flow</span>
                </div>
                <p className={`text-2xl font-light ${dailyStats.summary.netFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {dailyStats.summary.netFlow >= 0 ? '+' : ''}{dailyStats.summary.netFlow}
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Registrations</span>
                </div>
                <p className="text-2xl font-light text-slate-900">{dailyStats.summary.totalRegistrations}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="h-4 w-4 text-violet-500" />
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">QR Renewals</span>
                </div>
                <p className="text-2xl font-light text-slate-900">{dailyStats.summary.totalQrRenewals}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-rose-500" />
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">QR Expired</span>
                </div>
                <p className="text-2xl font-light text-slate-900">{dailyStats.summary.totalQrExpired}</p>
              </div>
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Hourly Check-in / Check-out Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">Check-Ins vs Check-Outs</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Hourly breakdown for {dailyStatsDate ? format(new Date(dailyStatsDate + 'T00:00:00'), 'MMM d, yyyy') : 'today'}
                </p>
              </div>
              <div className="p-6">
                {dailyStats && dailyStats.hourlyTimeline.some(h => h.checkIns > 0 || h.checkOuts > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={dailyStats.hourlyTimeline}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="gradCheckIn" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.4} />
                        </linearGradient>
                        <linearGradient id="gradCheckOut" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.4} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        interval={1}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                          fontSize: '13px',
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }}
                      />
                      <Bar
                        dataKey="checkIns"
                        name="Check-Ins"
                        fill="url(#gradCheckIn)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={24}
                      />
                      <Bar
                        dataKey="checkOuts"
                        name="Check-Outs"
                        fill="url(#gradCheckOut)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={24}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-slate-400">
                    <LogIn className="h-12 w-12 mb-3 opacity-30" />
                    <p className="text-sm">No check-in / check-out data for this day</p>
                  </div>
                )}
              </div>
            </div>

            {/* QR Renewal Stats Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">QR Code Renewals</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Hourly QR renewal activity for {dailyStatsDate ? format(new Date(dailyStatsDate + 'T00:00:00'), 'MMM d, yyyy') : 'today'}
                    </p>
                  </div>
                  {dailyStats && (
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-light text-violet-600">{dailyStats.summary.totalQrRenewals}</p>
                        <p className="text-xs text-slate-500 font-medium">Renewed</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-light text-rose-500">{dailyStats.summary.totalQrExpired}</p>
                        <p className="text-xs text-slate-500 font-medium">Expired Scans</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6">
                {dailyStats && dailyStats.qrRenewalTimeline.some(h => h.renewals > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={dailyStats.qrRenewalTimeline}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="gradRenewal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        interval={1}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                          fontSize: '13px',
                        }}
                        formatter={(value: number) => [`${value}`, 'Renewals']}
                      />
                      <Bar
                        dataKey="renewals"
                        name="QR Renewals"
                        fill="url(#gradRenewal)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-slate-400">
                    <QrCode className="h-12 w-12 mb-3 opacity-30" />
                    <p className="text-sm">No QR renewal data for this day</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>


      </main>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
    Users, MapPin, Coffee, Globe, Plane, Navigation,
    TrendingUp, LayoutDashboard, Database, ShieldCheck, Clock,
    Download, Image as ImageIcon, LogOut
} from 'lucide-react';
import { format } from 'date-fns';

interface StakeholderStats {
    summary: {
        totalPassengers: number;
        checkedIn: number;
    };
    nationalities: Array<{ name: string; value: number }>;
    airlines: Array<{ name: string; value: number }>;
    destinations: Array<{ name: string; value: number }>;
    countries: Array<{ name: string; value: number }>;
    timeline: Array<{ date: string; registrations: number; occupancy: number }>;
    departures: Array<{ date: string; count: number }>;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#64748b'];

export default function StakeholderPortal() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<StakeholderStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const pdfRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const downloadPDF = async () => {
        const input = pdfRef.current;
        if (!input || isDownloading) return;

        setIsDownloading(true);
        try {
            const width = input.scrollWidth;
            const height = input.scrollHeight;

            // Apply scale by taking a larger image
            const imgData = await toPng(input, {
                cacheBust: true,
                backgroundColor: '#020617',
                pixelRatio: 2,
                width: width,
                height: height,
                style: {
                    margin: '0', // Prevents mx-auto from causing shift within foreignObject
                },
                filter: (node: any) => node.id !== 'export-buttons'
            });

            // If the content height is greater than A4 landscape height, 
            // we might want to either:
            // 1. Let it overflow (bad)
            // 2. Create a custom sized PDF (better for sharing digitally)
            const customPdf = new jsPDF({
                orientation: width > height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [width, height]
            });

            customPdf.addImage(imgData, 'PNG', 0, 0, width, height);
            customPdf.save('aerocare-dashboard.pdf');
        } catch (error) {
            console.error('Error generating PDF', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    const downloadPNG = async () => {
        const input = pdfRef.current;
        if (!input || isDownloading) return;

        setIsDownloading(true);
        try {
            const width = input.scrollWidth;
            const height = input.scrollHeight;

            const imgData = await toPng(input, {
                cacheBust: true,
                backgroundColor: '#020617',
                pixelRatio: 2,
                width: width,
                height: height,
                style: {
                    margin: '0', // Prevents mx-auto from causing shift within foreignObject
                },
                filter: (node: any) => node.id !== 'export-buttons'
            });

            const link = document.createElement('a');
            link.download = 'aerocare-dashboard.png';
            link.href = imgData;
            link.click();
        } catch (error) {
            console.error('Error generating PNG', error);
            alert('Failed to generate PNG. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/stakeholder/stats');
                const data = await res.json();
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch stakeholder stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                    <p className="text-slate-400 font-medium animate-pulse">Loading Stakeholder Data...</p>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-rose-400 font-bold text-xl mb-4">Error loading data</p>
                    <button onClick={() => window.location.reload()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
            {/* Premium Gradient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/10 blur-[120px] rounded-full"></div>
            </div>

            <div ref={pdfRef} className="relative z-10 max-w-7xl mx-auto px-4 py-8 lg:px-8 bg-slate-950">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
                            <LayoutDashboard className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-bold text-white tracking-tight">Stakeholder Analytics</h1>
                                <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Operational Live</span>
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                Aggregated Disruption Management Data • Non-PII Public Record
                            </p>
                        </div>

                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div id="export-buttons" className="flex items-center gap-2">
                            <button
                                onClick={downloadPDF}
                                disabled={isDownloading}
                                className={`flex items-center gap-2 px-4 py-3 border rounded-xl font-medium transition-all shadow-sm ${isDownloading
                                    ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                                    : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20'
                                    }`}
                                title="Download as PDF"
                            >
                                <Download className={`h-4 w-4 ${isDownloading ? 'animate-bounce' : ''}`} />
                                {isDownloading ? 'Processing...' : 'PDF'}
                            </button>
                            <button
                                onClick={downloadPNG}
                                disabled={isDownloading}
                                className={`flex items-center gap-2 px-4 py-3 border rounded-xl font-medium transition-all shadow-sm ${isDownloading
                                    ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                                    : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border-indigo-500/20'
                                    }`}
                                title="Download as PNG"
                            >
                                <ImageIcon className={`h-4 w-4 ${isDownloading ? 'animate-pulse' : ''}`} />
                                {isDownloading ? 'Processing...' : 'PNG'}
                            </button>
                        </div>
                        <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl px-5 py-3 flex flex-col items-end">
                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Last Updated</span>
                            <span className="text-sm font-mono text-indigo-400">{format(new Date(), 'HH:mm:ss')}</span>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl font-medium transition-all shadow-sm"
                            title="Sign Out"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="text-sm hidden sm:inline">Sign Out</span>
                        </button>
                    </div>
                </header>

                {/* Top Summary Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl group hover:border-indigo-500/30 transition-all duration-500">
                        <div className="flex items-center justify-between mb-6">
                            <div className="h-12 w-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <Users className="h-6 w-6" />
                            </div>
                            <span className="text-[10px] font-bold text-indigo-400/50 uppercase tracking-widest">Total Registered</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-bold text-white tracking-tighter">{stats.summary.totalPassengers.toLocaleString()}</span>
                            <span className="text-slate-500 font-medium">passengers</span>
                        </div>
                        <p className="text-slate-400 text-sm mt-4">Total impacted travelers registered in system</p>
                    </div>

                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl group hover:border-emerald-500/30 transition-all duration-500">
                        <div className="flex items-center justify-between mb-6">
                            <div className="h-12 w-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <MapPin className="h-6 w-6" />
                            </div>
                            <span className="text-[10px] font-bold text-emerald-400/50 uppercase tracking-widest">Currently Internal</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-bold text-white tracking-tighter">{stats.summary.checkedIn.toLocaleString()}</span>
                            <span className="text-slate-500 font-medium">in-facility</span>
                        </div>
                        <p className="text-slate-400 text-sm mt-4">Passengers currently checked into airport facilities</p>
                    </div>
                </div>

                {/* Main Analytics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

                    {/* Registration Timeline */}
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-white">Impact Timeline</h3>
                                <p className="text-sm text-slate-400">Daily passenger registration trends</p>
                            </div>
                            <div className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                                <TrendingUp className="h-3.5 w-3.5" /> 14-Day View
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.timeline}>
                                    <defs>
                                        <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 11 }}
                                        tickFormatter={(val) => format(new Date(val), 'MMM d')}
                                    />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                        labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                                    />
                                    <Legend />
                                    <Area
                                        name="Daily Registrations"
                                        type="monotone"
                                        dataKey="registrations"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorRegistrations)"
                                    />
                                    <Area
                                        name="Inside Facility"
                                        type="monotone"
                                        dataKey="occupancy"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorOccupancy)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Nationality Distribution */}
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-white">Global Origin Breakdown</h3>
                                <p className="text-sm text-slate-400">Top 10 nationalities impacted</p>
                            </div>
                            <Globe className="text-indigo-400/30 h-8 w-8" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats.nationalities}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {stats.nationalities.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2">
                                {stats.nationalities.slice(0, 5).map((entry, index) => (
                                    <div key={entry.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            <span className="text-sm text-slate-300">{entry.name}</span>
                                        </div>
                                        <span className="text-xs font-mono text-slate-500">{entry.value} travelers</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Expected Departures Row */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl mb-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-white">Expected Departures</h3>
                            <p className="text-sm text-slate-400">Scheduled departure distribution (Estimated Timeline)</p>
                        </div>
                        <div className="bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" /> Forward Outlook
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.departures}>
                                <defs>
                                    <linearGradient id="colorDepartures" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    tickFormatter={(val) => {
                                        try {
                                            return format(new Date(val), 'MMM d');
                                        } catch (e) {
                                            return val;
                                        }
                                    }}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                                    cursor={{ fill: '#ffffff05' }}
                                />
                                <Bar
                                    name="Expected Departures"
                                    dataKey="count"
                                    fill="url(#colorDepartures)"
                                    radius={[6, 6, 0, 0]}
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Airline Breakdown */}
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl lg:col-span-1">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-10 w-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center">
                                <Plane className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Carriers Impacted</h3>
                        </div>
                        <div className="space-y-5">
                            {stats.airlines.length > 0 ? stats.airlines.slice(0, 8).map((air, idx) => {
                                const maxVal = stats.airlines[0].value;
                                const pct = (air.value / maxVal) * 100;
                                return (
                                    <div key={air.name}>
                                        <div className="flex justify-between text-xs mb-1.5 font-medium">
                                            <span className="text-slate-300 truncate w-40">{air.name}</span>
                                            <span className="text-slate-500">{air.value}</span>
                                        </div>
                                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }}></div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <p className="text-slate-500 text-sm italic">No carrier data yet</p>
                            )}
                        </div>
                    </div>

                    {/* Destination Breakdown */}
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl lg:col-span-1">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-10 w-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                                <Navigation className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Key Destinations</h3>
                        </div>
                        <div className="space-y-5">
                            {stats.destinations.length > 0 ? stats.destinations.slice(0, 8).map((dest, idx) => {
                                const maxVal = stats.destinations[0].value;
                                const pct = (dest.value / maxVal) * 100;
                                return (
                                    <div key={dest.name}>
                                        <div className="flex justify-between text-xs mb-1.5 font-medium">
                                            <span className="text-slate-300 truncate w-40">{dest.name}</span>
                                            <span className="text-slate-500">{dest.value}</span>
                                        </div>
                                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }}></div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <p className="text-slate-500 text-sm italic">No destination data yet</p>
                            )}
                        </div>
                    </div>

                    {/* Country Breakdown */}
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl lg:col-span-1">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-10 w-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center">
                                <Globe className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Countries Impacted</h3>
                        </div>
                        <div className="space-y-5">
                            {stats.countries && stats.countries.length > 0 ? stats.countries.slice(0, 8).map((country, idx) => {
                                const maxVal = stats.countries[0].value;
                                const pct = (country.value / maxVal) * 100;
                                return (
                                    <div key={country.name}>
                                        <div className="flex justify-between text-xs mb-1.5 font-medium">
                                            <span className="text-slate-300 truncate w-40">{country.name}</span>
                                            <span className="text-slate-500">{country.value}</span>
                                        </div>
                                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }}></div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <p className="text-slate-500 text-sm italic">No country data yet</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer info */}
                <footer className="mt-16 text-center pb-12">
                    <p className="text-slate-500 text-xs">
                        © 2026 AeroCare Disruption Management Platform. All data presented is anonymized and aggregated for public governance and multi-agency coordination.
                    </p>
                </footer>
            </div>
        </div>
    );
}

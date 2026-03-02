import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, MapPin, Coffee, MessageSquare, Activity, AlertTriangle, ArrowUpRight, ShieldAlert } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = () => {
      fetch('/api/dashboard')
        .then(res => res.json())
        .then(data => setStats(data));
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

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
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
            A
          </div>
          <span className="text-xl font-bold text-white tracking-tight">AeroCare</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-indigo-600/10 text-indigo-400 rounded-xl font-medium border border-indigo-500/20">
            <Activity className="h-5 w-5" /> Overview
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl font-medium transition-colors">
            <MapPin className="h-5 w-5" /> Locations
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl font-medium transition-colors">
            <Users className="h-5 w-5" /> Passengers
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl font-medium transition-colors">
            <Coffee className="h-5 w-5" /> Benefits
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl font-medium transition-colors">
            <MessageSquare className="h-5 w-5" /> Support
          </a>
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <Link to="/" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors">
            <ArrowUpRight className="h-4 w-4" /> Exit Dashboard
          </Link>
        </div>
      </aside>

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
          
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors">
              Export Report
            </button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" /> Broadcast Alert
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
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
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Benefits Used</h3>
              <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <Coffee className="h-5 w-5" />
              </div>
            </div>
            <p className="text-4xl font-light text-slate-900">{stats.benefitsUsed}</p>
            <p className="text-sm text-slate-500 mt-2 font-medium">Vouchers & discounts redeemed</p>
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

        {/* Locations Occupancy */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-10">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Locations Occupancy</h2>
            <Link to="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</Link>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {stats.locationsOccupancy.map((loc: any, i: number) => {
                const percentage = Math.round((loc.occupancy / loc.capacity) * 100);
                let colorClass = 'bg-emerald-500';
                if (percentage > 75) colorClass = 'bg-amber-500';
                if (percentage > 90) colorClass = 'bg-rose-500';

                return (
                  <div key={i}>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <h4 className="font-semibold text-slate-900">{loc.name}</h4>
                        <p className="text-sm text-slate-500">{loc.occupancy} / {loc.capacity} passengers</p>
                      </div>
                      <span className={`text-sm font-bold ${percentage > 90 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className={`h-3 rounded-full ${colorClass} transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Recent Activity Feed Placeholder */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Live Activity Feed</h2>
          </div>
          <div className="p-6 text-center text-slate-500 py-12">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Activity feed will populate as passengers interact with the system.</p>
          </div>
        </div>

      </main>
    </div>
  );
}

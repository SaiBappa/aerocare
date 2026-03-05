import { Link } from 'react-router-dom';
import { Users, ShieldAlert, Smartphone, LayoutDashboard, ArrowUpRight } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 rounded-2xl flex items-center justify-center shadow-lg mb-6 overflow-hidden">
            <img src="/favicon.png" alt="VelanaCare Logo" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">AeroCare</h1>
          <p className="mt-3 text-lg text-slate-600">Disruption Management Platform</p>
        </div>

        <div className="mt-10 grid gap-6">
          <Link
            to="/staff"
            className="group relative flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all"
          >
            <div className="flex-shrink-0 h-12 w-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Staff Portal</h3>
              <p className="text-sm text-slate-500">Register passengers & scan QRs</p>
            </div>
          </Link>

          <Link
            to="/control"
            className="group relative flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-300 transition-all"
          >
            <div className="flex-shrink-0 h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Admin Dashboard</h3>
              <p className="text-sm text-slate-500">Real-time monitoring & reports</p>
            </div>
          </Link>


          <Link
            to="/stakeholder"
            className="group relative flex items-center gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/50 transition-all duration-300"
          >
            <div className="flex-shrink-0 h-12 w-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Stakeholder Portal</h3>
              <p className="text-sm text-slate-400 font-medium">Public analytics for coordination</p>
            </div>
            <div className="ml-auto">
              <ArrowUpRight className="h-5 w-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
            </div>
          </Link>

          <Link
            to="/passenger"
            className="group relative flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all"
          >
            <div className="flex-shrink-0 h-12 w-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Passenger App</h3>
              <p className="text-sm text-slate-500">Register or login for assistance</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}


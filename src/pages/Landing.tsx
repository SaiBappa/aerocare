import { Link } from 'react-router-dom';
import { Plane, Users, ShieldAlert, Smartphone } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-6">
            <Plane className="h-8 w-8 text-white" />
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
            to="/admin"
            className="group relative flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:indigo-300 transition-all"
          >
            <div className="flex-shrink-0 h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Admin Dashboard</h3>
              <p className="text-sm text-slate-500">Real-time monitoring & reports</p>
            </div>
          </Link>

          <div className="relative flex items-center gap-4 p-6 bg-slate-100 rounded-2xl border border-slate-200 opacity-75">
            <div className="flex-shrink-0 h-12 w-12 bg-slate-200 text-slate-500 rounded-xl flex items-center justify-center">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Passenger App</h3>
              <p className="text-sm text-slate-500">Access via SMS link or QR scan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

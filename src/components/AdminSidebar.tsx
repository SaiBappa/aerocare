import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ReactNode } from 'react';
import {
    Activity, Megaphone, Users, Coffee, MessageSquare, Settings,
    ArrowUpRight, LayoutDashboard, BarChart2, LogOut
} from 'lucide-react';

type ActivePage = 'overview' | 'activity' | 'broadcast' | 'passengers' | 'support' | 'settings' | 'stakeholder';

interface AdminSidebarProps {
    activePage: ActivePage;
    headerActions?: ReactNode;
}

export default function AdminSidebar({ activePage, headerActions }: AdminSidebarProps) {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/admin/login');
    };

    const navItems: { key: ActivePage; label: string; icon: any; to: string }[] = [
        { key: 'overview', label: 'Overview', icon: LayoutDashboard, to: '/control' },
        { key: 'passengers', label: 'Passengers', icon: Users, to: '/control/passengers' },
        { key: 'broadcast', label: 'Broadcast', icon: Megaphone, to: '/control/broadcast' },
        { key: 'support', label: 'Support', icon: MessageSquare, to: '/control/support' },
        { key: 'activity', label: 'Activity', icon: Activity, to: '/control/activity' },
        { key: 'stakeholder', label: 'Stakeholder View', icon: BarChart2, to: '/stakeholder' },
    ];

    return (
        <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex">
            {/* Top Right Floating Actions */}
            <div className="fixed top-6 right-8 z-50 flex items-center gap-3">
                {headerActions && (
                    <div className="flex items-center gap-3">
                        {headerActions}
                    </div>
                )}

                <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm rounded-full p-1.5 ring-1 ring-slate-900/5 hover:shadow-md transition-all">
                    <div className="relative flex group/tt">
                        <Link
                            to="/"
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex items-center justify-center group"
                        >
                            <ArrowUpRight className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        </Link>
                        <span className="absolute top-10 right-0 w-max px-2.5 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded shadow-lg opacity-0 invisible group-hover/tt:opacity-100 group-hover/tt:visible transition-all duration-200 z-50">
                            Switch to Passenger View
                        </span>
                    </div>

                    <div className="w-[1px] h-4 bg-slate-200"></div>

                    <div className="relative flex group/tt2">
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors flex items-center justify-center group"
                        >
                            <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        </button>
                        <span className="absolute top-10 right-0 w-max px-2.5 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded shadow-lg opacity-0 invisible group-hover/tt2:opacity-100 group-hover/tt2:visible transition-all duration-200 z-50">
                            Sign Out of Admin Control
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-6 flex items-center gap-3 border-b border-slate-800">
                <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                    A
                </div>
                <span className="text-xl font-bold text-white tracking-tight">AeroCare</span>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map(({ key, label, icon: Icon, to }) => (
                    <Link
                        key={key}
                        to={to}
                        className={
                            activePage === key
                                ? 'flex items-center gap-3 px-4 py-3 bg-indigo-600/10 text-indigo-400 rounded-xl font-medium border border-indigo-500/20'
                                : 'flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl font-medium transition-colors'
                        }
                    >
                        <Icon className="h-5 w-5" /> {label}
                    </Link>
                ))}

                <div className="pt-4 mt-4 border-t border-slate-800">
                    <Link
                        to="/control/settings"
                        className={
                            activePage === 'settings'
                                ? 'flex items-center gap-3 px-4 py-3 bg-indigo-600/10 text-indigo-400 rounded-xl font-medium border border-indigo-500/20'
                                : 'flex items-center gap-3 px-4 py-3 hover:bg-slate-800 hover:text-white rounded-xl font-medium transition-colors'
                        }
                    >
                        <Settings className="h-5 w-5" /> Settings
                    </Link>
                </div>
            </nav>

        </aside>
    );
}

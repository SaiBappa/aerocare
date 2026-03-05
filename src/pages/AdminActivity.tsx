import { useState, useEffect } from 'react';
import { Activity, UserPlus, LogIn, LogOut, Clock, QrCode, Gift, Loader2 } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import { supabase } from '../supabase';

interface ActivityItem {
    id: number;
    type: string;
    description: string;
    passenger_id: number | null;
    passenger_name: string | null;
    metadata: string | null;
    timestamp: string;
}

function getRelativeTime(timestamp: string): string {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 10) return 'just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay}d ago`;
}

function getActivityConfig(type: string) {
    switch (type) {
        case 'registration':
            return { icon: UserPlus, bgColor: 'bg-blue-50', iconColor: 'text-blue-600', pillBg: 'bg-blue-100 text-blue-700', label: 'Registered' };
        case 'check-in':
            return { icon: LogIn, bgColor: 'bg-emerald-50', iconColor: 'text-emerald-600', pillBg: 'bg-emerald-100 text-emerald-700', label: 'Checked In' };
        case 'check-out':
            return { icon: LogOut, bgColor: 'bg-amber-50', iconColor: 'text-amber-600', pillBg: 'bg-amber-100 text-amber-700', label: 'Checked Out' };
        case 'qr-expired':
            return { icon: Clock, bgColor: 'bg-rose-50', iconColor: 'text-rose-600', pillBg: 'bg-rose-100 text-rose-700', label: 'QR Expired' };
        case 'qr-renewed':
            return { icon: QrCode, bgColor: 'bg-violet-50', iconColor: 'text-violet-600', pillBg: 'bg-violet-100 text-violet-700', label: 'QR Renewed' };
        default:
            return { icon: Activity, bgColor: 'bg-slate-50', iconColor: 'text-slate-600', pillBg: 'bg-slate-100 text-slate-700', label: type };
    }
}

export default function AdminActivity() {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchActivities = () => {
        fetch('/api/activity-feed?limit=50')
            .then(res => res.json())
            .then(data => {
                setActivities(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch activity feed:', err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchActivities();

        const channel = supabase.channel('activity_feed_realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, (payload) => {
                const newActivity = payload.new as ActivityItem;
                setActivities(prev => {
                    if (prev.some(a => a.id === newActivity.id)) return prev;
                    return [newActivity, ...prev].slice(0, 50);
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            <AdminSidebar activePage="activity" />

            <main className="flex-1 overflow-y-auto p-6 lg:p-10">
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Live Activity</h1>
                        <p className="text-slate-500 mt-1 flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            Real-time events from all passenger interactions
                        </p>
                    </div>
                    <div className="text-xs text-slate-400 font-medium">Live updates enabled</div>
                </header>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {loading && activities.length === 0 ? (
                        <div className="p-12 text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium tracking-tight">Loading activities...</p>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p className="font-medium tracking-tight">No activity logs found yet.</p>
                            <p className="text-sm mt-1">Logs will appear as passengers interact with the system.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {activities.map((activity) => {
                                const config = getActivityConfig(activity.type);
                                const IconComponent = config.icon;
                                return (
                                    <div key={activity.id} className="px-6 py-5 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                                        <div className={`h-10 w-10 rounded-xl ${config.bgColor} ${config.iconColor} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm`}>
                                            <IconComponent className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${config.pillBg}`}>
                                                    {config.label}
                                                </span>
                                                {activity.passenger_name && (
                                                    <span className="text-sm font-semibold text-slate-800 truncate">
                                                        {activity.passenger_name}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600 leading-relaxed font-medium tracking-tight">
                                                {activity.description}
                                            </p>
                                            {activity.metadata && (
                                                <div className="text-xs text-slate-500 mt-2 flex flex-wrap gap-2">
                                                    {(() => {
                                                        try {
                                                            const parsed = typeof activity.metadata === 'string' ? JSON.parse(activity.metadata) : activity.metadata;
                                                            return Object.entries(parsed).map(([k, v]) => (
                                                                <span key={k} className="font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block">
                                                                    <span className="text-slate-400">{k}:</span> <span className="text-slate-700">{String(v)}</span>
                                                                </span>
                                                            ));
                                                        } catch (e) {
                                                            return (
                                                                <span className="font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block text-slate-400">
                                                                    {String(activity.metadata)}
                                                                </span>
                                                            );
                                                        }
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-400 font-medium whitespace-nowrap flex-shrink-0 mt-1">
                                            {getRelativeTime(activity.timestamp)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { useAuth } from '../auth/AuthContext';
import {
    Settings,
    MapPin,
    Users,
    Coffee,
    MessageSquare,
    Activity,
    ArrowUpRight,
    Trash2,
    Check,
    X,
    AlertTriangle,
    FileText,
    Send,
    Megaphone,
    Filter,
    Globe,
    Plane,
    Radio,
    Eye,
    EyeOff,
    Save,
    Loader2,
    Pin,
} from 'lucide-react';

interface BroadcastItem {
    id: number;
    title: string;
    message: string;
    target_type: string;
    target_airline: string | null;
    target_destination: string | null;
    sent_at: string;
    sent_by: string;
}

interface BroadcastFormData {
    title: string;
    message: string;
    target_type: string;
    target_airline: string;
    target_destination: string;
}

const EMPTY_BROADCAST_FORM: BroadcastFormData = {
    title: '', message: '', target_type: 'all', target_airline: '', target_destination: '',
};

export default function AdminBroadcast() {
    const { canWrite, canDelete } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // ───── Broadcast Messages State ─────
    const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
    const [broadcastsLoading, setBroadcastsLoading] = useState(true);
    const [showBroadcastForm, setShowBroadcastForm] = useState(false);
    const [broadcastFormData, setBroadcastFormData] = useState<BroadcastFormData>(EMPTY_BROADCAST_FORM);
    const [broadcastFormErrors, setBroadcastFormErrors] = useState<Partial<Record<keyof BroadcastFormData, string>>>({});
    const [sendingBroadcast, setSendingBroadcast] = useState(false);
    const [deletingBroadcastId, setDeletingBroadcastId] = useState<number | null>(null);
    const [deletingBroadcast, setDeletingBroadcast] = useState(false);
    const [filterAirlines, setFilterAirlines] = useState<string[]>([]);
    const [filterDestinations, setFilterDestinations] = useState<string[]>([]);
    const [lastBroadcastRecipients, setLastBroadcastRecipients] = useState<number | null>(null);

    // ───── Always On Message State ─────
    const [alwaysOnTitle, setAlwaysOnTitle] = useState('');
    const [alwaysOnMessage, setAlwaysOnMessage] = useState('');
    const [alwaysOnVisible, setAlwaysOnVisible] = useState(false);
    const [savingAlwaysOn, setSavingAlwaysOn] = useState(false);
    const [alwaysOnLoaded, setAlwaysOnLoaded] = useState(false);

    const fetchBroadcasts = useCallback(async () => {
        try {
            const res = await fetch('/api/broadcasts');
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            const data = await res.json();
            setBroadcasts(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load broadcasts';
            console.error('fetchBroadcasts error:', message);
            setError(message);
        } finally {
            setBroadcastsLoading(false);
        }
    }, []);

    const fetchFilterOptions = useCallback(async () => {
        try {
            const res = await fetch('/api/passengers/filters/options');
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            const data = await res.json();
            setFilterAirlines(data.airlines || []);
            setFilterDestinations(data.destinations || []);
        } catch (err) {
            console.error('fetchFilterOptions error:', err);
        }
    }, []);

    const fetchAlwaysOn = useCallback(async () => {
        try {
            const res = await fetch('/api/settings');
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            const data = await res.json();
            setAlwaysOnTitle(data.always_on_title || '');
            setAlwaysOnMessage(data.always_on_message || '');
            setAlwaysOnVisible(data.always_on_visible === 'true');
            setAlwaysOnLoaded(true);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load always-on settings';
            console.error('fetchAlwaysOn error:', message);
        }
    }, []);

    const handleSaveAlwaysOn = async () => {
        if (!alwaysOnTitle.trim()) {
            setError('Always-on message title is required');
            return;
        }
        if (!alwaysOnMessage.trim()) {
            setError('Always-on message content is required');
            return;
        }

        setSavingAlwaysOn(true);
        try {
            const settings = [
                { key: 'always_on_title', value: alwaysOnTitle.trim() },
                { key: 'always_on_message', value: alwaysOnMessage.trim() },
                { key: 'always_on_visible', value: String(alwaysOnVisible) },
            ];
            for (const s of settings) {
                const res = await fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(s),
                });
                if (!res.ok) {
                    const body = await res.json();
                    throw new Error(body.error || `HTTP ${res.status}`);
                }
            }
            setSuccessMsg('Always-on message saved successfully');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save always-on message';
            console.error('handleSaveAlwaysOn error:', message);
            setError(message);
        } finally {
            setSavingAlwaysOn(false);
        }
    };

    useEffect(() => {
        fetchBroadcasts();
        fetchFilterOptions();
        fetchAlwaysOn();
    }, [fetchBroadcasts, fetchFilterOptions, fetchAlwaysOn]);

    // Auto-dismiss success message
    useEffect(() => {
        if (successMsg) {
            const timer = setTimeout(() => setSuccessMsg(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMsg]);

    // ───── Broadcast Form Handlers ─────
    const validateBroadcastForm = (): boolean => {
        const errors: Partial<Record<keyof BroadcastFormData, string>> = {};

        if (!broadcastFormData.title.trim()) {
            errors.title = 'Title is required';
        }
        if (!broadcastFormData.message.trim()) {
            errors.message = 'Message is required';
        }
        if (broadcastFormData.target_type === 'airline' && !broadcastFormData.target_airline.trim()) {
            errors.target_airline = 'Please select an airline';
        }
        if (broadcastFormData.target_type === 'destination' && !broadcastFormData.target_destination.trim()) {
            errors.target_destination = 'Please select a destination';
        }

        setBroadcastFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const resetBroadcastForm = () => {
        setShowBroadcastForm(false);
        setBroadcastFormData(EMPTY_BROADCAST_FORM);
        setBroadcastFormErrors({});
        setLastBroadcastRecipients(null);
    };

    const handleSendBroadcast = async () => {
        if (!validateBroadcastForm()) return;

        setSendingBroadcast(true);
        const payload = {
            title: broadcastFormData.title.trim(),
            message: broadcastFormData.message.trim(),
            target_type: broadcastFormData.target_type,
            target_airline: broadcastFormData.target_type === 'airline' ? broadcastFormData.target_airline.trim() : undefined,
            target_destination: broadcastFormData.target_type === 'destination' ? broadcastFormData.target_destination.trim() : undefined,
        };

        try {
            const res = await fetch('/api/broadcasts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error || `HTTP ${res.status}`);
            }

            const result = await res.json();
            setLastBroadcastRecipients(result.recipients);
            setSuccessMsg(`Broadcast sent to ${result.recipients} passenger(s)`);
            setBroadcastFormData(EMPTY_BROADCAST_FORM);
            setBroadcastFormErrors({});
            setShowBroadcastForm(false);
            await fetchBroadcasts();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to send broadcast';
            console.error('handleSendBroadcast error:', message);
            setError(message);
        } finally {
            setSendingBroadcast(false);
        }
    };

    const handleDeleteBroadcast = async (id: number) => {
        setDeletingBroadcast(true);
        try {
            const res = await fetch(`/api/broadcasts/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error || `HTTP ${res.status}`);
            }
            setSuccessMsg('Broadcast deleted successfully');
            setDeletingBroadcastId(null);
            await fetchBroadcasts();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Delete failed';
            console.error('handleDeleteBroadcast error:', message);
            setError(message);
            setDeletingBroadcastId(null);
        } finally {
            setDeletingBroadcast(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            <AdminSidebar activePage="broadcast" />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-6 lg:p-10">
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <Megaphone className="h-7 w-7 text-rose-600" />
                            Broadcast
                        </h1>
                        <p className="text-slate-500 mt-1">Send announcements to all or targeted passengers</p>
                    </div>
                </header>

                {/* Toast Messages */}
                {successMsg && (
                    <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 animate-fade-in">
                        <Check className="h-5 w-5 shrink-0" />
                        <span className="font-medium">{successMsg}</span>
                    </div>
                )}
                {error && (
                    <div className="mb-6 flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <span className="font-medium">{error}</span>
                        <button
                            onClick={() => setError(null)}
                            className="ml-auto text-rose-500 hover:text-rose-700"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* ───── Always On Message Section ───── */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Pin className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Always On Message</h2>
                                <p className="text-sm text-slate-500">
                                    A persistent message shown to all passengers
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Visibility Toggle */}
                            <button
                                onClick={() => setAlwaysOnVisible(!alwaysOnVisible)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${alwaysOnVisible
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                    }`}
                            >
                                {alwaysOnVisible ? (
                                    <><Eye className="h-4 w-4" /> Visible</>
                                ) : (
                                    <><EyeOff className="h-4 w-4" /> Hidden</>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-5">
                        {/* Title */}
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-slate-400" /> Title
                            </label>
                            <input
                                type="text"
                                value={alwaysOnTitle}
                                onChange={(e) => setAlwaysOnTitle(e.target.value)}
                                placeholder="e.g. Flight Update"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-shadow"
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                                <MessageSquare className="h-3.5 w-3.5 text-slate-400" /> Message
                            </label>
                            <textarea
                                rows={3}
                                value={alwaysOnMessage}
                                onChange={(e) => setAlwaysOnMessage(e.target.value)}
                                placeholder="Type your always-on message..."
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-shadow resize-none"
                            />
                        </div>

                        {/* Preview */}
                        {alwaysOnTitle.trim() && alwaysOnMessage.trim() && (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Preview</p>
                                <div className={`rounded-2xl p-4 flex items-start gap-3 shadow-sm ${alwaysOnVisible
                                    ? 'bg-amber-50 border border-amber-200'
                                    : 'bg-slate-100 border border-slate-200 opacity-60'
                                    }`}>
                                    <AlertTriangle className={`h-6 w-6 flex-shrink-0 mt-0.5 ${alwaysOnVisible ? 'text-amber-500' : 'text-slate-400'
                                        }`} />
                                    <div>
                                        <h3 className={`font-semibold ${alwaysOnVisible ? 'text-amber-900' : 'text-slate-600'
                                            }`}>{alwaysOnTitle}</h3>
                                        <p className={`text-sm mt-1 leading-relaxed ${alwaysOnVisible ? 'text-amber-800' : 'text-slate-500'
                                            }`}>{alwaysOnMessage}</p>
                                    </div>
                                    {!alwaysOnVisible && (
                                        <span className="ml-auto text-xs font-medium text-slate-400 bg-slate-200 px-2 py-1 rounded-full">Hidden</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSaveAlwaysOn}
                                disabled={savingAlwaysOn}
                                className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 shadow-sm disabled:opacity-60 transition-all active:scale-95"
                            >
                                {savingAlwaysOn ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                {savingAlwaysOn ? 'Saving...' : 'Save Message'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ───── Broadcast Messages Section ───── */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                <Megaphone className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Broadcast Messages</h2>
                                <p className="text-sm text-slate-500">
                                    Send announcements to all or targeted passengers
                                </p>
                            </div>
                        </div>

                        {!showBroadcastForm && canWrite && (
                            <button
                                onClick={() => {
                                    resetBroadcastForm();
                                    setShowBroadcastForm(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 shadow-sm transition-all active:scale-95"
                            >
                                <Send className="h-4 w-4" /> New Broadcast
                            </button>
                        )}
                    </div>

                    {/* Compose Broadcast Form */}
                    {showBroadcastForm && (
                        <div className="p-6 bg-slate-50 border-b border-slate-200">
                            <h3 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
                                <Send className="h-4 w-4 text-rose-500" /> Compose Broadcast
                            </h3>

                            <div className="grid grid-cols-1 gap-5">
                                {/* Title */}
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                                        <FileText className="h-3.5 w-3.5 text-slate-400" /> Title
                                    </label>
                                    <input
                                        type="text"
                                        value={broadcastFormData.title}
                                        onChange={(e) => setBroadcastFormData((prev) => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g. Gate Change Announcement"
                                        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40 transition-shadow ${broadcastFormErrors.title
                                            ? 'border-rose-300 bg-rose-50'
                                            : 'border-slate-200 bg-white'
                                            }`}
                                    />
                                    {broadcastFormErrors.title && (
                                        <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" /> {broadcastFormErrors.title}
                                        </p>
                                    )}
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                                        <MessageSquare className="h-3.5 w-3.5 text-slate-400" /> Message
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={broadcastFormData.message}
                                        onChange={(e) => setBroadcastFormData((prev) => ({ ...prev, message: e.target.value }))}
                                        placeholder="Type your broadcast message..."
                                        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40 transition-shadow resize-none ${broadcastFormErrors.message
                                            ? 'border-rose-300 bg-rose-50'
                                            : 'border-slate-200 bg-white'
                                            }`}
                                    />
                                    {broadcastFormErrors.message && (
                                        <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" /> {broadcastFormErrors.message}
                                        </p>
                                    )}
                                </div>

                                {/* Target Type */}
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                                        <Filter className="h-3.5 w-3.5 text-slate-400" /> Target Audience
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setBroadcastFormData(prev => ({ ...prev, target_type: 'all', target_airline: '', target_destination: '' }))}
                                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-all ${broadcastFormData.target_type === 'all'
                                                ? 'border-rose-300 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20'
                                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            <Globe className="h-4 w-4" /> All Passengers
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBroadcastFormData(prev => ({ ...prev, target_type: 'airline', target_destination: '' }))}
                                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-all ${broadcastFormData.target_type === 'airline'
                                                ? 'border-indigo-300 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20'
                                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            <Plane className="h-4 w-4" /> By Airline
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBroadcastFormData(prev => ({ ...prev, target_type: 'destination', target_airline: '' }))}
                                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border transition-all ${broadcastFormData.target_type === 'destination'
                                                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20'
                                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            <MapPin className="h-4 w-4" /> By Destination
                                        </button>
                                    </div>
                                </div>

                                {/* Airline Selector */}
                                {broadcastFormData.target_type === 'airline' && (
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                                            <Plane className="h-3.5 w-3.5 text-slate-400" /> Select Airline
                                        </label>
                                        {filterAirlines.length > 0 ? (
                                            <select
                                                value={broadcastFormData.target_airline}
                                                onChange={(e) => setBroadcastFormData(prev => ({ ...prev, target_airline: e.target.value }))}
                                                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-shadow ${broadcastFormErrors.target_airline
                                                    ? 'border-rose-300 bg-rose-50'
                                                    : 'border-slate-200 bg-white'
                                                    }`}
                                            >
                                                <option value="">— Select airline —</option>
                                                {filterAirlines.map((airline) => (
                                                    <option key={airline} value={airline}>{airline}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={broadcastFormData.target_airline}
                                                    onChange={(e) => setBroadcastFormData(prev => ({ ...prev, target_airline: e.target.value }))}
                                                    placeholder="Type airline name"
                                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-shadow ${broadcastFormErrors.target_airline
                                                        ? 'border-rose-300 bg-rose-50'
                                                        : 'border-slate-200 bg-white'
                                                        }`}
                                                />
                                            </div>
                                        )}
                                        {broadcastFormErrors.target_airline && (
                                            <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                                                <AlertTriangle className="h-3 w-3" /> {broadcastFormErrors.target_airline}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Destination Selector */}
                                {broadcastFormData.target_type === 'destination' && (
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 text-slate-400" /> Select Destination
                                        </label>
                                        {filterDestinations.length > 0 ? (
                                            <select
                                                value={broadcastFormData.target_destination}
                                                onChange={(e) => setBroadcastFormData(prev => ({ ...prev, target_destination: e.target.value }))}
                                                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-shadow ${broadcastFormErrors.target_destination
                                                    ? 'border-rose-300 bg-rose-50'
                                                    : 'border-slate-200 bg-white'
                                                    }`}
                                            >
                                                <option value="">— Select destination —</option>
                                                {filterDestinations.map((dest) => (
                                                    <option key={dest} value={dest}>{dest}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={broadcastFormData.target_destination}
                                                onChange={(e) => setBroadcastFormData(prev => ({ ...prev, target_destination: e.target.value }))}
                                                placeholder="Type destination name"
                                                className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-shadow ${broadcastFormErrors.target_destination
                                                    ? 'border-rose-300 bg-rose-50'
                                                    : 'border-slate-200 bg-white'
                                                    }`}
                                            />
                                        )}
                                        {broadcastFormErrors.target_destination && (
                                            <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                                                <AlertTriangle className="h-3 w-3" /> {broadcastFormErrors.target_destination}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 mt-6">
                                <button
                                    onClick={handleSendBroadcast}
                                    disabled={sendingBroadcast}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 shadow-sm disabled:opacity-60 transition-all active:scale-95"
                                >
                                    {sendingBroadcast ? (
                                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                    {sendingBroadcast ? 'Sending...' : 'Send Broadcast'}
                                </button>
                                <button
                                    onClick={resetBroadcastForm}
                                    className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Broadcasts List */}
                    {broadcastsLoading ? (
                        <div className="p-10 text-center">
                            <div className="animate-spin h-8 w-8 border-2 border-rose-300 border-t-transparent rounded-full mx-auto mb-3" />
                            <p className="text-sm text-slate-500">Loading broadcasts...</p>
                        </div>
                    ) : broadcasts.length === 0 ? (
                        <div className="p-10 text-center">
                            <Radio className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                            <p className="text-slate-500 font-medium">No broadcasts sent yet</p>
                            <p className="text-sm text-slate-400 mt-1">Send your first broadcast to notify passengers.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {broadcasts.map((b) => (
                                <div key={b.id} className="p-5 flex items-start gap-4 group hover:bg-slate-50 transition-colors">
                                    <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Megaphone className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-semibold text-slate-900 text-sm">{b.title}</h4>
                                            {b.target_type === 'all' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-xs font-medium">
                                                    <Globe className="h-3 w-3" /> All Passengers
                                                </span>
                                            )}
                                            {b.target_type === 'airline' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium">
                                                    <Plane className="h-3 w-3" /> {b.target_airline}
                                                </span>
                                            )}
                                            {b.target_type === 'destination' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">
                                                    <MapPin className="h-3 w-3" /> {b.target_destination}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">{b.message}</p>
                                        <p className="text-xs text-slate-400 mt-2">
                                            Sent {new Date(b.sent_at).toLocaleString('en-US', {
                                                month: 'short', day: 'numeric', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        {canDelete && (
                                            deletingBroadcastId === b.id ? (
                                                <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                                                    <span className="text-xs font-medium text-rose-700">Delete?</span>
                                                    <button
                                                        onClick={() => handleDeleteBroadcast(b.id)}
                                                        disabled={deletingBroadcast}
                                                        className="p-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50"
                                                    >
                                                        <Check className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingBroadcastId(null)}
                                                        disabled={deletingBroadcast}
                                                        className="p-1 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setDeletingBroadcastId(b.id)}
                                                    className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

import { useState, useEffect, useCallback } from 'react';
import {
    Search, Filter, ChevronLeft, ChevronRight, ArrowUpDown,
    Plane, Globe, MapPin, UserCheck, UserX,
    Tag, Eye, X, Calendar, TrendingUp, BarChart3, Users, Activity, Download, Edit, Save
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import AdminSidebar from '../components/AdminSidebar';
import { useAuth } from '../auth/AuthContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Types ───
interface Passenger {
    id: number;
    event_id: number;
    name: string;
    flight_number: string | null;
    country: string | null;
    passport_number: string | null;
    nationality: string | null;
    departure_airline: string | null;
    departure_date: string | null;
    final_destination: string | null;
    location_id: number | null;
    qr_token: string;
    status: string;
    qr_generated_at: string;
    event_name: string | null;
    location_name: string | null;
    message_count: number;
    tags?: string | null;
    exclude_from_reports?: boolean;
}

interface Pagination {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}

interface StatsData {
    total: number;
    registered: number;
    checkedIn: number;
    checkedOut: number;
    totalMessages: number;
    byAirline: { label: string; value: number }[];
    byNationality: { label: string; value: number }[];
    byDestination: { label: string; value: number }[];
    byStatus: { label: string; value: number; color: string }[];
    registrationTimeline: { date: string; count: number }[];
    filterOptions: {
        airlines: string[];
        nationalities: string[];
        destinations: string[];
        tags: string[];
    };
}

interface Filters {
    search: string;
    status: string;
    airline: string;
    nationality: string;
    destination: string;
    tags: string[];
    dateFrom: string;
    dateTo: string;
    excludeStatus: string;
}

// ─── Palette ───
const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    'registered': { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500', label: 'Registered' },
    'checked-in': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Checked In' },
    'checked-out': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Checked Out' },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] || { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-500', label: status };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

// ─── Detail Drawer ───
function PassengerDrawer({ passenger, onClose, onUpdate, canWrite }: { passenger: Passenger; onClose: () => void; onUpdate?: () => void; canWrite?: boolean }) {
    const [locations, setLocations] = useState<{ id: number; name: string; capacity: number; facilities: string }[]>([]);
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(passenger.location_id);
    const [locationSaving, setLocationSaving] = useState(false);
    const [locationSuccess, setLocationSuccess] = useState('');
    const [locationError, setLocationError] = useState('');
    const [tags, setTags] = useState(passenger.tags || '');
    const [tagsSaving, setTagsSaving] = useState(false);
    const [excludeFromReports, setExcludeFromReports] = useState(!!passenger.exclude_from_reports);
    const [excludeSaving, setExcludeSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [detailsSaving, setDetailsSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        name: passenger.name || '',
        country: passenger.country || '',
        passport_number: passenger.passport_number || '',
        nationality: passenger.nationality || '',
        departure_airline: passenger.departure_airline || '',
        departure_date: passenger.departure_date || '',
        final_destination: passenger.final_destination || '',
        flight_number: passenger.flight_number || '',
    });

    const handleSaveDetails = async () => {
        if (!canWrite) return;
        setDetailsSaving(true);
        try {
            const res = await fetch(`/api/admin/passengers/${passenger.id}/details`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });
            if (!res.ok) throw new Error('Failed to update passenger details');
            setIsEditing(false);
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error('Failed to update details:', err);
        } finally {
            setDetailsSaving(false);
        }
    };

    useEffect(() => {
        fetch('/api/locations')
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then((data) => setLocations(data))
            .catch((err) => console.error('Failed to fetch locations:', err instanceof Error ? err.message : err));
    }, []);

    const handleLocationUpdate = async (newLocationId: number | null) => {
        setLocationSaving(true);
        setLocationError('');
        setLocationSuccess('');
        try {
            const res = await fetch(`/api/admin/passengers/${passenger.id}/location`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location_id: newLocationId }),
            });
            const text = await res.text();
            let data: any = {};
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                // Response wasn't valid JSON
            }
            if (!res.ok) {
                throw new Error(data.error || `HTTP ${res.status}`);
            }
            setSelectedLocationId(newLocationId);
            setLocationSuccess(`Location updated to ${data.location_name || 'selected zone'}`);
            setTimeout(() => setLocationSuccess(''), 3000);
            if (onUpdate) onUpdate();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to update location';
            setLocationError(msg);
            console.error('Failed to update location:', msg);
        } finally {
            setLocationSaving(false);
        }
    };

    const currentLocationName = selectedLocationId
        ? locations.find((l) => l.id === selectedLocationId)?.name || passenger.location_name || 'Unknown'
        : null;

    const handleTagsUpdate = async () => {
        if (!canWrite) return;
        setTagsSaving(true);
        try {
            const res = await fetch(`/api/admin/passengers/${passenger.id}/tags`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tags }),
            });
            if (!res.ok) throw new Error('Failed to update tags');
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error('Failed to update tags:', err);
        } finally {
            setTagsSaving(false);
        }
    };

    const handleExcludeUpdate = async () => {
        if (!canWrite) return;
        setExcludeSaving(true);
        const newValue = !excludeFromReports;
        try {
            const res = await fetch(`/api/admin/passengers/${passenger.id}/exclude`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exclude_from_reports: newValue }),
            });
            if (!res.ok) throw new Error('Failed to update exclude status');
            setExcludeFromReports(newValue);
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error('Failed to update passenger exclude status:', err);
        } finally {
            setExcludeSaving(false);
        }
    };

    const fields = [
        { label: 'Full Name', value: passenger.name, icon: Users },
        { label: 'Country', value: passenger.country, icon: Globe },
        { label: 'Passport Number', value: passenger.passport_number, icon: Eye },
        { label: 'Nationality', value: passenger.nationality, icon: Globe },
        { label: 'Departure Airline', value: passenger.departure_airline, icon: Plane },
        { label: 'Departure Date', value: passenger.departure_date, icon: Calendar },
        { label: 'Final Destination', value: passenger.final_destination, icon: MapPin },
        { label: 'Flight Number', value: passenger.flight_number, icon: Plane },
        { label: 'Event', value: passenger.event_name, icon: Activity },
        { label: 'QR Token', value: passenger.qr_token, icon: Tag },
        { label: 'Registered At', value: passenger.qr_generated_at ? new Date(passenger.qr_generated_at).toLocaleString() : '—', icon: Calendar },
    ];

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-slide-in-right">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">{passenger.name}</h2>
                        <div className="flex items-center gap-3 mt-1">
                            <StatusBadge status={passenger.status} />
                            <span className="text-xs text-slate-400">ID #{passenger.id}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {canWrite && !isEditing && (
                            <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <Edit className="h-5 w-5 text-indigo-500" />
                            </button>
                        )}
                        {canWrite && isEditing && (
                            <button onClick={handleSaveDetails} disabled={detailsSaving} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                {detailsSaving ? <span className="animate-spin h-5 w-5 border border-indigo-500 border-t-transparent rounded-full inline-block" /> : <Save className="h-5 w-5 text-indigo-600" />}
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                            <X className="h-5 w-5 text-slate-500" />
                        </button>
                    </div>
                </div>

                <div className="p-6 border-b border-slate-100">
                    <div className="bg-violet-50 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-violet-700">{passenger.message_count}</p>
                        <p className="text-xs text-violet-600 font-medium mt-1">Messages</p>
                    </div>
                </div>

                {/* Detail Fields */}
                <div className="p-6 space-y-4">
                    {fields.map((f) => {
                        const Icon = f.icon;
                        const fieldMap: Record<string, keyof typeof editForm> = {
                            'Full Name': 'name',
                            'Country': 'country',
                            'Passport Number': 'passport_number',
                            'Nationality': 'nationality',
                            'Departure Airline': 'departure_airline',
                            'Departure Date': 'departure_date',
                            'Final Destination': 'final_destination',
                            'Flight Number': 'flight_number'
                        };
                        const fieldKey = fieldMap[f.label];

                        return (
                            <div key={f.label} className="flex items-start gap-3">
                                <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Icon className="h-4 w-4 text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{f.label}</p>
                                    {isEditing && fieldKey ? (
                                        <input
                                            type={f.label === 'Departure Date' ? 'date' : 'text'}
                                            value={editForm[fieldKey] || ''}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                                            className="w-full mt-1.5 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white"
                                        />
                                    ) : (
                                        <p className="text-sm font-medium text-slate-800 mt-0.5 truncate">{f.value || '—'}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Location — Editable */}
                    <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <MapPin className="h-4 w-4 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Location</p>
                            <div className="mt-1.5">
                                <select
                                    value={selectedLocationId ?? ''}
                                    onChange={(e) => {
                                        const val = e.target.value ? parseInt(e.target.value, 10) : null;
                                        setSelectedLocationId(val);
                                        handleLocationUpdate(val);
                                    }}
                                    disabled={locationSaving || !canWrite}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <option value="">— Unassigned —</option>
                                    {locations.map((loc) => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.name}
                                        </option>
                                    ))}
                                </select>
                                {locationSaving && (
                                    <p className="text-xs text-indigo-500 font-medium mt-1 flex items-center gap-1">
                                        <span className="animate-spin h-3 w-3 border border-indigo-400 border-t-transparent rounded-full inline-block" />
                                        Saving...
                                    </p>
                                )}
                                {locationSuccess && (
                                    <p className="text-xs text-emerald-600 font-medium mt-1">✓ {locationSuccess}</p>
                                )}
                                {locationError && (
                                    <p className="text-xs text-rose-600 font-medium mt-1">✗ {locationError}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tags — Editable */}
                    <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Tag className="h-4 w-4 text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Custom Tags</p>
                            <div className="mt-1.5 flex gap-2">
                                <input
                                    type="text"
                                    placeholder="e.g. VIP, Requires Wheelchair"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    disabled={tagsSaving || !canWrite}
                                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white transition-all disabled:opacity-60"
                                />
                                {canWrite && (
                                    <button
                                        onClick={handleTagsUpdate}
                                        disabled={tagsSaving}
                                        className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 disabled:opacity-60 transition-colors flex-shrink-0"
                                    >
                                        {tagsSaving ? 'Saving...' : 'Save'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Exclude from reports — Toggle */}
                    <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <UserX className="h-4 w-4 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Exclude From Reports</p>
                            <div className="mt-2 flex items-center gap-3">
                                <button
                                    onClick={handleExcludeUpdate}
                                    disabled={excludeSaving || !canWrite}
                                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${excludeFromReports ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                    role="switch"
                                    aria-checked={excludeFromReports}
                                >
                                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${excludeFromReports ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                                <span className="text-sm text-slate-600">
                                    {excludeFromReports ? 'Excluded' : 'Included'}
                                    {excludeSaving && <span className="ml-2 text-xs text-indigo-500">Saving...</span>}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}

// ─── Custom Tooltip ───
function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
            <p className="font-semibold">{label}</p>
            <p className="text-slate-300 mt-0.5">{payload[0].value} passenger{payload[0].value !== 1 ? 's' : ''}</p>
        </div>
    );
}

// ────────────────────────────
export default function AdminPassengers() {
    const { canWrite } = useAuth();
    const [stats, setStats] = useState<StatsData | null>(null);
    const [passengers, setPassengers] = useState<Passenger[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, per_page: 25, total_pages: 0 });
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<Filters>({ search: '', status: 'all', airline: 'all', nationality: 'all', destination: 'all', tags: [], dateFrom: '', dateTo: '', excludeStatus: 'hidden' });
    const [sortBy, setSortBy] = useState('id');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [activeChart, setActiveChart] = useState<'airline' | 'nationality' | 'destination'>('airline');

    // Debounced search
    const [searchDebounce, setSearchDebounce] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => setSearchDebounce(filters.search), 300);
        return () => clearTimeout(timer);
    }, [filters.search]);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filters.dateFrom) params.set('date_from', filters.dateFrom);
            if (filters.dateTo) params.set('date_to', filters.dateTo);
            const qs = params.toString();
            const res = await fetch(`/api/admin/passengers/stats${qs ? '?' + qs : ''}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch stats:', err instanceof Error ? err.message : err);
        }
    }, [filters.dateFrom, filters.dateTo]);

    // Fetch passengers
    const fetchPassengers = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                per_page: '25',
                sort_by: sortBy,
                sort_order: sortOrder,
            });
            if (searchDebounce) params.set('search', searchDebounce);
            if (filters.status !== 'all') params.set('status', filters.status);
            if (filters.airline !== 'all') params.set('airline', filters.airline);
            if (filters.nationality !== 'all') params.set('nationality', filters.nationality);
            if (filters.destination !== 'all') params.set('destination', filters.destination);
            if (filters.tags.length > 0) params.set('tags', filters.tags.join(','));
            if (filters.dateFrom) params.set('date_from', filters.dateFrom);
            if (filters.dateTo) params.set('date_to', filters.dateTo);
            params.set('exclude_filter', filters.excludeStatus);

            const res = await fetch(`/api/admin/passengers?${params}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setPassengers(data.passengers);
            setPagination(data.pagination);
        } catch (err) {
            console.error('Failed to fetch passengers:', err instanceof Error ? err.message : err);
        } finally {
            setLoading(false);
        }
    }, [searchDebounce, filters, sortBy, sortOrder]);

    useEffect(() => { fetchStats(); }, [fetchStats]);
    useEffect(() => { fetchPassengers(1); }, [fetchPassengers]);

    const handleExport = async (format: 'xls' | 'pdf') => {
        try {
            const params = new URLSearchParams({
                page: '1',
                per_page: '10000',
                sort_by: sortBy,
                sort_order: sortOrder,
            });
            if (searchDebounce) params.set('search', searchDebounce);
            if (filters.status !== 'all') params.set('status', filters.status);
            if (filters.airline !== 'all') params.set('airline', filters.airline);
            if (filters.nationality !== 'all') params.set('nationality', filters.nationality);
            if (filters.destination !== 'all') params.set('destination', filters.destination);
            if (filters.tags.length > 0) params.set('tags', filters.tags.join(','));
            if (filters.dateFrom) params.set('date_from', filters.dateFrom);
            if (filters.dateTo) params.set('date_to', filters.dateTo);
            params.set('exclude_filter', filters.excludeStatus);

            const res = await fetch(`/api/admin/passengers?${params}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            const exportData = data.passengers.map((p: Passenger) => ({
                'Name': p.name,
                'Country': p.country || '',
                'Passport Number': p.passport_number || '',
                'Nationality': p.nationality || '',
                'Airline': p.departure_airline || '',
                'Destination': p.final_destination || '',
                'Flight Number': p.flight_number || '',
                'Status': p.status || '',
                'Tags': p.tags || '',
                'Registered At': p.qr_generated_at ? new Date(p.qr_generated_at).toLocaleString() : ''
            }));

            if (format === 'xls') {
                const worksheet = XLSX.utils.json_to_sheet(exportData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Passengers');
                XLSX.writeFile(workbook, 'AeroCare_Passengers.xlsx');
            } else if (format === 'pdf') {
                const doc = new jsPDF('landscape');
                doc.text('AeroCare Passengers Report', 14, 15);

                autoTable(doc, {
                    head: [['Name', 'Country', 'Passport', 'Nationality', 'Airline', 'Destination', 'Flight No.', 'Status', 'Tags', 'Registered At']],
                    body: exportData.map((row: any) => Object.values(row)),
                    startY: 20
                });

                doc.save('AeroCare_Passengers.pdf');
            }
        } catch (err) {
            console.error('Export failed:', err);
            alert('Failed to export data.');
        }
    };

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const resetFilters = () => {
        setFilters({ search: '', status: 'all', airline: 'all', nationality: 'all', destination: 'all', tags: [], dateFrom: '', dateTo: '', excludeStatus: 'hidden' });
    };

    const activeFilterCount = [filters.status, filters.airline, filters.nationality, filters.destination]
        .filter((v) => v !== 'all').length + (filters.search ? 1 : 0) + filters.tags.length + (filters.dateFrom ? 1 : 0) + (filters.dateTo ? 1 : 0) + (filters.excludeStatus !== 'hidden' ? 1 : 0);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* ─── Sidebar ─── */}
            <AdminSidebar activePage="passengers" />

            {/* ─── Main Content ─── */}
            <main className="flex-1 overflow-y-auto p-6 lg:p-10">
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <Users className="h-7 w-7 text-indigo-600" /> Passengers
                        </h1>
                        <p className="text-slate-500 mt-1">
                            {stats ? `${stats.total} total passengers registered` : 'Loading statistics...'}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleExport('xls')}
                            className="bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm shadow-sm"
                        >
                            <Download className="h-4 w-4" />
                            Export XLS
                        </button>
                        <button
                            onClick={() => handleExport('pdf')}
                            className="bg-indigo-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm shadow-sm"
                        >
                            <Download className="h-4 w-4" />
                            Export PDF
                        </button>
                    </div>
                </header>

                {/* ─── Date Range Filter ─── */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-8 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-semibold">Date Range</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">From</label>
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
                                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white text-slate-700"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">To</label>
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
                                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white text-slate-700"
                            />
                        </div>
                        {(filters.dateFrom || filters.dateTo) && (
                            <button
                                onClick={() => setFilters((p) => ({ ...p, dateFrom: '', dateTo: '' }))}
                                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                                <X className="h-3 w-3" />
                                Clear dates
                            </button>
                        )}
                    </div>
                </div>

                {/* ─── Stats Dashboard ─── */}
                {stats && (
                    <>
                        {/* Counter Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</h3>
                                    <div className="h-9 w-9 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
                                        <Users className="h-4.5 w-4.5" />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                                <p className="text-xs text-slate-400 mt-1 font-medium">All passengers</p>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered</h3>
                                    <div className="h-9 w-9 bg-violet-50 text-violet-500 rounded-xl flex items-center justify-center">
                                        <TrendingUp className="h-4.5 w-4.5" />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-slate-900">{stats.registered}</p>
                                <p className="text-xs text-slate-400 mt-1 font-medium">Awaiting check-in</p>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Checked In</h3>
                                    <div className="h-9 w-9 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                                        <UserCheck className="h-4.5 w-4.5" />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-slate-900">{stats.checkedIn}</p>
                                <p className="text-xs text-slate-400 mt-1 font-medium">In rest zones</p>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Checked Out</h3>
                                    <div className="h-9 w-9 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                                        <UserX className="h-4.5 w-4.5" />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-slate-900">{stats.checkedOut}</p>
                                <p className="text-xs text-slate-400 mt-1 font-medium">Departed</p>
                            </div>
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            {/* Registration Timeline */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-indigo-500" /> Registration Trend
                                </h3>
                                {stats.registrationTimeline.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={180}>
                                        <AreaChart data={stats.registrationTimeline}>
                                            <defs>
                                                <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="date"
                                                tick={{ fontSize: 11, fill: '#94a3b8' }}
                                                tickFormatter={(v) => {
                                                    const d = new Date(v + 'T00:00:00');
                                                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                                }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis hide allowDecimals={false} />
                                            <Tooltip content={<ChartTooltip />} />
                                            <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#gradientArea)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[180px] flex items-center justify-center text-slate-300 text-sm">No data yet</div>
                                )}
                            </div>

                            {/* Status Pie */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-emerald-500" /> Status Breakdown
                                </h3>
                                {stats.total > 0 ? (
                                    <div className="flex items-center gap-6">
                                        <ResponsiveContainer width={140} height={140}>
                                            <PieChart>
                                                <Pie
                                                    data={stats.byStatus}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={40}
                                                    outerRadius={65}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                >
                                                    {stats.byStatus.map((entry, i) => (
                                                        <Cell key={i} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="space-y-2 flex-1">
                                            {stats.byStatus.map((s) => (
                                                <div key={s.label} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                                                        <span className="text-slate-600 font-medium">{s.label}</span>
                                                    </div>
                                                    <span className="font-bold text-slate-800">{s.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-[140px] flex items-center justify-center text-slate-300 text-sm">No data yet</div>
                                )}
                            </div>

                            {/* Top Breakdown Chart (switchable) */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-violet-500" /> Top Breakdown
                                    </h3>
                                    <div className="flex bg-slate-100 rounded-lg p-0.5">
                                        {(['airline', 'nationality', 'destination'] as const).map((key) => (
                                            <button
                                                key={key}
                                                onClick={() => setActiveChart(key)}
                                                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${activeChart === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                {key === 'airline' ? 'Airline' : key === 'nationality' ? 'Nationality' : 'Destination'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {(() => {
                                    const data = activeChart === 'airline' ? stats.byAirline :
                                        activeChart === 'nationality' ? stats.byNationality : stats.byDestination;
                                    if (!data.length) return <div className="h-[180px] flex items-center justify-center text-slate-300 text-sm">No data yet</div>;
                                    return (
                                        <ResponsiveContainer width="100%" height={180}>
                                            <BarChart data={data.slice(0, 6)} layout="vertical" margin={{ left: 0 }}>
                                                <XAxis type="number" hide />
                                                <YAxis
                                                    type="category"
                                                    dataKey="label"
                                                    width={100}
                                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 14) + '…' : v}
                                                />
                                                <Tooltip content={<ChartTooltip />} />
                                                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
                                                    {data.slice(0, 6).map((_, i) => (
                                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    );
                                })()}
                            </div>
                        </div>
                    </>
                )}

                {/* ─── Passenger Table ─── */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-5 border-b border-slate-100 space-y-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Search */}
                            <div className="flex-1 min-w-[260px] relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, passport, flight number..."
                                    value={filters.search}
                                    onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-shadow bg-slate-50/50"
                                />
                            </div>

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${showFilters || activeFilterCount
                                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <Filter className="h-4 w-4" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <span className="h-5 w-5 bg-indigo-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>

                            {activeFilterCount > 0 && (
                                <button
                                    onClick={resetFilters}
                                    className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
                                >
                                    <X className="h-3 w-3" /> Clear all
                                </button>
                            )}

                            <span className="text-sm text-slate-400 ml-auto">
                                {pagination.total} result{pagination.total !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* Filter Row */}
                        {showFilters && stats && (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
                                <div>
                                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Status</label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="registered">Registered</option>
                                        <option value="checked-in">Checked In</option>
                                        <option value="checked-out">Checked Out</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Airline</label>
                                    <select
                                        value={filters.airline}
                                        onChange={(e) => setFilters((p) => ({ ...p, airline: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white"
                                    >
                                        <option value="all">All Airlines</option>
                                        {stats.filterOptions.airlines.map((a) => (
                                            <option key={a} value={a}>{a}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Nationality</label>
                                    <select
                                        value={filters.nationality}
                                        onChange={(e) => setFilters((p) => ({ ...p, nationality: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white"
                                    >
                                        <option value="all">All Nationalities</option>
                                        {stats.filterOptions.nationalities.map((n) => (
                                            <option key={n} value={n}>{n}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Destination</label>
                                    <select
                                        value={filters.destination}
                                        onChange={(e) => setFilters((p) => ({ ...p, destination: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white"
                                    >
                                        <option value="all">All Destinations</option>
                                        {stats.filterOptions.destinations.map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Tags</label>
                                    <select
                                        value=""
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val && !filters.tags.includes(val)) {
                                                setFilters(p => ({ ...p, tags: [...p.tags, val] }));
                                            }
                                        }}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white"
                                    >
                                        <option value="">Select tags...</option>
                                        {stats.filterOptions.tags?.filter(t => !filters.tags.includes(t)).map((t) => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                    {filters.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {filters.tags.map(t => (
                                                <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-semibold">
                                                    {t}
                                                    <button onClick={() => setFilters(p => ({ ...p, tags: p.tags.filter(tag => tag !== t) }))} className="hover:text-indigo-900 transition-colors">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Report Exclusions</label>
                                    <select
                                        value={filters.excludeStatus}
                                        onChange={(e) => setFilters((p) => ({ ...p, excludeStatus: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white"
                                    >
                                        <option value="hidden">Hide Excluded</option>
                                        <option value="all">Show All</option>
                                        <option value="excluded">Only Excluded</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    {[
                                        { key: 'name', label: 'Passenger' },
                                        { key: 'nationality', label: 'Nationality' },
                                        { key: 'departure_airline', label: 'Airline' },
                                        { key: 'final_destination', label: 'Destination' },
                                        { key: 'departure_date', label: 'Dep. Date' },
                                        { key: 'status', label: 'Status' },
                                    ].map((col) => (
                                        <th
                                            key={col.key}
                                            onClick={() => handleSort(col.key)}
                                            className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-600 transition-colors select-none whitespace-nowrap"
                                        >
                                            <span className="flex items-center gap-1.5">
                                                {col.label}
                                                <ArrowUpDown className={`h-3 w-3 ${sortBy === col.key ? 'text-indigo-500' : 'text-slate-300'}`} />
                                            </span>
                                        </th>
                                    ))}
                                    <th className="w-12" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-16 text-center">
                                            <div className="animate-spin h-8 w-8 border-2 border-indigo-300 border-t-transparent rounded-full mx-auto mb-3" />
                                            <p className="text-sm text-slate-400">Loading passengers...</p>
                                        </td>
                                    </tr>
                                ) : passengers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-16 text-center">
                                            <Users className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                                            <p className="text-slate-500 font-medium">No passengers found</p>
                                            <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    passengers.map((p) => (
                                        <tr
                                            key={p.id}
                                            onClick={() => setSelectedPassenger(p)}
                                            className="group hover:bg-indigo-50/30 cursor-pointer transition-colors"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                                        {p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{p.name}</p>
                                                        <p className="text-xs text-slate-400">
                                                            {p.country || '—'} • {p.passport_number || 'No passport'}
                                                            {p.tags && p.tags.trim() !== '' && (
                                                                <>
                                                                    <span className="mx-1.5 text-slate-300">•</span>
                                                                    <span className="text-orange-500 font-semibold">{p.tags}</span>
                                                                </>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-slate-700">{p.nationality || '—'}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                {p.departure_airline ? (
                                                    <span className="inline-flex items-center gap-1.5 text-slate-700">
                                                        <Plane className="h-3.5 w-3.5 text-slate-400" />
                                                        {p.departure_airline}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                {p.final_destination ? (
                                                    <span className="inline-flex items-center gap-1.5 text-slate-700">
                                                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                                        {p.final_destination}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-slate-600">
                                                {p.departure_date || '—'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge status={p.status} />
                                            </td>
                                            <td className="px-5 py-4">
                                                <button className="p-1.5 text-slate-300 group-hover:text-indigo-500 rounded-lg hover:bg-indigo-50 transition-all">
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.total_pages > 1 && (
                        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
                            <p className="text-sm text-slate-500">
                                Showing <span className="font-semibold text-slate-700">{(pagination.page - 1) * pagination.per_page + 1}</span>
                                {' '}to{' '}
                                <span className="font-semibold text-slate-700">{Math.min(pagination.page * pagination.per_page, pagination.total)}</span>
                                {' '}of{' '}
                                <span className="font-semibold text-slate-700">{pagination.total}</span>
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={pagination.page <= 1}
                                    onClick={() => fetchPassengers(pagination.page - 1)}
                                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                                    let page: number;
                                    if (pagination.total_pages <= 5) {
                                        page = i + 1;
                                    } else if (pagination.page <= 3) {
                                        page = i + 1;
                                    } else if (pagination.page >= pagination.total_pages - 2) {
                                        page = pagination.total_pages - 4 + i;
                                    } else {
                                        page = pagination.page - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => fetchPassengers(page)}
                                            className={`h-9 w-9 rounded-lg text-sm font-medium transition-all ${pagination.page === page
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}

                                <button
                                    disabled={pagination.page >= pagination.total_pages}
                                    onClick={() => fetchPassengers(pagination.page + 1)}
                                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* ─── Detail Drawer ─── */}
            {selectedPassenger && (
                <PassengerDrawer passenger={selectedPassenger} onClose={() => setSelectedPassenger(null)} onUpdate={() => fetchPassengers(pagination.page)} canWrite={canWrite} />
            )}

            {/* CSS for drawer animation */}
            <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0.8; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.25s ease-out;
        }
      `}</style>
        </div>
    );
}

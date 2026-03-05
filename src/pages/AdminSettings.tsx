import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import UserManagement from '../components/UserManagement';
import {
    Plus,
    Pencil,
    Trash2,
    Check,
    X,
    AlertTriangle,
    Zap,
    Phone,
    ToggleLeft,
    ToggleRight,
    Calendar,
    FileText,
    Clock,
    Image,
    Tag,
    Radio,
    Send,
    Megaphone,
    Filter,
    Globe,
    Plane,
    Search,
    QrCode,
    Timer,
    Save,
    Database,
    RefreshCw,
    AlertCircle,
    Loader2,
    Printer,
    MapPin,
    Settings,
    Building2,
    Layers,
    Users,
    List,
    Eye,
    EyeOff,
} from 'lucide-react';
import QRCodeSVG from 'react-qr-code';

interface Location {
    id: number;
    name: string;
    capacity: number;
    facilities: string;
}

interface LocationFormData {
    name: string;
    capacity: string;
    facilities: string;
}



interface EventItem {
    id: number;
    name: string;
    description: string;
    date: string;
    status: string;
}

interface EventFormData {
    name: string;
    description: string;
}







interface DropdownOption {
    id: number;
    category: string;
    label: string;
    sort_order: number;
    active: number;
}

interface DropdownFormData {
    label: string;
}

const EMPTY_FORM: LocationFormData = { name: '', capacity: '', facilities: '' }; const EMPTY_EVENT_FORM: EventFormData = { name: '', description: '' };
const EMPTY_DROPDOWN_FORM: DropdownFormData = { label: '' };


export default function AdminSettings() {
    const navigate = useNavigate();
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Location form state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<LocationFormData>(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState<Partial<LocationFormData>>({});
    const [saving, setSaving] = useState(false);

    // Delete confirmation
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);


    // ───── Events State ─────
    const [events, setEvents] = useState<EventItem[]>([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [showEventForm, setShowEventForm] = useState(false);
    const [editingEventId, setEditingEventId] = useState<number | null>(null);
    const [eventFormData, setEventFormData] = useState<EventFormData>(EMPTY_EVENT_FORM);
    const [eventFormErrors, setEventFormErrors] = useState<Partial<Record<keyof EventFormData, string>>>({});
    const [savingEvent, setSavingEvent] = useState(false);
    const [deletingEventId, setDeletingEventId] = useState<number | null>(null);
    const [deletingEvent, setDeletingEvent] = useState(false);





    // ───── Dropdown Options State ─────
    const [dropdownOptions, setDropdownOptions] = useState<DropdownOption[]>([]);
    const [dropdownLoading, setDropdownLoading] = useState(true);
    const [dropdownCategory, setDropdownCategory] = useState<'nationality' | 'airline' | 'destination'>('nationality');
    const [showDropdownForm, setShowDropdownForm] = useState(false);
    const [editingDropdownId, setEditingDropdownId] = useState<number | null>(null);
    const [dropdownFormData, setDropdownFormData] = useState<DropdownFormData>(EMPTY_DROPDOWN_FORM);
    const [dropdownFormErrors, setDropdownFormErrors] = useState<Partial<Record<keyof DropdownFormData, string>>>({});
    const [savingDropdown, setSavingDropdown] = useState(false);
    const [deletingDropdownId, setDeletingDropdownId] = useState<number | null>(null);
    const [deletingDropdown, setDeletingDropdown] = useState(false);
    const [dropdownSearch, setDropdownSearch] = useState('');

    // ───── App Settings State ─────
    const [qrExpiryMinutes, setQrExpiryMinutes] = useState('30');
    const [checkinExtensionMinutes, setCheckinExtensionMinutes] = useState('60');
    const [savingSettings, setSavingSettings] = useState(false);
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    // ───── Building QR State ─────
    const [buildingQRs, setBuildingQRs] = useState<{ id: number, code: string, type: string, label: string, expires_at: string | null, locations?: { name: string } | null }[]>([]);
    const [occupancy, setOccupancy] = useState<{ inside: number } | null>(null);
    const [showQRGenerateModal, setShowQRGenerateModal] = useState<{ type: 'checkin' | 'checkout', label: string } | null>(null);
    const [qrFormLabel, setQrFormLabel] = useState('');
    const [qrFormLocationId, setQrFormLocationId] = useState('');
    const [qrFormExpiryDays, setQrFormExpiryDays] = useState('1');

    // ───── Data Management State ─────
    const [generatingData, setGeneratingData] = useState(false);
    const [resettingData, setResettingData] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);

    const fetchLocations = useCallback(async () => {
        try {
            const res = await fetch('/api/locations');
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            const data = await res.json();
            setLocations(data);
            setError(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load locations';
            console.error('fetchLocations error:', message);
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);


    const fetchEvents = useCallback(async () => {
        try {
            const res = await fetch('/api/events');
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            const data = await res.json();
            setEvents(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load events';
            console.error('fetchEvents error:', message);
            setError(message);
        } finally {
            setEventsLoading(false);
        }
    }, []);





    const fetchDropdownOptions = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/dropdown-options?category=${dropdownCategory}`);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            const data = await res.json();
            setDropdownOptions(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load dropdown options';
            console.error('fetchDropdownOptions error:', message);
            setError(message);
        } finally {
            setDropdownLoading(false);
        }
    }, [dropdownCategory]);

    useEffect(() => {
        fetchLocations();
        fetchEvents();

        // Fetch app settings
        (async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data.qr_expiry_minutes) {
                        setQrExpiryMinutes(data.qr_expiry_minutes);
                    }
                    if (data.checkin_extension_minutes) {
                        setCheckinExtensionMinutes(data.checkin_extension_minutes);
                    }
                    setSettingsLoaded(true);
                }
            } catch (err) {
                console.error('Failed to fetch settings:', err);
            }
        })();

        const fetchBuildingQRs = async () => {
            try {
                const res = await fetch('/api/building/qr-codes');
                if (res.ok) {
                    setBuildingQRs(await res.json());
                }
            } catch (err) {
                console.error('Failed to fetch building QRs:', err);
            }
        };
        fetchBuildingQRs();

        const fetchOccupancy = async () => {
            try {
                const res = await fetch('/api/building/occupancy');
                if (res.ok) {
                    setOccupancy(await res.json());
                }
            } catch (err) {
                console.error('Failed to fetch occupancy:', err);
            }
        };
        fetchOccupancy();
        const interval = setInterval(fetchOccupancy, 30000);
        return () => clearInterval(interval);
    }, [fetchLocations, fetchEvents]);

    useEffect(() => {
        setDropdownLoading(true);
        fetchDropdownOptions();
    }, [fetchDropdownOptions]);

    // Auto-dismiss success message
    useEffect(() => {
        if (successMsg) {
            const timer = setTimeout(() => setSuccessMsg(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMsg]);

    const validateForm = (): boolean => {
        const errors: Partial<LocationFormData> = {};

        if (!formData.name.trim()) {
            errors.name = 'Name is required';
        }

        const cap = parseInt(formData.capacity, 10);
        if (!formData.capacity || isNaN(cap) || cap < 0) {
            errors.capacity = 'Capacity must be a non-negative number';
        }

        if (!formData.facilities.trim()) {
            errors.facilities = 'At least one facility is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData(EMPTY_FORM);
        setFormErrors({});
    };

    const handleEdit = (loc: Location) => {
        setEditingId(loc.id);
        setFormData({
            name: loc.name,
            capacity: String(loc.capacity),
            facilities: loc.facilities,
        });
        setFormErrors({});
        setShowForm(true);
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setSaving(true);
        const payload = {
            name: formData.name.trim(),
            capacity: parseInt(formData.capacity, 10),
            facilities: formData.facilities.trim(),
        };

        try {
            const isEditing = editingId !== null;
            const url = isEditing ? `/api/locations/${editingId}` : '/api/locations';
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error || `HTTP ${res.status}`);
            }

            setSuccessMsg(isEditing ? 'Location updated successfully' : 'Location created successfully');
            resetForm();
            await fetchLocations();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Operation failed';
            console.error('handleSubmit error:', message);
            setError(message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error || `HTTP ${res.status}`);
            }
            setSuccessMsg('Location deleted successfully');
            setDeletingId(null);
            await fetchLocations();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Delete failed';
            console.error('handleDelete error:', message);
            setError(message);
            setDeletingId(null);
        } finally {
            setDeleting(false);
        }
    };

    const facilityTags = (facilities: string) =>
        facilities
            .split(',')
            .map((f) => f.trim())
            .filter(Boolean);


    // ───── Event Form Handlers ─────
    const validateEventForm = (): boolean => {
        const errors: Partial<Record<keyof EventFormData, string>> = {};

        if (!eventFormData.name.trim()) {
            errors.name = 'Event name is required';
        }

        setEventFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const resetEventForm = () => {
        setShowEventForm(false);
        setEditingEventId(null);
        setEventFormData(EMPTY_EVENT_FORM);
        setEventFormErrors({});
    };

    const handleEditEvent = (ev: EventItem) => {
        setEditingEventId(ev.id);
        setEventFormData({
            name: ev.name,
            description: ev.description || '',
        });
        setEventFormErrors({});
        setShowEventForm(true);
    };

    const handleSubmitEvent = async () => {
        if (!validateEventForm()) return;

        setSavingEvent(true);
        const payload = {
            name: eventFormData.name.trim(),
            description: eventFormData.description.trim(),
        };

        try {
            const isEditing = editingEventId !== null;
            const url = isEditing ? `/api/events/${editingEventId}` : '/api/events';
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error || `HTTP ${res.status}`);
            }

            setSuccessMsg(isEditing ? 'Event updated successfully' : 'Event created successfully');
            resetEventForm();
            await fetchEvents();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Operation failed';
            console.error('handleSubmitEvent error:', message);
            setError(message);
        } finally {
            setSavingEvent(false);
        }
    };

    const handleDeleteEvent = async (id: number) => {
        setDeletingEvent(true);
        try {
            const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error || `HTTP ${res.status}`);
            }
            setSuccessMsg('Event deleted successfully');
            setDeletingEventId(null);
            await fetchEvents();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Delete failed';
            console.error('handleDeleteEvent error:', message);
            setError(message);
            setDeletingEventId(null);
        } finally {
            setDeletingEvent(false);
        }
    };



    // ───── Dropdown Options Form Handlers ─────
    const DROPDOWN_CATEGORIES = [
        { value: 'nationality' as const, label: 'Nationalities', icon: Globe },
        { value: 'airline' as const, label: 'Airlines', icon: Plane },
        { value: 'destination' as const, label: 'Destinations', icon: MapPin },
    ];

    const validateDropdownForm = (): boolean => {
        const errors: Partial<Record<keyof DropdownFormData, string>> = {};
        if (!dropdownFormData.label.trim()) {
            errors.label = 'Label is required';
        }
        setDropdownFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const resetDropdownForm = () => {
        setShowDropdownForm(false);
        setEditingDropdownId(null);
        setDropdownFormData(EMPTY_DROPDOWN_FORM);
        setDropdownFormErrors({});
    };

    const handleEditDropdown = (opt: DropdownOption) => {
        setEditingDropdownId(opt.id);
        setDropdownFormData({ label: opt.label });
        setDropdownFormErrors({});
        setShowDropdownForm(true);
    };

    const handleSubmitDropdown = async () => {
        if (!validateDropdownForm()) return;

        setSavingDropdown(true);
        try {
            const isEditing = editingDropdownId !== null;
            const url = isEditing
                ? `/api/admin/dropdown-options/${editingDropdownId}`
                : '/api/admin/dropdown-options';
            const method = isEditing ? 'PUT' : 'POST';
            const payload = isEditing
                ? { label: dropdownFormData.label.trim() }
                : { category: dropdownCategory, label: dropdownFormData.label.trim() };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error || `HTTP ${res.status}`);
            }

            setSuccessMsg(isEditing ? 'Dropdown option updated' : 'Dropdown option added');
            resetDropdownForm();
            await fetchDropdownOptions();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Operation failed';
            console.error('handleSubmitDropdown error:', message);
            setError(message);
        } finally {
            setSavingDropdown(false);
        }
    };

    const handleDeleteDropdown = async (id: number) => {
        setDeletingDropdown(true);
        try {
            const res = await fetch(`/api/admin/dropdown-options/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error || `HTTP ${res.status}`);
            }
            setSuccessMsg('Dropdown option deleted');
            setDeletingDropdownId(null);
            await fetchDropdownOptions();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Delete failed';
            console.error('handleDeleteDropdown error:', message);
            setError(message);
            setDeletingDropdownId(null);
        } finally {
            setDeletingDropdown(false);
        }
    };

    const handleToggleDropdownActive = async (opt: DropdownOption) => {
        try {
            const res = await fetch(`/api/admin/dropdown-options/${opt.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label: opt.label, active: opt.active === 1 ? false : true }),
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error || `HTTP ${res.status}`);
            }
            setSuccessMsg(`"${opt.label}" ${opt.active === 1 ? 'hidden' : 'shown'} in registration`);
            await fetchDropdownOptions();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Toggle failed';
            console.error('handleToggleDropdownActive error:', message);
            setError(message);
        }
    };

    const filteredDropdownOptions = dropdownSearch.trim()
        ? dropdownOptions.filter(o => o.label.toLowerCase().includes(dropdownSearch.toLowerCase()))
        : dropdownOptions;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            <AdminSidebar activePage="settings" />

            <main className="flex-1 overflow-y-auto p-6 lg:p-10">
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <Settings className="h-7 w-7 text-indigo-600" />
                            Settings
                        </h1>
                        <p className="text-slate-500 mt-1">Manage your operational configuration</p>
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

                {/* ───── QR Code Expiry Setting ───── */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                <QrCode className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">QR Code Settings</h2>
                                <p className="text-sm text-slate-500">
                                    Configure QR code expiry duration for passengers
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="flex items-end gap-4 max-w-md">
                            <div className="flex-1">
                                <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                                    <Timer className="h-3.5 w-3.5 text-slate-400" /> QR Code Expiry (minutes)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="1440"
                                    value={qrExpiryMinutes}
                                    onChange={(e) => setQrExpiryMinutes(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-shadow"
                                    placeholder="e.g. 30"
                                />
                                <p className="text-xs text-slate-400 mt-1.5">
                                    Passengers must renew their QR code after this duration. Min: 1, Max: 1440 (24 hours).
                                </p>
                            </div>
                            <button
                                onClick={async () => {
                                    const val1 = parseInt(qrExpiryMinutes, 10);
                                    const val2 = parseInt(checkinExtensionMinutes, 10);
                                    if (isNaN(val1) || val1 < 1 || val1 > 1440) {
                                        setError('QR expiry must be between 1 and 1440 minutes');
                                        return;
                                    }
                                    if (isNaN(val2) || val2 < 1 || val2 > 1440) {
                                        setError('Extension minutes must be between 1 and 1440');
                                        return;
                                    }
                                    setSavingSettings(true);
                                    try {
                                        await fetch('/api/settings', {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ key: 'qr_expiry_minutes', value: String(val1) }),
                                        });
                                        await fetch('/api/settings', {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ key: 'checkin_extension_minutes', value: String(val2) }),
                                        });
                                        setSuccessMsg('QR settings updated successfully');
                                    } catch (err) {
                                        const msg = err instanceof Error ? err.message : 'Failed to save setting';
                                        console.error('Save setting error:', msg);
                                        setError(msg);
                                    } finally {
                                        setSavingSettings(false);
                                    }
                                }}
                                disabled={savingSettings}
                                className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 whitespace-nowrap h-[46px]"
                            >
                                {savingSettings ? (
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                {savingSettings ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                        <div className="flex items-end gap-4 max-w-md mt-6">
                            <div className="flex-1">
                                <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                                    <Timer className="h-3.5 w-3.5 text-slate-400" /> Check-in Extension (minutes)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="1440"
                                    value={checkinExtensionMinutes}
                                    onChange={(e) => setCheckinExtensionMinutes(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-shadow"
                                    placeholder="e.g. 60"
                                />
                                <p className="text-xs text-slate-400 mt-1.5">
                                    How long QR validity is extended when checked in.
                                </p>
                            </div>
                        </div>

                        <div className="mt-10 border-t border-slate-100 pt-8">
                            <h3 className="text-sm font-bold text-slate-900 mb-4">Building Entry & Exit QR Codes</h3>
                            <p className="text-sm text-slate-500 mb-6">
                                Print these QR codes and place them at entrances/exits. Passengers scan them to check in/out.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {buildingQRs.map(qr => (
                                    <div key={qr.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col items-center text-center">
                                        <div className="mb-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider ${qr.type === 'checkin' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                {qr.type}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-slate-900 mb-2">{qr.label}</h4>
                                        {qr.locations?.name && (
                                            <p className="text-xs text-indigo-700 font-medium mb-1 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                {qr.locations.name}
                                            </p>
                                        )}
                                        {qr.expires_at && (
                                            <p className="text-xs text-slate-500 mb-4 mt-1">
                                                Expires: {new Date(qr.expires_at).toLocaleDateString()}
                                            </p>
                                        )}
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4">
                                            <QRCodeSVG value={qr.code} size={140} level="L" includeMargin={true} />
                                        </div>
                                        <div className="flex items-center gap-4 mt-6">
                                            <button
                                                onClick={async () => {
                                                    if (!confirm('Are you sure you want to delete this QR code? It will stop working immediately.')) return;
                                                    try {
                                                        await fetch(`/api/building/qr-codes/${qr.id}`, { method: 'DELETE' });
                                                        setBuildingQRs(prev => prev.filter(q => q.id !== qr.id));
                                                    } catch (e) {
                                                        setError('Failed to delete QR code');
                                                    }
                                                }}
                                                className="text-sm text-rose-600 hover:text-rose-700 font-medium"
                                            >
                                                Delete Code
                                            </button>
                                            <Link
                                                to={`/control/print-qr/${qr.id}`}
                                                target="_blank"
                                                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-bold"
                                            >
                                                <Printer className="h-3.5 w-3.5" />
                                                Print Design
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 flex gap-4">
                                <button
                                    onClick={() => {
                                        setQrFormLabel('New Check In Entry');
                                        setQrFormLocationId('');
                                        setQrFormExpiryDays('1');
                                        setShowQRGenerateModal({ type: 'checkin', label: 'New Check In Entry' });
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    New Check-in QR
                                </button>
                                <button
                                    onClick={() => {
                                        setQrFormLabel('New Check Out Exit');
                                        setQrFormLocationId('');
                                        setQrFormExpiryDays('1');
                                        setShowQRGenerateModal({ type: 'checkout', label: 'New Check Out Exit' });
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-xl text-sm font-semibold hover:bg-rose-100 transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    New Check-out QR
                                </button>
                            </div>

                            {/* QR Generate Form Modal */}
                            {showQRGenerateModal && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                            <h3 className="text-lg font-bold text-slate-900">
                                                Generate {showQRGenerateModal.type === 'checkin' ? 'Check-in' : 'Check-out'} QR
                                            </h3>
                                            <button onClick={() => setShowQRGenerateModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-50">
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">QR Code Label</label>
                                                <input
                                                    type="text"
                                                    value={qrFormLabel}
                                                    onChange={e => setQrFormLabel(e.target.value)}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                                    placeholder="e.g. Main Entrance Gate 1"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Facility Location</label>
                                                <select
                                                    value={qrFormLocationId}
                                                    onChange={e => setQrFormLocationId(e.target.value)}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none"
                                                >
                                                    <option value="">-- No specific location (General) --</option>
                                                    {locations.map(loc => (
                                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">Expiry (Days from now)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={qrFormExpiryDays}
                                                    onChange={e => setQrFormExpiryDays(e.target.value)}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                                            <button
                                                onClick={() => setShowQRGenerateModal(null)}
                                                className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-xl transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const expiryDays = parseInt(qrFormExpiryDays, 10);
                                                        const expiresAt = new Date();
                                                        expiresAt.setDate(expiresAt.getDate() + (isNaN(expiryDays) ? 1 : expiryDays));

                                                        const res = await fetch('/api/building/qr-codes/generate', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                type: showQRGenerateModal.type,
                                                                label: qrFormLabel,
                                                                location_id: qrFormLocationId ? parseInt(qrFormLocationId, 10) : null,
                                                                expires_at: expiresAt.toISOString()
                                                            }),
                                                        });
                                                        if (res.ok) {
                                                            const newCode = await res.json();
                                                            setBuildingQRs(prev => [...prev, newCode.qr_code]);
                                                            setShowQRGenerateModal(null);
                                                        }
                                                    } catch (e) {
                                                        console.error('Failed to generate QR code', e);
                                                    }
                                                }}
                                                disabled={!qrFormLabel}
                                                className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50"
                                            >
                                                Generate
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ───── Data Management Section ───── */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                    <div className="p-6 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Database className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Data Management</h2>
                                <p className="text-sm text-slate-500">
                                    Generate demo data for testing or reset all data
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Generate Test Data */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 bg-emerald-50/60 border border-emerald-200/60 rounded-xl">
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <Database className="h-4 w-4 text-emerald-600" />
                                    Generate Test Data
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Creates <strong>30 days</strong> of realistic passenger data (<strong>300 passengers/day = 9,000 total</strong>) with
                                    check-ins and activity logs. Stay durations range from 1–10 days.
                                </p>
                            </div>
                            {!showGenerateConfirm ? (
                                <button
                                    onClick={() => setShowGenerateConfirm(true)}
                                    disabled={generatingData}
                                    className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 whitespace-nowrap"
                                >
                                    <Database className="h-4 w-4" />
                                    Generate Test Data
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-amber-700 font-medium">Are you sure?</span>
                                    <button
                                        onClick={async () => {
                                            const pass = prompt('Enter passcode to generate test data:');
                                            if (pass !== '1942') {
                                                setError('Invalid passcode');
                                                setShowGenerateConfirm(false);
                                                return;
                                            }
                                            setGeneratingData(true);
                                            setShowGenerateConfirm(false);
                                            try {
                                                const res = await fetch('/api/admin/generate-test-data', { method: 'POST' });
                                                if (!res.ok) {
                                                    const body = await res.json();
                                                    throw new Error(body.error || 'Failed to generate test data');
                                                }
                                                const data = await res.json();
                                                setSuccessMsg(data.message || 'Test data generated successfully!');
                                            } catch (err) {
                                                const msg = err instanceof Error ? err.message : 'Failed to generate test data';
                                                console.error('Generate test data error:', msg);
                                                setError(msg);
                                            } finally {
                                                setGeneratingData(false);
                                            }
                                        }}
                                        disabled={generatingData}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 shadow-sm transition-all disabled:opacity-50"
                                    >
                                        {generatingData ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Check className="h-3.5 w-3.5" />
                                        )}
                                        {generatingData ? 'Generating...' : 'Confirm'}
                                    </button>
                                    <button
                                        onClick={() => setShowGenerateConfirm(false)}
                                        disabled={generatingData}
                                        className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {generatingData && (
                            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-pulse">
                                <Loader2 className="h-5 w-5 text-emerald-600 animate-spin" />
                                <div>
                                    <p className="text-sm font-semibold text-emerald-800">Generating 9,000 passengers...</p>
                                    <p className="text-xs text-emerald-600">This may take a moment. Please wait.</p>
                                </div>
                            </div>
                        )}

                        {/* Reset All Data */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 bg-rose-50/60 border border-rose-200/60 rounded-xl">
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <RefreshCw className="h-4 w-4 text-rose-600" />
                                    Reset All Data
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Clears all <strong>passengers, transactions, messages, activity logs, broadcasts</strong>,
                                    and accompanying travellers. Preserves settings, dropdown options, events, and locations.
                                </p>
                            </div>
                            {!showResetConfirm ? (
                                <button
                                    onClick={() => setShowResetConfirm(true)}
                                    disabled={resettingData}
                                    className="flex items-center gap-2 px-5 py-3 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 whitespace-nowrap"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Reset All Data
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-rose-700 font-medium flex items-center gap-1">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        This cannot be undone!
                                    </span>
                                    <button
                                        onClick={async () => {
                                            const pass = prompt('Enter passcode to reset all data:');
                                            if (pass !== '1942') {
                                                setError('Invalid passcode');
                                                setShowResetConfirm(false);
                                                return;
                                            }
                                            setResettingData(true);
                                            setShowResetConfirm(false);
                                            try {
                                                const res = await fetch('/api/admin/reset-data', { method: 'POST' });
                                                if (!res.ok) {
                                                    const body = await res.json();
                                                    throw new Error(body.error || 'Failed to reset data');
                                                }
                                                const data = await res.json();
                                                setSuccessMsg(data.message || 'All data has been reset successfully!');
                                            } catch (err) {
                                                const msg = err instanceof Error ? err.message : 'Failed to reset data';
                                                console.error('Reset data error:', msg);
                                                setError(msg);
                                            } finally {
                                                setResettingData(false);
                                            }
                                        }}
                                        disabled={resettingData}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 shadow-sm transition-all disabled:opacity-50"
                                    >
                                        {resettingData ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Check className="h-3.5 w-3.5" />
                                        )}
                                        {resettingData ? 'Resetting...' : 'Confirm Delete'}
                                    </button>
                                    <button
                                        onClick={() => setShowResetConfirm(false)}
                                        disabled={resettingData}
                                        className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {resettingData && (
                            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl animate-pulse">
                                <Loader2 className="h-5 w-5 text-rose-600 animate-spin" />
                                <div>
                                    <p className="text-sm font-semibold text-rose-800">Resetting all data...</p>
                                    <p className="text-xs text-rose-600">Dropdown options and settings will be preserved.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ───── Manage Events Section ───── */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Manage Events</h2>
                                <p className="text-sm text-slate-500">
                                    Add, edit, or remove disruption events
                                </p>
                            </div>
                        </div>

                        {!showEventForm && (
                            <button
                                onClick={() => {
                                    resetEventForm();
                                    setShowEventForm(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 shadow-sm transition-all active:scale-95"
                            >
                                <Plus className="h-4 w-4" /> Add Event
                            </button>
                        )}
                    </div>

                    {/* Add / Edit Event Form */}
                    {showEventForm && (
                        <div className="p-6 bg-slate-50 border-b border-slate-200">
                            <h3 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
                                {editingEventId !== null ? (
                                    <>
                                        <Pencil className="h-4 w-4 text-violet-500" /> Edit Event
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4 text-violet-500" /> New Event
                                    </>
                                )}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Event Name */}
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-slate-400" /> Event Name
                                    </label>
                                    <input
                                        type="text"
                                        value={eventFormData.name}
                                        onChange={(e) => setEventFormData((prev) => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g. Disruption Case: Weather delays"
                                        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-shadow ${eventFormErrors.name
                                            ? 'border-rose-300 bg-rose-50'
                                            : 'border-slate-200 bg-white'
                                            }`}
                                    />
                                    {eventFormErrors.name && (
                                        <p className="mt-1 text-xs text-rose-600">{eventFormErrors.name}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                                        <FileText className="h-3.5 w-3.5 text-slate-400" /> Description
                                    </label>
                                    <input
                                        type="text"
                                        value={eventFormData.description}
                                        onChange={(e) =>
                                            setEventFormData((prev) => ({ ...prev, description: e.target.value }))
                                        }
                                        placeholder="Brief description of the event"
                                        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-shadow ${eventFormErrors.description
                                            ? 'border-rose-300 bg-rose-50'
                                            : 'border-slate-200 bg-white'
                                            }`}
                                    />
                                    {eventFormErrors.description && (
                                        <p className="mt-1 text-xs text-rose-600">{eventFormErrors.description}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-6">
                                <button
                                    onClick={handleSubmitEvent}
                                    disabled={savingEvent}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                                >
                                    {savingEvent ? (
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Check className="h-4 w-4" />
                                    )}
                                    {editingEventId !== null ? 'Update Event' : 'Create Event'}
                                </button>
                                <button
                                    onClick={resetEventForm}
                                    disabled={savingEvent}
                                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Events Table */}
                    <div className="p-6">
                        {eventsLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" />
                            </div>
                        ) : events.length === 0 ? (
                            <div className="text-center py-16 text-slate-400">
                                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                <p className="text-lg font-medium text-slate-500">No events configured</p>
                                <p className="text-sm mt-1">Add your first event to get started</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                            <th className="pb-3 pr-6 font-semibold">Name</th>
                                            <th className="pb-3 pr-6 font-semibold">Description</th>
                                            <th className="pb-3 pr-6 font-semibold">Date</th>
                                            <th className="pb-3 pr-6 font-semibold">Status</th>
                                            <th className="pb-3 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {events.map((ev) => (
                                            <tr key={ev.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 pr-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                                            <Calendar className="h-4 w-4" />
                                                        </div>
                                                        <span className="font-semibold text-slate-900">{ev.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 pr-6">
                                                    <span className="text-slate-600 text-sm">
                                                        {ev.description || <span className="text-slate-400 italic">No description</span>}
                                                    </span>
                                                </td>
                                                <td className="py-4 pr-6">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium text-xs">
                                                        {ev.date}
                                                    </span>
                                                </td>
                                                <td className="py-4 pr-6">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${ev.status === 'active'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : 'bg-slate-100 text-slate-500'
                                                            }`}
                                                    >
                                                        <span
                                                            className={`h-1.5 w-1.5 rounded-full ${ev.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                                                                }`}
                                                        />
                                                        {ev.status === 'active' ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right">
                                                    {deletingEventId === ev.id ? (
                                                        <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                                                            <span className="text-xs font-medium text-rose-700">Delete?</span>
                                                            <button
                                                                onClick={() => handleDeleteEvent(ev.id)}
                                                                disabled={deletingEvent}
                                                                className="p-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50"
                                                            >
                                                                <Check className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeletingEventId(null)}
                                                                disabled={deletingEvent}
                                                                className="p-1 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleEditEvent(ev)}
                                                                className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeletingEventId(ev.id)}
                                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* ───── Manage Locations Section ───── */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Manage Locations</h2>
                                <p className="text-sm text-slate-500">
                                    Add, edit, or remove rest zones and staging areas
                                </p>
                            </div>
                        </div>

                        {!showForm && (
                            <button
                                onClick={() => {
                                    resetForm();
                                    setShowForm(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-all active:scale-95"
                            >
                                <Plus className="h-4 w-4" /> Add Location
                            </button>
                        )}
                    </div>

                    {/* Add / Edit Form */}
                    {showForm && (
                        <div className="p-6 bg-slate-50 border-b border-slate-200">
                            <h3 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
                                {editingId !== null ? (
                                    <>
                                        <Pencil className="h-4 w-4 text-indigo-500" /> Edit Location
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4 text-indigo-500" /> New Location
                                    </>
                                )}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {/* Name */}
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                                        <Building2 className="h-3.5 w-3.5 text-slate-400" /> Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g. Zone D - VIP Lounge"
                                        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-shadow ${formErrors.name
                                            ? 'border-rose-300 bg-rose-50'
                                            : 'border-slate-200 bg-white'
                                            }`}
                                    />
                                    {formErrors.name && (
                                        <p className="mt-1 text-xs text-rose-600">{formErrors.name}</p>
                                    )}
                                </div>

                                {/* Capacity */}
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                                        <Layers className="h-3.5 w-3.5 text-slate-400" /> Capacity
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.capacity}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, capacity: e.target.value }))
                                        }
                                        placeholder="e.g. 300"
                                        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-shadow ${formErrors.capacity
                                            ? 'border-rose-300 bg-rose-50'
                                            : 'border-slate-200 bg-white'
                                            }`}
                                    />
                                    {formErrors.capacity && (
                                        <p className="mt-1 text-xs text-rose-600">{formErrors.capacity}</p>
                                    )}
                                </div>

                                {/* Facilities */}
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                                        <Zap className="h-3.5 w-3.5 text-slate-400" /> Facilities
                                        <span className="text-slate-400 font-normal">(comma-separated)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.facilities}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, facilities: e.target.value }))
                                        }
                                        placeholder="e.g. Sleep, Shower, Charging, WiFi"
                                        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-shadow ${formErrors.facilities
                                            ? 'border-rose-300 bg-rose-50'
                                            : 'border-slate-200 bg-white'
                                            }`}
                                    />
                                    {formErrors.facilities && (
                                        <p className="mt-1 text-xs text-rose-600">{formErrors.facilities}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-6">
                                <button
                                    onClick={handleSubmit}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                                >
                                    {saving ? (
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Check className="h-4 w-4" />
                                    )}
                                    {editingId !== null ? 'Update Location' : 'Create Location'}
                                </button>
                                <button
                                    onClick={resetForm}
                                    disabled={saving}
                                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Locations Table */}
                    <div className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                            </div>
                        ) : locations.length === 0 ? (
                            <div className="text-center py-16 text-slate-400">
                                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                <p className="text-lg font-medium text-slate-500">No locations configured</p>
                                <p className="text-sm mt-1">Add your first location to get started</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                            <th className="pb-3 pr-6 font-semibold">Name</th>
                                            <th className="pb-3 pr-6 font-semibold">Capacity</th>
                                            <th className="pb-3 pr-6 font-semibold">Facilities</th>
                                            <th className="pb-3 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {locations.map((loc) => (
                                            <tr key={loc.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 pr-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                                            <MapPin className="h-4 w-4" />
                                                        </div>
                                                        <span className="font-semibold text-slate-900">{loc.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 pr-6">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium text-xs">
                                                        <Users className="h-3.5 w-3.5" />
                                                        {loc.capacity.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="py-4 pr-6">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {facilityTags(loc.facilities).map((tag, i) => (
                                                            <span
                                                                key={i}
                                                                className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-4 text-right">
                                                    {deletingId === loc.id ? (
                                                        <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                                                            <span className="text-xs font-medium text-rose-700">Delete?</span>
                                                            <button
                                                                onClick={() => handleDelete(loc.id)}
                                                                disabled={deleting}
                                                                className="p-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50"
                                                            >
                                                                <Check className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeletingId(null)}
                                                                disabled={deleting}
                                                                className="p-1 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleEdit(loc)}
                                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeletingId(loc.id)}
                                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                <UserManagement />

                {/* ═══════ Registration Dropdowns ═══════ */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                                <List className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Registration Dropdowns</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Manage options shown in passenger &amp; staff registration forms</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                resetDropdownForm();
                                setShowDropdownForm(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
                        >
                            <Plus className="h-4 w-4" /> Add Option
                        </button>
                    </div>

                    {/* Category Tabs */}
                    <div className="px-6 pt-4 flex gap-2">
                        {DROPDOWN_CATEGORIES.map(cat => {
                            const Icon = cat.icon;
                            const isActive = dropdownCategory === cat.value;
                            return (
                                <button
                                    key={cat.value}
                                    onClick={() => {
                                        setDropdownCategory(cat.value);
                                        setDropdownSearch('');
                                        resetDropdownForm();
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive
                                        ? 'bg-violet-100 text-violet-700 shadow-sm border border-violet-200'
                                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-transparent'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {cat.label}
                                    <span className={`ml-1 text-xs rounded-full px-1.5 py-0.5 ${isActive ? 'bg-violet-200 text-violet-800' : 'bg-slate-200 text-slate-600'
                                        }`}>
                                        {dropdownOptions.filter(o => !dropdownSearch.trim() || o.label.toLowerCase().includes(dropdownSearch.toLowerCase())).length}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Search */}
                    <div className="px-6 pt-3 pb-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder={`Search ${DROPDOWN_CATEGORIES.find(c => c.value === dropdownCategory)?.label ?? ''}...`}
                                value={dropdownSearch}
                                onChange={e => setDropdownSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:border-violet-400 focus:ring-violet-400 focus:bg-white transition-colors"
                            />
                        </div>
                    </div>

                    {/* Add / Edit Form */}
                    {showDropdownForm && (
                        <div className="mx-6 my-3 p-5 bg-violet-50 border border-violet-200 rounded-xl space-y-4">
                            <h3 className="font-semibold text-violet-900 text-sm">
                                {editingDropdownId ? 'Edit Option' : `Add New ${DROPDOWN_CATEGORIES.find(c => c.value === dropdownCategory)?.label.slice(0, -1) ?? 'Option'}`}
                            </h3>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Label *</label>
                                <input
                                    type="text"
                                    value={dropdownFormData.label}
                                    onChange={e => setDropdownFormData({ label: e.target.value })}
                                    className={`w-full rounded-xl border p-2.5 text-sm bg-white ${dropdownFormErrors.label ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-violet-400'
                                        }`}
                                    placeholder={`e.g. ${dropdownCategory === 'nationality' ? 'Maldivian' : dropdownCategory === 'airline' ? 'Emirates' : 'Dubai (DXB)'}`}
                                />
                                {dropdownFormErrors.label && (
                                    <p className="text-xs text-rose-600 mt-1">{dropdownFormErrors.label}</p>
                                )}
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={resetDropdownForm}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitDropdown}
                                    disabled={savingDropdown}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-1.5"
                                >
                                    {savingDropdown ? (
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                        </svg>
                                    ) : (
                                        <Check className="h-4 w-4" />
                                    )}
                                    {editingDropdownId ? 'Update' : 'Add'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Options List */}
                    {dropdownLoading ? (
                        <div className="p-12 flex justify-center">
                            <div className="h-8 w-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                        </div>
                    ) : filteredDropdownOptions.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <List className="h-10 w-10 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">
                                {dropdownSearch.trim() ? 'No matching options found' : 'No options in this category yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                            {filteredDropdownOptions.map((opt) => (
                                <div key={opt.id} className={`px-6 py-3 flex items-center gap-3 group hover:bg-slate-50 transition-colors ${opt.active === 0 ? 'opacity-50' : ''}`}>
                                    <span className={`flex-1 text-sm ${opt.active === 0 ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                        {opt.label}
                                    </span>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {/* Toggle Active */}
                                        <button
                                            onClick={() => handleToggleDropdownActive(opt)}
                                            className={`p-1.5 rounded-lg transition-colors ${opt.active === 1
                                                ? 'text-emerald-500 hover:bg-emerald-50'
                                                : 'text-slate-400 hover:bg-slate-100'
                                                }`}
                                            title={opt.active === 1 ? 'Hide from registration' : 'Show in registration'}
                                        >
                                            {opt.active === 1 ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                        </button>
                                        {/* Edit */}
                                        <button
                                            onClick={() => handleEditDropdown(opt)}
                                            className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        {/* Delete */}
                                        {deletingDropdownId === opt.id ? (
                                            <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">
                                                <span className="text-xs font-medium text-rose-700">Del?</span>
                                                <button
                                                    onClick={() => handleDeleteDropdown(opt.id)}
                                                    disabled={deletingDropdown}
                                                    className="p-0.5 bg-rose-600 text-white rounded hover:bg-rose-700 disabled:opacity-50"
                                                >
                                                    <Check className="h-3 w-3" />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingDropdownId(null)}
                                                    disabled={deletingDropdown}
                                                    className="p-0.5 bg-white border border-slate-200 text-slate-500 rounded hover:bg-slate-50"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setDeletingDropdownId(opt.id)}
                                                className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
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

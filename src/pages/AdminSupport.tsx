import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import {
    MapPin,
    Trash2,
    Check,
    X,
    AlertTriangle,
    Send,
    Megaphone,
    Search,
    Filter,
    Plane,
    ChevronDown,
    Clock,
    CheckCircle,
    Circle,
    Zap,
    MessageCircle,
    Plus,
    Pencil,
    ArrowLeft,
    Globe,
    Calendar,
    RotateCcw,
    User,
    MessageSquare,
} from 'lucide-react';

// ───── Types ─────
interface Conversation {
    passenger_id: number;
    name: string;
    flight_number: string | null;
    country: string | null;
    nationality: string | null;
    departure_airline: string | null;
    final_destination: string | null;
    departure_date: string | null;
    qr_token: string;
    total_messages: number;
    passenger_messages: number;
    admin_messages: number;
    last_message: string;
    last_sender: string;
    last_message_time: string;
    conversation_status: string;
}

interface Message {
    id: number;
    passenger_id: number;
    text: string;
    sender: string;
    timestamp: string;
    status: string;
}

interface ChatDefaultResponse {
    id: number;
    title: string;
    message: string;
    category: string;
    sort_order: number;
    active: number;
}

// ───── Constants ─────
const CATEGORIES = ['general', 'services', 'flights', 'facilities'];

export default function AdminSupport() {
    // ───── State ─────
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Active conversation
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

    // Filters
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterAirline, setFilterAirline] = useState('');
    const [filterCountry, setFilterCountry] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Filter options
    const [airlineOptions, setAirlineOptions] = useState<string[]>([]);
    const [countryOptions, setCountryOptions] = useState<string[]>([]);

    // Quick Responses
    const [quickResponses, setQuickResponses] = useState<ChatDefaultResponse[]>([]);
    const [showQuickResponses, setShowQuickResponses] = useState(false);
    const [activeTab, setActiveTab] = useState<'inbox' | 'templates'>('inbox');

    // Template management
    const [showTemplateForm, setShowTemplateForm] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ChatDefaultResponse | null>(null);
    const [templateForm, setTemplateForm] = useState({ title: '', message: '', category: 'general' });
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [deletingTemplateId, setDeletingTemplateId] = useState<number | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ───── Data Fetching ─────
    const fetchConversations = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filterStatus !== 'all') params.set('status', filterStatus);
            if (filterAirline) params.set('airline', filterAirline);
            if (filterCountry) params.set('country', filterCountry);
            if (filterDateFrom) params.set('date_from', filterDateFrom);
            if (filterDateTo) params.set('date_to', filterDateTo);
            if (searchQuery.trim()) params.set('search', searchQuery.trim());

            const res = await fetch(`/api/admin/conversations?${params.toString()}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setConversations(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch conversations';
            console.error('fetchConversations error:', message);
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [filterStatus, filterAirline, filterCountry, filterDateFrom, filterDateTo, searchQuery]);

    const fetchFilterOptions = useCallback(async () => {
        try {
            const res = await fetch('/api/passengers/filters/options');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setAirlineOptions(data.airlines || []);
            // Extract unique countries from dropdown options
            const dRes = await fetch('/api/dropdown-options');
            if (dRes.ok) {
                const dData = await dRes.json();
                setCountryOptions(dData.nationality || []);
            }
        } catch (err) {
            console.error('fetchFilterOptions error:', err);
        }
    }, []);

    const fetchQuickResponses = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/chat-responses');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setQuickResponses(data);
        } catch (err) {
            console.error('fetchQuickResponses error:', err);
        }
    }, []);

    const fetchMessages = useCallback(async (passengerId: number) => {
        try {
            const res = await fetch(`/api/admin/conversations/${passengerId}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setMessages(data.messages);
        } catch (err) {
            console.error('fetchMessages error:', err);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchConversations();
        fetchFilterOptions();
        fetchQuickResponses();
    }, [fetchConversations, fetchFilterOptions, fetchQuickResponses]);

    // Poll for new messages when viewing a conversation
    useEffect(() => {
        if (activeConversation) {
            pollRef.current = setInterval(() => {
                fetchMessages(activeConversation.passenger_id);
            }, 5000);
        }
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [activeConversation, fetchMessages]);

    // Poll conversations list
    useEffect(() => {
        const interval = setInterval(fetchConversations, 10000);
        return () => clearInterval(interval);
    }, [fetchConversations]);

    // Auto-scroll messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Auto-dismiss success
    useEffect(() => {
        if (successMsg) {
            const timer = setTimeout(() => setSuccessMsg(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMsg]);

    // ───── Handlers ─────
    const handleSelectConversation = async (conv: Conversation) => {
        setActiveConversation(conv);
        setMessagesLoading(true);
        setReplyText('');
        setShowQuickResponses(false);
        try {
            await fetchMessages(conv.passenger_id);
        } finally {
            setMessagesLoading(false);
        }
    };

    const handleSendReply = async () => {
        if (!activeConversation || !replyText.trim()) return;
        setSendingReply(true);
        try {
            const res = await fetch(`/api/admin/conversations/${activeConversation.passenger_id}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: replyText.trim() }),
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error || `HTTP ${res.status}`);
            }
            const data = await res.json();
            setMessages(data.messages);
            setReplyText('');
            setShowQuickResponses(false);
            // Refresh conversation list
            await fetchConversations();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to send reply';
            console.error('handleSendReply error:', message);
            setError(message);
        } finally {
            setSendingReply(false);
        }
    };

    const handleUseQuickResponse = (response: ChatDefaultResponse) => {
        setReplyText(response.message);
        setShowQuickResponses(false);
    };

    const handleResolveConversation = async (passengerId: number) => {
        try {
            const res = await fetch(`/api/admin/conversations/${passengerId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'resolved' }),
            });
            if (!res.ok) throw new Error('Failed to update status');
            setSuccessMsg('Conversation marked as resolved');
            await fetchConversations();
            if (activeConversation?.passenger_id === passengerId) {
                setActiveConversation(null);
                setMessages([]);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to resolve';
            console.error('handleResolveConversation error:', message);
            setError(message);
        }
    };

    const handleReopenConversation = async (passengerId: number) => {
        try {
            const res = await fetch(`/api/admin/conversations/${passengerId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'open' }),
            });
            if (!res.ok) throw new Error('Failed to update status');
            setSuccessMsg('Conversation reopened');
            await fetchConversations();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to reopen';
            console.error('handleReopenConversation error:', message);
            setError(message);
        }
    };

    const resetFilters = () => {
        setFilterStatus('all');
        setFilterAirline('');
        setFilterCountry('');
        setFilterDateFrom('');
        setFilterDateTo('');
        setSearchQuery('');
    };

    // ───── Template Handlers ─────
    const handleSaveTemplate = async () => {
        if (!templateForm.title.trim() || !templateForm.message.trim()) {
            setError('Title and message are required');
            return;
        }
        setSavingTemplate(true);
        try {
            const method = editingTemplate ? 'PUT' : 'POST';
            const url = editingTemplate
                ? `/api/admin/chat-responses/${editingTemplate.id}`
                : '/api/admin/chat-responses';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(templateForm),
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error || `HTTP ${res.status}`);
            }
            setSuccessMsg(editingTemplate ? 'Template updated' : 'Template created');
            setShowTemplateForm(false);
            setEditingTemplate(null);
            setTemplateForm({ title: '', message: '', category: 'general' });
            await fetchQuickResponses();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to save template';
            console.error('handleSaveTemplate error:', message);
            setError(message);
        } finally {
            setSavingTemplate(false);
        }
    };

    const handleDeleteTemplate = async (id: number) => {
        try {
            const res = await fetch(`/api/admin/chat-responses/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error || `HTTP ${res.status}`);
            }
            setSuccessMsg('Template deleted');
            setDeletingTemplateId(null);
            await fetchQuickResponses();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Delete failed';
            console.error('handleDeleteTemplate error:', message);
            setError(message);
        }
    };

    const startEditTemplate = (t: ChatDefaultResponse) => {
        setEditingTemplate(t);
        setTemplateForm({ title: t.title, message: t.message, category: t.category });
        setShowTemplateForm(true);
    };

    // ───── Helpers ─────
    const formatTime = (ts: string) => {
        const date = new Date(ts);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHrs = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHrs / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHrs < 24) return `${diffHrs}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatFullTime = (ts: string) =>
        new Date(ts).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'replied': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'open': return <Circle className="h-3 w-3" />;
            case 'replied': return <Clock className="h-3 w-3" />;
            case 'resolved': return <CheckCircle className="h-3 w-3" />;
            default: return <Circle className="h-3 w-3" />;
        }
    };

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'general': return 'bg-slate-100 text-slate-600';
            case 'services': return 'bg-amber-100 text-amber-700';
            case 'flights': return 'bg-indigo-100 text-indigo-700';
            case 'facilities': return 'bg-emerald-100 text-emerald-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const openCount = conversations.filter(c => c.conversation_status === 'open').length;
    const activeFilters = [filterAirline, filterCountry, filterDateFrom, filterDateTo, searchQuery].filter(Boolean).length + (filterStatus !== 'all' ? 1 : 0);

    return (
        <div className="h-screen overflow-hidden bg-slate-50 flex flex-col md:flex-row">
            <AdminSidebar activePage="support" />

            {/* Main Content */}
            <main className="flex-1 overflow-hidden flex flex-col">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 px-6 lg:px-10 py-5 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <MessageSquare className="h-7 w-7 text-indigo-600" />
                            Support Center
                        </h1>
                        <p className="text-slate-500 mt-1">
                            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                            {openCount > 0 && <span className="text-rose-500 font-semibold"> • {openCount} open</span>}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setActiveTab('inbox')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'inbox' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                        >
                            <MessageCircle className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                            Inbox
                        </button>
                        <button
                            onClick={() => setActiveTab('templates')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'templates' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                        >
                            <Zap className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                            Quick Replies
                        </button>
                    </div>
                </header>

                {/* Toast Messages */}
                {successMsg && (
                    <div className="mx-6 lg:mx-10 mt-4 flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm">
                        <Check className="h-4 w-4 shrink-0" />
                        <span className="font-medium">{successMsg}</span>
                    </div>
                )}
                {error && (
                    <div className="mx-6 lg:mx-10 mt-4 flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span className="font-medium">{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto text-rose-500 hover:text-rose-700">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* ───── Inbox Tab ───── */}
                {activeTab === 'inbox' && (
                    <div className="flex-1 flex overflow-hidden">
                        {/* Left: Conversation List */}
                        <div className={`${activeConversation ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-96 border-r border-slate-200 bg-white`}>
                            {/* Search + Filters */}
                            <div className="p-4 border-b border-slate-100 space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search by name, flight, passport..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-300 transition-shadow"
                                    />
                                </div>

                                {/* Status Tabs */}
                                <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                                    {['all', 'open', 'replied', 'resolved'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setFilterStatus(s)}
                                            className={`flex-1 px-2 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${filterStatus === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            {s === 'all' ? 'All' : s}
                                            {s === 'open' && openCount > 0 && (
                                                <span className="ml-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                                                    {openCount}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Advanced Filters Toggle */}
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${activeFilters > 0 ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Filter className="h-3.5 w-3.5" />
                                    Filters {activeFilters > 0 && `(${activeFilters})`}
                                    <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                                </button>

                                {showFilters && (
                                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-3 animate-in">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Airline</label>
                                                <select
                                                    value={filterAirline}
                                                    onChange={e => setFilterAirline(e.target.value)}
                                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                >
                                                    <option value="">All Airlines</option>
                                                    {airlineOptions.map(a => <option key={a} value={a}>{a}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Country</label>
                                                <select
                                                    value={filterCountry}
                                                    onChange={e => setFilterCountry(e.target.value)}
                                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                >
                                                    <option value="">All Countries</option>
                                                    {countryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">From</label>
                                                <input
                                                    type="date"
                                                    value={filterDateFrom}
                                                    onChange={e => setFilterDateFrom(e.target.value)}
                                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">To</label>
                                                <input
                                                    type="date"
                                                    value={filterDateTo}
                                                    onChange={e => setFilterDateTo(e.target.value)}
                                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </div>
                                        </div>
                                        {activeFilters > 0 && (
                                            <button
                                                onClick={resetFilters}
                                                className="text-xs text-indigo-600 font-medium flex items-center gap-1 hover:text-indigo-700"
                                            >
                                                <RotateCcw className="h-3 w-3" /> Clear all filters
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Conversation List */}
                            <div className="flex-1 overflow-y-auto">
                                {loading ? (
                                    <div className="p-10 text-center">
                                        <div className="animate-spin h-8 w-8 border-2 border-indigo-300 border-t-transparent rounded-full mx-auto mb-3" />
                                        <p className="text-sm text-slate-500">Loading conversations...</p>
                                    </div>
                                ) : conversations.length === 0 ? (
                                    <div className="p-10 text-center">
                                        <MessageSquare className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                                        <p className="text-slate-500 font-medium">No conversations found</p>
                                        <p className="text-sm text-slate-400 mt-1">
                                            {activeFilters > 0 ? 'Try adjusting your filters' : 'Chat messages from passengers will appear here'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {conversations.map(conv => (
                                            <button
                                                key={conv.passenger_id}
                                                onClick={() => handleSelectConversation(conv)}
                                                className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex gap-3 ${activeConversation?.passenger_id === conv.passenger_id ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''}`}
                                            >
                                                {/* Avatar */}
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${conv.conversation_status === 'open' ? 'bg-amber-100 text-amber-700' : conv.conversation_status === 'replied' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                    {conv.name.charAt(0).toUpperCase()}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h4 className="font-semibold text-slate-900 text-sm truncate">{conv.name}</h4>
                                                        <span className="text-[10px] text-slate-400 flex-shrink-0">{formatTime(conv.last_message_time)}</span>
                                                    </div>

                                                    {/* Meta badges */}
                                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                        {conv.departure_airline && (
                                                            <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400">
                                                                <Plane className="h-2.5 w-2.5" />{conv.departure_airline}
                                                            </span>
                                                        )}
                                                        {conv.nationality && (
                                                            <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400">
                                                                <Globe className="h-2.5 w-2.5" />{conv.nationality}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-xs text-slate-500 mt-1 truncate">
                                                        {conv.last_sender === 'admin' && <span className="text-indigo-500 font-medium">You: </span>}
                                                        {conv.last_message}
                                                    </p>

                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(conv.conversation_status)}`}>
                                                            {getStatusIcon(conv.conversation_status)}
                                                            {conv.conversation_status}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {conv.total_messages} msg{conv.total_messages !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Chat View */}
                        <div className={`${activeConversation ? 'flex' : 'hidden lg:flex'} flex-col flex-1 bg-slate-50`}>
                            {activeConversation ? (
                                <>
                                    {/* Chat Header */}
                                    <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => { setActiveConversation(null); setMessages([]); }}
                                                className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                            >
                                                <ArrowLeft className="h-5 w-5 text-slate-600" />
                                            </button>
                                            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold ${activeConversation.conversation_status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                {activeConversation.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900 text-sm">{activeConversation.name}</h3>
                                                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                                    {activeConversation.flight_number && <span>✈ {activeConversation.flight_number}</span>}
                                                    {activeConversation.departure_airline && <span>• {activeConversation.departure_airline}</span>}
                                                    {activeConversation.nationality && <span>• {activeConversation.nationality}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {activeConversation.conversation_status !== 'resolved' ? (
                                                <button
                                                    onClick={() => handleResolveConversation(activeConversation.passenger_id)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
                                                >
                                                    <CheckCircle className="h-3.5 w-3.5" /> Resolve
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleReopenConversation(activeConversation.passenger_id)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-colors"
                                                >
                                                    <RotateCcw className="h-3.5 w-3.5" /> Reopen
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Messages Area */}
                                    <div className="flex-1 overflow-y-auto p-5 flex flex-col">
                                        {messagesLoading ? (
                                            <div className="flex items-center justify-center h-full flex-1">
                                                <div className="animate-spin h-8 w-8 border-2 border-indigo-300 border-t-transparent rounded-full" />
                                            </div>
                                        ) : messages.length === 0 ? (
                                            <div className="flex items-center justify-center h-full flex-1 text-slate-400">
                                                <p>No messages in this conversation</p>
                                            </div>
                                        ) : (
                                            <div className="mt-auto space-y-3 pb-1">
                                                {messages.map((msg, i) => {
                                                    const isAdmin = msg.sender === 'admin';
                                                    const showDate = i === 0 || new Date(messages[i - 1].timestamp).toDateString() !== new Date(msg.timestamp).toDateString();
                                                    return (
                                                        <div key={msg.id}>
                                                            {showDate && (
                                                                <div className="flex items-center justify-center my-4">
                                                                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-medium text-slate-400 shadow-sm">
                                                                        {new Date(msg.timestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                                                <div className={`max-w-[75%] ${isAdmin ? 'order-2' : 'order-1'}`}>
                                                                    <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isAdmin
                                                                        ? 'bg-indigo-600 text-white rounded-br-sm'
                                                                        : 'bg-white text-slate-800 rounded-bl-sm border border-slate-200 shadow-sm'
                                                                        }`}>
                                                                        {msg.text}
                                                                    </div>
                                                                    <p className={`text-[10px] mt-1 ${isAdmin ? 'text-right text-slate-400' : 'text-slate-400'}`}>
                                                                        {isAdmin && <span className="font-medium text-indigo-400 mr-1">Admin</span>}
                                                                        {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <div ref={messagesEndRef} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Reply Area */}
                                    <div className="bg-white border-t border-slate-200 p-4 flex-shrink-0">
                                        {/* Quick Responses Panel */}
                                        {showQuickResponses && (
                                            <div className="mb-3 bg-slate-50 rounded-xl border border-slate-200 p-3 max-h-48 overflow-y-auto">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Quick Replies</h4>
                                                    <button onClick={() => setShowQuickResponses(false)} className="text-slate-400 hover:text-slate-600">
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                                <div className="grid gap-1.5">
                                                    {quickResponses.filter(r => r.active).map(r => (
                                                        <button
                                                            key={r.id}
                                                            onClick={() => handleUseQuickResponse(r)}
                                                            className="text-left p-2.5 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${getCategoryColor(r.category)}`}>
                                                                    {r.category}
                                                                </span>
                                                                <span className="text-xs font-semibold text-slate-800">{r.title}</span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{r.message}</p>
                                                        </button>
                                                    ))}
                                                    {quickResponses.filter(r => r.active).length === 0 && (
                                                        <p className="text-xs text-slate-400 text-center py-2">No quick replies configured</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-end gap-2">
                                            <button
                                                onClick={() => setShowQuickResponses(!showQuickResponses)}
                                                className={`h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl border transition-colors ${showQuickResponses ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200'}`}
                                                title="Quick Replies"
                                            >
                                                <Zap className="h-4 w-4" />
                                            </button>
                                            <div className="flex-1 relative">
                                                <textarea
                                                    value={replyText}
                                                    onChange={e => setReplyText(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSendReply();
                                                        }
                                                    }}
                                                    placeholder="Type your reply... (Enter to send, Shift+Enter for new line)"
                                                    rows={1}
                                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-300 resize-none transition-shadow"
                                                    style={{ minHeight: '42px', maxHeight: '120px' }}
                                                />
                                            </div>
                                            <button
                                                onClick={handleSendReply}
                                                disabled={sendingReply || !replyText.trim()}
                                                className="h-10 w-10 flex-shrink-0 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
                                            >
                                                {sendingReply ? (
                                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <Send className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                // Empty state
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="h-20 w-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <MessageSquare className="h-10 w-10 text-indigo-300" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-700">Select a conversation</h3>
                                        <p className="text-sm text-slate-400 mt-1">Choose a chat from the list to start responding</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ───── Templates Tab ───── */}
                {activeTab === 'templates' && (
                    <div className="flex-1 overflow-y-auto p-6 lg:p-10">
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                            <Zap className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900">Quick Reply Templates</h2>
                                            <p className="text-sm text-slate-500">Pre-defined responses for fast passenger support</p>
                                        </div>
                                    </div>
                                    {!showTemplateForm && (
                                        <button
                                            onClick={() => {
                                                setShowTemplateForm(true);
                                                setEditingTemplate(null);
                                                setTemplateForm({ title: '', message: '', category: 'general' });
                                            }}
                                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-all active:scale-95"
                                        >
                                            <Plus className="h-4 w-4" /> Add Template
                                        </button>
                                    )}
                                </div>

                                {/* Template Form */}
                                {showTemplateForm && (
                                    <div className="p-6 bg-slate-50 border-b border-slate-200">
                                        <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                            {editingTemplate ? <Pencil className="h-4 w-4 text-indigo-500" /> : <Plus className="h-4 w-4 text-indigo-500" />}
                                            {editingTemplate ? 'Edit Template' : 'New Template'}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Title</label>
                                                <input
                                                    type="text"
                                                    value={templateForm.title}
                                                    onChange={e => setTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                                                    placeholder="e.g. Welcome Message"
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Category</label>
                                                <select
                                                    value={templateForm.category}
                                                    onChange={e => setTemplateForm(prev => ({ ...prev, category: e.target.value }))}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                                >
                                                    {CATEGORIES.map(c => (
                                                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Response Message</label>
                                            <textarea
                                                rows={3}
                                                value={templateForm.message}
                                                onChange={e => setTemplateForm(prev => ({ ...prev, message: e.target.value }))}
                                                placeholder="Type the default response message..."
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                                            />
                                        </div>
                                        <div className="flex items-center gap-3 mt-5">
                                            <button
                                                onClick={handleSaveTemplate}
                                                disabled={savingTemplate}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm disabled:opacity-60 transition-all active:scale-95"
                                            >
                                                {savingTemplate ? (
                                                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                                ) : (
                                                    <Check className="h-4 w-4" />
                                                )}
                                                {savingTemplate ? 'Saving...' : editingTemplate ? 'Update' : 'Save Template'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowTemplateForm(false);
                                                    setEditingTemplate(null);
                                                    setTemplateForm({ title: '', message: '', category: 'general' });
                                                }}
                                                className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Templates List */}
                                {quickResponses.length === 0 ? (
                                    <div className="p-10 text-center">
                                        <Zap className="h-12 w-12 mx-auto text-slate-200 mb-3" />
                                        <p className="text-slate-500 font-medium">No quick reply templates yet</p>
                                        <p className="text-sm text-slate-400 mt-1">Create templates to speed up passenger responses.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {quickResponses.map(t => (
                                            <div key={t.id} className="p-5 flex items-start gap-4 group hover:bg-slate-50 transition-colors">
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getCategoryColor(t.category)}`}>
                                                    <Zap className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-semibold text-slate-900 text-sm">{t.title}</h4>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getCategoryColor(t.category)}`}>
                                                            {t.category}
                                                        </span>
                                                        {!t.active && (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-200 text-slate-500">
                                                                Disabled
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{t.message}</p>
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    {deletingTemplateId === t.id ? (
                                                        <div className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                                                            <span className="text-xs font-medium text-rose-700">Delete?</span>
                                                            <button
                                                                onClick={() => handleDeleteTemplate(t.id)}
                                                                className="p-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
                                                            >
                                                                <Check className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeletingTemplateId(null)}
                                                                className="p-1 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => startEditTemplate(t)}
                                                                className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeletingTemplateId(t.id)}
                                                                className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

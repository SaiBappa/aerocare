import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Pencil, Trash2, Check, X, Shield, Lock, UserX, UserCheck } from 'lucide-react';
import { supabase } from '../supabase';

interface AppUser {
    id: string;
    email: string;
    display_name: string;
    role: 'staff' | 'dashboard' | 'admin' | 'stakeholder';
    active: number;
}

export default function UserManagement() {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        display_name: '',
        role: 'staff' as const,
    });

    const fetchUsers = useCallback(async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            setUsers(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Auto-dismiss success message
    useEffect(() => {
        if (successMsg) {
            const timer = setTimeout(() => setSuccessMsg(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMsg]);

    const handleSubmit = async () => {
        if (!formData.email || !formData.display_name || (!editingId && !formData.password)) {
            setError('Please fill all required fields');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const url = editingId ? `/api/admin/users/${editingId}` : '/api/admin/users';
            const method = editingId ? 'PUT' : 'POST';
            const { data: { session } } = await supabase.auth.getSession();

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error || 'Failed to save user');
            }

            setSuccessMsg(editingId ? 'User updated' : 'User created');
            setShowForm(false);
            setEditingId(null);
            setFormData({ email: '', password: '', display_name: '', role: 'staff' });
            fetchUsers();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (user: AppUser) => {
        try {
            const newStatus = user.active === 1 ? 0 : 1;
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ active: newStatus }),
            });
            if (!res.ok) throw new Error('Failed to update status');
            setSuccessMsg(`User ${newStatus === 1 ? 'activated' : 'suspended'}`);
            fetchUsers();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to permanently delete this user?')) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error || 'Failed to delete');
            }
            setSuccessMsg('User deleted');
            fetchUsers();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const openEdit = (user: AppUser) => {
        setEditingId(user.id);
        setFormData({
            email: user.email,
            password: '', // blank unless they want to reset it
            display_name: user.display_name,
            role: user.role,
        });
        setShowForm(true);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Users className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">User Management</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Manage system access, roles, and status</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ email: '', password: '', display_name: '', role: 'staff' });
                        setShowForm(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
                >
                    <Plus className="h-4 w-4" /> Add User
                </button>
            </div>

            {error && (
                <div className="mx-6 mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex justify-between items-center">
                    <span className="font-medium text-sm">{error}</span>
                    <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
                </div>
            )}
            {successMsg && (
                <div className="mx-6 mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-medium text-sm">
                    {successMsg}
                </div>
            )}

            {showForm && (
                <div className="mx-6 my-4 p-5 bg-blue-50 border border-blue-200 rounded-xl">
                    <h3 className="font-semibold text-blue-900 text-sm mb-4">
                        {editingId ? 'Edit User' : 'Create New User'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Display Name *</label>
                            <input
                                type="text"
                                value={formData.display_name}
                                onChange={e => setFormData({ ...formData, display_name: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Role *</label>
                            <select
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white"
                            >
                                <option value="staff">Staff</option>
                                <option value="dashboard">Dashboard</option>
                                <option value="admin">Admin</option>
                                <option value="stakeholder">Stakeholder</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                {editingId ? 'Reset Password (optional)' : 'Password *'}
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="p-12 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500 border-y border-slate-200">
                                <th className="py-3 px-6 font-semibold">User</th>
                                <th className="py-3 px-6 font-semibold">Role</th>
                                <th className="py-3 px-6 font-semibold">Status</th>
                                <th className="py-3 px-6 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(user => (
                                <tr key={user.id} className={`hover:bg-slate-50/50 transition-colors ${user.active === 0 ? 'opacity-75' : ''}`}>
                                    <td className="py-4 px-6">
                                        <div className="font-semibold text-slate-900">{user.display_name}</div>
                                        <div className="text-xs text-slate-500">{user.email}</div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider
                                            ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                user.role === 'dashboard' ? 'bg-amber-100 text-amber-700' :
                                                    user.role === 'stakeholder' ? 'bg-indigo-100 text-indigo-700' :
                                                        'bg-blue-100 text-blue-700'}`}>
                                            <Shield className="h-3 w-3" />
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        {user.active === 1 ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                                <Check className="h-3 w-3" /> Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                                                <X className="h-3 w-3" /> Suspended
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleToggleStatus(user)}
                                                className={`p-1.5 rounded-lg transition-colors ${user.active === 1 ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                                title={user.active === 1 ? 'Suspend User' : 'Activate User'}
                                            >
                                                {user.active === 1 ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                            </button>
                                            <button
                                                onClick={() => openEdit(user)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-slate-500">
                                        No users found. Server configuration might be missing.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

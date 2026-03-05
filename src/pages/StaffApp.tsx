import React, { useState, useEffect } from 'react';
import { UserPlus, QrCode, CheckCircle, AlertCircle, MapPin, ArrowRight, UserCheck, Search, Globe, Shield, LogOut, Users, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

interface Companion {
  type: 'adult' | 'child';
  nationality: string;
  passport_number: string;
}

export default function StaffApp() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const [activeTab, setActiveTab] = useState<'register' | 'assist'>('register');
  const [events, setEvents] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [nationalities, setNationalities] = useState<string[]>([]);
  const [airlines, setAirlines] = useState<string[]>([]);
  const [destinations, setDestinations] = useState<string[]>([]);

  // Registration State
  const [formData, setFormData] = useState({
    event_id: '',
    name: '',
    nationality: '',
    departure_airline: '',
    departure_date: '',
    final_destination: '',
    passport_number: '',
    location_id: ''
  });
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Companion state
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [showCompanionSection, setShowCompanionSection] = useState(false);

  // Assistance State
  const [assistData, setAssistData] = useState({
    nationality: '',
    passport_number: '',
    action: 'checkin' as 'checkin' | 'checkout',
    location_id: ''
  });
  const [assistMessage, setAssistMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const addCompanion = (type: 'adult' | 'child') => {
      setCompanions(prev => [...prev, { type, nationality: '', passport_number: '' }]);
      setShowCompanionSection(true);
  };

  const removeCompanion = (index: number) => {
      setCompanions(prev => prev.filter((_, i) => i !== index));
  };

  const updateCompanion = (index: number, field: keyof Companion, value: string) => {
      setCompanions(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
      if (error) setError('');
  };

  const adultCount = companions.filter(c => c.type === 'adult').length;
  const childCount = companions.filter(c => c.type === 'child').length;
  const totalGroup = 1 + companions.length;

  const updateAssistField = (field: string, value: any) => {
    setAssistData(prev => ({ ...prev, [field]: value }));
    if (assistMessage) setAssistMessage(null);
  };

  useEffect(() => {
    fetch('/api/events').then(res => res.json()).then(data => {
      setEvents(data);
      if (data.length > 0) setFormData(prev => ({ ...prev, event_id: data[0].id }));
    }).catch(err => {
      console.error('Failed to fetch events:', err);
    });
    fetch('/api/locations').then(res => res.json()).then(data => {
      setLocations(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, location_id: data[0].id }));
        setAssistData(prev => ({ ...prev, location_id: data[0].id }));
      }
    }).catch(err => {
      console.error('Failed to fetch locations:', err);
    });
    fetch('/api/dropdown-options').then(res => res.json()).then(data => {
      setNationalities(data.nationality || []);
      setAirlines(data.airline || []);
      setDestinations(data.destination || []);
    }).catch(err => {
      console.error('Failed to fetch dropdown options:', err);
    });
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Full name is required');
      return;
    }
    if (!formData.departure_date) {
      setError('Date of departure is required');
      return;
    }
    if (!formData.departure_airline) {
      setError('Departure airline is required');
      return;
    }
    if (!formData.final_destination) {
      setError('Final destination is required');
      return;
    }
    if (!formData.nationality) {
      setError('Nationality is required');
      return;
    }
    if (!formData.passport_number.trim()) {
      setError('Passport number is required');
      return;
    }

    // Validate companions
    for (let i = 0; i < companions.length; i++) {
        const c = companions[i];
        if (!c.nationality) {
            setError(`Nationality is required for companion ${i + 1}`);
            return;
        }
        if (!c.passport_number.trim()) {
            setError(`Passport number is required for companion ${i + 1}`);
            return;
        }
    }

    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/passengers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          companions: companions.length > 0 ? companions : undefined
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setRegSuccess(data.qr_token);
        setFormData({
          ...formData,
          name: '',
          nationality: '',
          departure_airline: '',
          departure_date: '',
          final_destination: '',
          passport_number: ''
        });
        setCompanions([]);
        setShowCompanionSection(false);
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error('Registration error:', err);
      }
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistData.nationality || !assistData.passport_number || !assistData.location_id) {
      setAssistMessage({ type: 'error', text: 'All fields are required' });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/staff/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assistData)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setAssistMessage({ type: 'success', text: `${data.message} (${data.passenger.name})` });
        setAssistData(prev => ({ ...prev, passport_number: '' }));
      } else {
        setAssistMessage({ type: 'error', text: data.error || 'Action failed' });
      }
    } catch (err) {
      setAssistMessage({ type: 'error', text: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-indigo-600 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield className="h-5 w-5" /> Staff Portal
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-indigo-200 hover:text-white text-sm transition-colors"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto">
        {activeTab === 'register' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-indigo-500" />
              Register Passenger
            </h2>

            {regSuccess && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-emerald-800 font-medium">Registration Successful!</p>
                <div className="mt-3">
                  <Link
                    to={`/passenger/${regSuccess}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
                  >
                    Open Passenger App <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-3 text-sm">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {/* Event (Staff-only) */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Event</label>
                <select
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-slate-50 border appearance-none"
                  value={formData.event_id}
                  onChange={e => updateField('event_id', e.target.value)}
                  required
                >
                  {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>

              {/* 1. Full Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  1. Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => updateField('name', e.target.value)}
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-slate-50 border"
                  placeholder="Enter full name"
                  required
                />
              </div>

              {/* 2. Date of Departure */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  2. Date of Departure <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.departure_date}
                  onChange={e => updateField('departure_date', e.target.value)}
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-slate-50 border"
                  required
                />
              </div>

              {/* 3. Departure Airline */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  3. Departure Airline <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.departure_airline}
                  onChange={e => updateField('departure_airline', e.target.value)}
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-slate-50 border appearance-none"
                  required
                >
                  <option value="">Select airline</option>
                  {airlines.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* 4. Final Destination */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  4. Final Destination <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.final_destination}
                  onChange={e => updateField('final_destination', e.target.value)}
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-slate-50 border appearance-none"
                  required
                >
                  <option value="">Select destination</option>
                  {destinations.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Passport Details */}
              <div className="pt-2">
                <div className="border-t border-slate-200 pt-5">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1">
                    <UserPlus className="h-4 w-4 text-indigo-500" />
                    Passport Details
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">Credentials for automatic login</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  5. Nationality <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.nationality}
                  onChange={e => updateField('nationality', e.target.value)}
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-slate-50 border appearance-none"
                  required
                >
                  <option value="">Select country</option>
                  {nationalities.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  6. Passport Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.passport_number}
                  onChange={e => updateField('passport_number', e.target.value)}
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-slate-50 border"
                  placeholder="e.g. A12345678"
                  required
                />
              </div>

              {/* ──── Travelling Companions Section ──── */}
              <div className="pt-2">
                  <div className="border-t border-slate-200 pt-5">
                      <button
                          type="button"
                          onClick={() => setShowCompanionSection(!showCompanionSection)}
                          className="w-full flex items-center justify-between text-left"
                      >
                          <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-indigo-500" />
                              <h3 className="text-sm font-semibold text-slate-700">
                                  Travelling Companions
                              </h3>
                              {companions.length > 0 && (
                                  <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                      {companions.length}
                                  </span>
                              )}
                          </div>
                          {showCompanionSection ? (
                              <ChevronUp className="h-4 w-4 text-slate-400" />
                          ) : (
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                          )}
                      </button>
                      <p className="text-xs text-slate-500 mt-1">Add adults or children travelling with the passenger. Only nationality and passport are needed.</p>
                  </div>
              </div>

              {showCompanionSection && (
                  <div className="space-y-4">
                      {/* Quick add buttons */}
                      <div className="flex gap-3 mt-4">
                          <button
                              type="button"
                              onClick={() => addCompanion('adult')}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-indigo-700 text-sm font-medium transition-colors"
                          >
                              <Plus className="h-4 w-4" />
                              Add Adult
                          </button>
                          <button
                              type="button"
                              onClick={() => addCompanion('child')}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-amber-700 text-sm font-medium transition-colors"
                          >
                              <Plus className="h-4 w-4" />
                              Add Child
                          </button>
                      </div>

                      {/* Group summary badge */}
                      {companions.length > 0 && (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2 text-slate-600 text-sm">
                                  <Users className="h-4 w-4" />
                                  <span>Group Size: <strong className="text-slate-900">{totalGroup}</strong></span>
                              </div>
                              <div className="flex gap-2 text-xs">
                                  {adultCount > 0 && (
                                      <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                                          {adultCount} Adults
                                      </span>
                                  )}
                                  {childCount > 0 && (
                                      <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                          {childCount} Children
                                      </span>
                                  )}
                              </div>
                          </div>
                      )}

                      {/* Companion cards */}
                      {companions.map((companion, index) => (
                          <div
                              key={index}
                              className={`rounded-xl border p-4 space-y-3 ${companion.type === 'child'
                                  ? 'bg-amber-50/50 border-amber-200'
                                  : 'bg-indigo-50/50 border-indigo-200'
                                  }`}
                          >
                              <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${companion.type === 'child'
                                          ? 'bg-amber-200 text-amber-800'
                                          : 'bg-indigo-200 text-indigo-800'
                                          }`}>
                                          {companion.type === 'child' ? 'Child' : 'Adult'} #{
                                              companion.type === 'child'
                                                  ? companions.filter((c, i) => i <= index && c.type === 'child').length
                                                  : companions.filter((c, i) => i <= index && c.type === 'adult').length
                                          }
                                      </span>
                                  </div>
                                  <button
                                      type="button"
                                      onClick={() => removeCompanion(index)}
                                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                      title="Remove"
                                  >
                                      <Trash2 className="h-4 w-4" />
                                  </button>
                              </div>

                              <div>
                                  <label className="block text-xs font-medium text-slate-600 mb-1">
                                      Nationality <span className="text-red-500">*</span>
                                  </label>
                                  <select
                                      value={companion.nationality}
                                      onChange={e => updateCompanion(index, 'nationality', e.target.value)}
                                      className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 bg-white border text-sm appearance-none"
                                  >
                                      <option value="">Select country</option>
                                      {nationalities.map(n => (
                                          <option key={n} value={n}>{n}</option>
                                      ))}
                                  </select>
                              </div>

                              <div>
                                  <label className="block text-xs font-medium text-slate-600 mb-1">
                                      Passport Number <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                      type="text"
                                      value={companion.passport_number}
                                      onChange={e => updateCompanion(index, 'passport_number', e.target.value)}
                                      className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 bg-white border text-sm"
                                      placeholder="e.g. A12345678"
                                  />
                              </div>
                          </div>
                      ))}

                      {companions.length === 0 && (
                          <div className="text-center py-4 text-sm text-slate-400">
                              No companions added yet
                          </div>
                      )}
                  </div>
              )}

              {/* Location Assignment */}
              <div className="pt-2">
                <div className="border-t border-slate-200 pt-5">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-indigo-500" />
                    Initial Location
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">Assign to a zone during registration</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Assign Location <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-slate-50 border appearance-none"
                  value={formData.location_id}
                  onChange={e => updateField('location_id', e.target.value)}
                  required
                >
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Registering...' : 'Register & Generate QR'}
                {!loading && <ArrowRight className="h-5 w-5" />}
              </button>
            </form>
          </div>
        )}

        {/* Assistance Tab */}
        {activeTab === 'assist' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Staff Assistance</h2>
                  <p className="text-sm text-slate-500">Manual lookup & check-in/out</p>
                </div>
              </div>

              {assistMessage && (
                <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 border animate-in slide-in-from-top-2 duration-300 ${assistMessage.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                  {assistMessage.type === 'success' ? <CheckCircle className="h-5 w-5 mt-0.5 shrink-0" /> : <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />}
                  <div>
                    <p className="text-sm font-bold">{assistMessage.type === 'success' ? 'Action Completed' : 'Lookup Failed'}</p>
                    <p className="text-xs mt-1 opacity-90">{assistMessage.text}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleAssist} className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateAssistField('action', 'checkin')}
                    className={`py-4 px-3 rounded-2xl text-sm font-black flex flex-col items-center gap-2 transition-all border-2 ${assistData.action === 'checkin' ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 border-slate-100'}`}
                  >
                    <MapPin className="h-5 w-5" /> CHECK-IN
                  </button>
                  <button
                    type="button"
                    onClick={() => updateAssistField('action', 'checkout')}
                    className={`py-4 px-3 rounded-2xl text-sm font-black flex flex-col items-center gap-2 transition-all border-2 ${assistData.action === 'checkout' ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 border-slate-100'}`}
                  >
                    <ArrowRight className="h-5 w-5" /> CHECK-OUT
                  </button>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="relative group">
                    <label className="absolute -top-2.5 left-4 px-1.5 bg-white text-[10px] font-black text-indigo-500 tracking-wider uppercase">Passenger Nationality</label>
                    <div className="relative">
                      <select
                        value={assistData.nationality}
                        onChange={e => updateAssistField('nationality', e.target.value)}
                        className="w-full rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 p-4 pl-11 bg-slate-50/50 appearance-none font-semibold text-slate-700"
                        required
                      >
                        <option value="">Select country...</option>
                        {nationalities.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    </div>
                  </div>

                  <div className="relative group">
                    <label className="absolute -top-2.5 left-4 px-1.5 bg-white text-[10px] font-black text-indigo-500 tracking-wider uppercase">Passport Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={assistData.passport_number}
                        onChange={e => updateAssistField('passport_number', e.target.value.toUpperCase())}
                        className="w-full rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 p-4 pl-11 bg-slate-50/50 font-semibold text-slate-700 placeholder:text-slate-300"
                        placeholder="E.G. A12345678"
                        required
                      />
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    </div>
                  </div>

                  <div className="relative group">
                    <label className="absolute -top-2.5 left-4 px-1.5 bg-white text-[10px] font-black text-slate-400 tracking-wider uppercase">Current Location</label>
                    <select
                      className="w-full rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 p-4 bg-slate-50/50 appearance-none font-semibold text-slate-700"
                      value={assistData.location_id}
                      onChange={e => updateAssistField('location_id', e.target.value)}
                      required
                    >
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:bg-indigo-300 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 mt-4 tracking-widest uppercase"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Verify & Process
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest px-8">
              Verify identification before processing manual entry or exit records.
            </p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-lg border-t border-slate-200 pb-safe z-20">
        <div className="flex max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${activeTab === 'register' ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-400'}`}
          >
            <UserPlus className="h-6 w-6" />
            <span className="text-[10px] font-black uppercase tracking-tighter">Register</span>
          </button>
          <button
            onClick={() => setActiveTab('assist')}
            className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${activeTab === 'assist' ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-400'}`}
          >
            <UserCheck className="h-6 w-6" />
            <span className="text-[10px] font-black uppercase tracking-tighter">Assistance</span>
          </button>
        </div>
      </div>
    </div>
  );
}

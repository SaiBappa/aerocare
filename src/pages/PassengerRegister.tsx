import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, AlertCircle, CheckCircle, UserPlus, Users, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../i18n/LanguageSwitcher';

interface Companion {
    type: 'adult' | 'child';
    nationality: string;
    passport_number: string;
}

export default function PassengerRegister() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { t, rtl } = useLanguage();

    const [nationalities, setNationalities] = useState<string[]>([]);
    const [airlines, setAirlines] = useState<string[]>([]);
    const [destinations, setDestinations] = useState<string[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        nationality: '',
        departure_airline: '',
        departure_date: '',
        final_destination: '',
        passport_number: '',
    });

    // Companion state
    const [companions, setCompanions] = useState<Companion[]>([]);
    const [showCompanionSection, setShowCompanionSection] = useState(false);
    const [agreeToTerms, setAgreeToTerms] = useState(false);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const res = await fetch('/api/dropdown-options');
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }
                const data = await res.json();
                setNationalities(data.nationality || []);
                setAirlines(data.airline || []);
                setDestinations(data.destination || []);
            } catch (err) {
                console.error('Failed to load dropdown options:', err);
            } finally {
                setOptionsLoading(false);
            }
        };
        fetchOptions();
    }, []);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) { setError(t('nameRequired')); return; }
        if (!formData.nationality) { setError(t('nationalityRequired')); return; }
        if (!formData.departure_airline) { setError(t('airlineRequired')); return; }
        if (!formData.departure_date) { setError(t('dateRequired')); return; }
        if (!formData.final_destination) { setError(t('destRequired')); return; }
        if (!formData.passport_number.trim()) { setError(t('passportRequired')); return; }
        if (!agreeToTerms) { setError(t('agreeRequired') || 'You must agree to the data sharing terms to register.'); return; }

        // Validate companions
        for (let i = 0; i < companions.length; i++) {
            const c = companions[i];
            if (!c.nationality) {
                setError(t('companionNationalityRequired').replace('{n}', String(i + 1)));
                return;
            }
            if (!c.passport_number.trim()) {
                setError(t('companionPassportRequired').replace('{n}', String(i + 1)));
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
                    companions: companions.length > 0 ? companions : undefined,
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                localStorage.setItem('aerocare_passenger_token', data.qr_token);

                const pendingScan = sessionStorage.getItem('pending_scan_code');
                if (pendingScan) {
                    sessionStorage.removeItem('pending_scan_code');
                    navigate(`/s/${pendingScan}`);
                } else {
                    navigate('/passenger');
                }
            } else {
                setError(data.error || t('registrationFailed'));
            }
        } catch (err) {
            if (err instanceof Error) {
                console.error('Registration error:', err);
            }
            setError(t('networkError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4 ${rtl ? 'text-right' : ''}`} dir={rtl ? 'rtl' : 'ltr'}>
            {/* Language Switcher - Top Right */}
            <div className="fixed top-4 right-4 z-50">
                <div className="bg-indigo-600 rounded-full">
                    <LanguageSwitcher variant="icon" />
                </div>
            </div>

            <div className="max-w-md w-full space-y-6">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto h-20 w-20 rounded-2xl flex items-center justify-center shadow-lg mb-4 overflow-hidden">
                        <img src="/favicon.png" alt={t('logoAlt')} className="h-full w-full object-cover" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('regTitle')}</h1>
                    <p className="mt-2 text-md text-slate-600">{t('regSubtitle')}</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-3 text-sm">
                                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}

                        {/* 1. Full Name */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                1. {t('fullName')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="input-full-name"
                                type="text"
                                value={formData.name}
                                onChange={e => updateField('name', e.target.value)}
                                className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-slate-50 border"
                                placeholder={t('enterAnswer')}
                                required
                            />
                        </div>

                        {/* 2. Date of Departure */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                2. {t('departureDate')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="input-departure-date"
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
                                3. {t('departureAirline')} <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="select-departure-airline"
                                value={formData.departure_airline}
                                onChange={e => updateField('departure_airline', e.target.value)}
                                className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-slate-50 border appearance-none"
                                required
                            >
                                <option value="">{t('selectAnswer')}</option>
                                {airlines.map(a => (
                                    <option key={a} value={a}>{a}</option>
                                ))}
                            </select>
                        </div>

                        {/* 4. Final Destination */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                4. {t('finalDestination')} <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="select-final-destination"
                                value={formData.final_destination}
                                onChange={e => updateField('final_destination', e.target.value)}
                                className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-slate-50 border appearance-none"
                                required
                            >
                                <option value="">{t('selectAnswer')}</option>
                                {destinations.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>

                        {/* Passport Details Section - Used for Login */}
                        <div className="pt-2">
                            <div className="border-t border-slate-200 pt-5">
                                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1">
                                    <UserPlus className="h-4 w-4 text-indigo-500" />
                                    {t('passportDetails')}
                                </h3>
                                <p className="text-xs text-slate-500 mb-4">{t('passportUsage')}</p>
                            </div>
                        </div>

                        {/* 5. Nationality */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                5. {t('nationality')} <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="select-nationality"
                                value={formData.nationality}
                                onChange={e => updateField('nationality', e.target.value)}
                                className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-slate-50 border appearance-none"
                                required
                            >
                                <option value="">{t('selectAnswer')}</option>
                                {nationalities.map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>

                        {/* 6. Passport Number */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                6. {t('passportNumber')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="input-passport-number"
                                type="text"
                                value={formData.passport_number}
                                onChange={e => updateField('passport_number', e.target.value)}
                                className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-slate-50 border"
                                placeholder={t('passportPlaceholder')}
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
                                            {t('travellingCompanions')}
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
                                <p className="text-xs text-slate-500 mt-1">{t('companionHint')}</p>
                            </div>
                        </div>

                        {showCompanionSection && (
                            <div className="space-y-4">
                                {/* Quick add buttons */}
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => addCompanion('adult')}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-indigo-700 text-sm font-medium transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                        {t('addAdult')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => addCompanion('child')}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-amber-700 text-sm font-medium transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                        {t('addChild')}
                                    </button>
                                </div>

                                {/* Group summary badge */}
                                {companions.length > 0 && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-600 text-sm">
                                            <Users className="h-4 w-4" />
                                            <span>{t('groupSize')}: <strong className="text-slate-900">{totalGroup}</strong></span>
                                        </div>
                                        <div className="flex gap-2 text-xs">
                                            {adultCount > 0 && (
                                                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                                                    {adultCount} {t('adults')}
                                                </span>
                                            )}
                                            {childCount > 0 && (
                                                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                                    {childCount} {t('children')}
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
                                                    {companion.type === 'child' ? t('child') : t('adult')} #{
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
                                                title={t('remove')}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                                {t('nationality')} <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={companion.nationality}
                                                onChange={e => updateCompanion(index, 'nationality', e.target.value)}
                                                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 bg-white border text-sm appearance-none"
                                            >
                                                <option value="">{t('selectAnswer')}</option>
                                                {nationalities.map(n => (
                                                    <option key={n} value={n}>{n}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                                {t('passportNumber')} <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={companion.passport_number}
                                                onChange={e => updateCompanion(index, 'passport_number', e.target.value)}
                                                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 bg-white border text-sm"
                                                placeholder={t('companionPassportPlaceholder')}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {companions.length === 0 && (
                                    <div className="text-center py-4 text-sm text-slate-400">
                                        {t('noCompanionsYet')}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Terms and Conditions Consent */}
                        <div className="pt-4 pb-2 border-t border-slate-200 mt-6">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={agreeToTerms}
                                    onChange={e => {
                                        setAgreeToTerms(e.target.checked);
                                        if (error) setError('');
                                    }}
                                    className="mt-1 h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    required
                                />
                                <div className="text-sm text-slate-600 leading-tight">
                                    <p className="font-medium text-slate-700">{t('agreeTerms')}</p>
                                    <p className="text-xs mt-1 text-slate-500">{t('agreeTermsSub')}</p>
                                </div>
                            </label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                    {t('registering')}
                                </>
                            ) : (
                                <>
                                    {t('completeReg')}
                                    {companions.length > 0 && ` (${totalGroup} ${t('people')})`}
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Links */}
                <div className="text-center space-y-2">
                    <p className="text-sm text-slate-600">
                        {t('alreadyRegistered')}{' '}
                        <Link to="/passenger/login" className="text-indigo-600 hover:underline font-medium">
                            {t('loginHere')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

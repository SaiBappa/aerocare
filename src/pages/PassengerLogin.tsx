import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../i18n/LanguageSwitcher';

export default function PassengerLogin() {
    const [nationality, setNationality] = useState('');
    const [passportNumber, setPassportNumber] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [nationalities, setNationalities] = useState<string[]>([]);
    const navigate = useNavigate();
    const { t, rtl } = useLanguage();

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const res = await fetch('/api/dropdown-options');
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }
                const data = await res.json();
                setNationalities(data.nationality || []);
            } catch (err) {
                console.error('Failed to load dropdown options:', err);
            }
        };
        fetchOptions();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nationality || !passportNumber.trim()) {
            setError(t('loginError'));
            return;
        }

        try {
            setLoading(true);
            setError('');
            const res = await fetch('/api/passengers/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nationality: nationality,
                    passport_number: passportNumber.trim()
                })
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
                setError(data.error || t('invalidCredentials'));
            }
        } catch (err) {
            if (err instanceof Error) {
                console.error('Login error:', err);
            }
            setError(t('networkError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 ${rtl ? 'text-right' : ''}`} dir={rtl ? 'rtl' : 'ltr'}>
            {/* Language Switcher - Top Right */}
            <div className="fixed top-4 right-4 z-50">
                <div className="bg-indigo-600 rounded-full">
                    <LanguageSwitcher variant="icon" />
                </div>
            </div>

            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-20 w-20 rounded-2xl flex items-center justify-center shadow-lg mb-6 overflow-hidden">
                        <img src="/favicon.png" alt={t('logoAlt')} className="h-full w-full object-cover" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t('loginTitle')}</h1>
                    <p className="mt-3 text-md text-slate-600">{t('loginSubtitle')}</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-3 text-sm">
                                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('nationality')}</label>
                            <select
                                value={nationality}
                                onChange={e => setNationality(e.target.value)}
                                className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-slate-50 border appearance-none"
                                required
                            >
                                <option value="">{t('selectAnswer')}</option>
                                {nationalities.map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('passportNumber')}</label>
                            <input
                                type="text"
                                value={passportNumber}
                                onChange={e => setPassportNumber(e.target.value)}
                                className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-slate-50 border"
                                placeholder={t('passportPlaceholder')}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-medium shadow-sm transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? t('verifying') : t('loginTitle')}
                                {!loading && <ArrowRight className="h-5 w-5" />}
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/passenger/register')}
                                className="w-full py-3 px-4 bg-white border-2 border-slate-200 hover:border-indigo-600 hover:bg-slate-50 text-slate-700 hover:text-indigo-600 rounded-xl font-medium shadow-sm transition-all flex items-center justify-center"
                            >
                                {t('registerHere')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

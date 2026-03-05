import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plane, LogIn, UserPlus, QrCode, ScanLine, LogOut, Shield, Clock, CheckCircle, AlertCircle, Camera, X, Users } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../i18n/LanguageSwitcher';
import QRCodeSVG from 'react-qr-code';
import { Html5Qrcode } from 'html5-qrcode';

interface PassengerSession {
    qr_token: string;
    name: string;
    nationality?: string;
    country?: string;
    companion_adults?: number;
    companion_children?: number;
    flight_number: string;
    status: string;
    checked_in: boolean;
    last_checkin_time?: string;
    qr_expiry_minutes?: number;
    qr_generated_at?: string;
    companions?: any[];
}

type ScanMode = 'none' | 'scanning';

export default function PassengerHome() {
    const navigate = useNavigate();
    const { t, rtl } = useLanguage();

    // Custom translate to handle fallbacks properly since t() returns the key if not found
    const tc = (key: string, fallback: string) => {
        const res = t(key);
        return res === key ? fallback : res;
    };

    // Session from localStorage
    const [session, setSession] = useState<PassengerSession | null>(null);
    const [loading, setLoading] = useState(true);

    // QR scanning
    const [scanMode, setScanMode] = useState<ScanMode>('none');
    const [scanResult, setScanResult] = useState<{
        success: boolean;
        message: string;
        type?: string;
        location?: string;
        passenger?: {
            name: string;
            passport_number: string;
            nationality: string;
            companions: any[];
        }
    } | null>(null);
    const [scanning, setScanning] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);



    // Check-in timer
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isExpired, setIsExpired] = useState(false);

    // Load session from localStorage
    useEffect(() => {
        const loadSession = async () => {
            const savedToken = localStorage.getItem('aerocare_passenger_token');
            if (!savedToken) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/passengers/${savedToken}`);
                if (!res.ok) {
                    throw new Error('Invalid session');
                }
                const data = await res.json();
                if (data.error) {
                    throw new Error(data.error);
                }

                setSession({
                    qr_token: data.qr_token,
                    name: data.name,
                    nationality: data.nationality || data.country,
                    country: data.country,
                    companion_adults: data.companion_adults || 0,
                    companion_children: data.companion_children || 0,
                    flight_number: data.flight_number || '',
                    status: data.status,
                    checked_in: data.status === 'checked-in',
                    last_checkin_time: data.last_checkin_time,
                    qr_expiry_minutes: data.qr_expiry_minutes,
                    qr_generated_at: data.qr_generated_at,
                    companions: data.companions || [],
                });

                // Check if we came back from ScanProcessor with a scan result
                const state = window.history.state?.usr;
                if (state && state.scanResult) {
                    setScanResult(state.scanResult);
                    // Clear the state so refreshing doesn't show the result again
                    window.history.replaceState({}, document.title);
                }

            } catch (err) {
                console.error('Failed to load passenger session:', err);
                localStorage.removeItem('aerocare_passenger_token');
            } finally {
                setLoading(false);
            }
        };

        loadSession();
    }, []);



    // QR countdown timer for check-in validity
    useEffect(() => {
        if (!session?.qr_generated_at || !session?.qr_expiry_minutes) return;

        const expiryMinutes = session.qr_expiry_minutes;
        const generatedAt = new Date(session.qr_generated_at).getTime();
        const expiresAt = generatedAt + expiryMinutes * 60 * 1000;

        const updateTimer = () => {
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
            setTimeLeft(remaining);
            setIsExpired(remaining <= 0);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [session?.qr_generated_at, session?.qr_expiry_minutes]);

    const formatCountdown = (seconds: number): string => {
        const days = Math.floor(seconds / 86400);
        const hrs = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (days > 0) {
            return `${days} Days ${hrs} Hours ${mins} Mins`;
        } else if (hrs > 0) {
            return `${hrs} Hours ${mins} Mins`;
        } else {
            return `${mins} Mins ${secs} Secs`;
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('aerocare_passenger_token');
        setSession(null);
        setScanResult(null);
    };

    // ── QR Scanner using camera ──
    const startScanner = useCallback(() => {
        setScanMode('scanning');
        setScanResult(null);
        setScanning(true);

        setTimeout(() => {
            try {
                if (!scannerRef.current) {
                    scannerRef.current = new Html5Qrcode('qr-reader');
                }

                scannerRef.current.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: undefined },
                    (decodedText: string) => {
                        if (scannerRef.current) {
                            scannerRef.current.pause(true); // Stop scanning temporarily
                        }
                        processScannedQR(decodedText);
                    },
                    (errorMessage: string) => {
                        // ignore background noise errors
                    }
                ).catch((err) => {
                    console.error('Camera start error:', err);
                    setScanResult({
                        success: false,
                        message: tc('cameraAccessDenied', 'Camera access denied')
                    });
                    setScanning(false);
                    setScanMode('none');
                });
            } catch (err) {
                console.error('Html5Qrcode init error:', err);
                setScanResult({
                    success: false,
                    message: tc('cameraAccessDenied', 'Camera access denied')
                });
                setScanning(false);
                setScanMode('none');
            }
        }, 150);
    }, []);

    const stopScanner = useCallback(() => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    scannerRef.current.stop().then(() => {
                        scannerRef.current?.clear();
                    }).catch((err) => console.error('Failed to stop scanner:', err));
                } else {
                    scannerRef.current.clear();
                }
            } catch (e) {
                console.error(e);
            }
        }
        setScanning(false);
        setScanMode('none');
    }, []);

    const processScannedQR = async (qrData: string) => {
        stopScanner();

        if (!session?.qr_token) return;

        // Ensure we only use the code itself, not the full URL if scanned with a generic scanner
        let building_qr_code = qrData;
        try {
            if (qrData.includes('/s/')) {
                const parts = qrData.split('/s/');
                building_qr_code = parts[parts.length - 1].split('?')[0].split('#')[0];
            }
        } catch (e) {
            console.error('Failed to parse URL code', e);
        }

        try {
            console.log('Sending scan to server...', { passenger_qr_token: session.qr_token, building_qr_code });
            const res = await fetch('/api/building/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    passenger_qr_token: session.qr_token,
                    building_qr_code: building_qr_code,
                }),
            });

            const data = await res.json();
            console.log('Scan response:', data);

            if (res.ok && data.success) {
                setScanResult({
                    success: true,
                    message: data.message,
                    type: data.type,
                    location: data.location,
                    passenger: data.passenger,
                });

                // Scroll to top immediately to show the clearance pass
                window.scrollTo(0, 0);

                // Refresh session data to update UI (banners, status)
                const sessionRes = await fetch(`/api/passengers/${session.qr_token}`);
                if (sessionRes.ok) {
                    const sessionData = await sessionRes.json();
                    console.log('Refreshing session with:', sessionData);
                    setSession({
                        ...session,
                        status: sessionData.status,
                        checked_in: sessionData.status === 'checked-in',
                        qr_generated_at: sessionData.qr_generated_at,
                        qr_expiry_minutes: sessionData.qr_expiry_minutes,
                    });
                }
            } else {
                console.warn('Scan rejected by server:', data);
                setScanResult({
                    success: false,
                    message: data.error || data.message || t('verificationFailed'),
                });
                window.scrollTo(0, 0);
            }
        } catch (err) {
            console.error('Scan processing error:', err);
            setScanResult({
                success: false,
                message: t('connectionError'),
            });
            window.scrollTo(0, 0);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                try {
                    if (scannerRef.current.isScanning) {
                        scannerRef.current.stop().catch(console.error);
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        };
    }, []);

    // ── Loading state ──
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <Plane className="h-12 w-12 text-indigo-400 mb-4" />
                    <p className="text-slate-500 font-medium">{t('loading')}</p>
                </div>
            </div>
        );
    }

    // ── NOT LOGGED IN ──
    if (!session) {
        return (
            <div className={`min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 flex flex-col items-center justify-center p-6 ${rtl ? 'text-right' : ''}`} dir={rtl ? 'rtl' : 'ltr'}>
                {/* Language Switcher */}
                <div className="fixed top-4 right-4 z-50">
                    <div className="bg-indigo-600 rounded-full">
                        <LanguageSwitcher variant="icon" />
                    </div>
                </div>

                <div className="max-w-sm w-full space-y-8">
                    {/* Logo & Brand */}
                    <div className="text-center">
                        <div className="mx-auto h-24 w-24 rounded-3xl flex items-center justify-center shadow-xl mb-6 overflow-hidden bg-white border border-slate-200">
                            <img src="/favicon.png" alt={t('logoAlt')} className="h-full w-full object-cover" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">AeroCare</h1>
                        <p className="mt-2 text-slate-600 text-sm leading-relaxed">
                            {t('passengerWelcome')}
                        </p>
                    </div>

                    {/* Action Cards */}
                    <div className="space-y-4">
                        {/* Register Card */}
                        <Link
                            to="/passenger/register"
                            className="group flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-indigo-300 transition-all active:scale-[0.98]"
                        >
                            <div className="h-14 w-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors flex-shrink-0">
                                <UserPlus className="h-7 w-7" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                                    {t('regTitle')}
                                </h3>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    {t('registerDesc')}
                                </p>
                            </div>
                            <div className="text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Link>

                        {/* Login Card */}
                        <Link
                            to="/passenger/login"
                            className="group flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-emerald-300 transition-all active:scale-[0.98]"
                        >
                            <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors flex-shrink-0">
                                <LogIn className="h-7 w-7" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                    {t('loginTitle')}
                                </h3>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    {t('loginDesc')}
                                </p>
                            </div>
                            <div className="text-slate-300 group-hover:text-emerald-500 transition-colors flex-shrink-0">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Link>
                    </div>

                    {/* Info Banner */}
                    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
                        <Shield className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-indigo-800 font-medium">
                                {t('secureAccess')}
                            </p>
                            <p className="text-xs text-indigo-600 mt-1 leading-relaxed">
                                {t('secureAccessDesc')}
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        );
    }

    // ── LOGGED IN ──
    return (
        <div className={`min-h-screen bg-slate-50 ${rtl ? 'text-right' : ''}`} dir={rtl ? 'rtl' : 'ltr'}>
            {/* Header */}
            <header className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-5 rounded-b-3xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl pointer-events-none"></div>
                <div className="relative z-10 flex items-center justify-between max-w-md mx-auto">
                    <div>
                        <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-0.5">{t('welcomeBack')}</p>
                        <h1 className="text-xl font-bold tracking-tight">{session.name}</h1>
                        {session.flight_number && (
                            <p className="text-indigo-200 flex items-center gap-1 mt-0.5 text-sm">
                                <Plane className="h-3.5 w-3.5" /> {session.flight_number}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <LanguageSwitcher variant="icon" />
                        <button
                            onClick={handleLogout}
                            className="h-10 w-10 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 hover:bg-white/25 transition-colors active:scale-95"
                            aria-label={t('logout')}
                            title={t('logout')}
                        >
                            <LogOut className="h-4.5 w-4.5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="p-4 max-w-md mx-auto mt-4 space-y-5 pb-8">
                {/* Scan Result */}
                {scanResult && (
                    <div className={`rounded-3xl overflow-hidden shadow-2xl border-0 ${scanResult.success
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-50 border-rose-200 border-2 p-5'
                        }`}
                        style={{ animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                        id="security-clearance-pass"
                    >
                        {scanResult.success ? (
                            <>
                                {/* Success Header / Clearance Banner */}
                                <div className={`${scanResult.type === 'checkout' ? 'bg-slate-700/80 hover:bg-slate-700/90' : 'bg-emerald-500/30'} p-6 flex flex-col items-center justify-center text-white text-center border-b border-white/10 transition-colors`}>
                                    <div className="bg-white rounded-full p-2 mb-3 shadow-lg shadow-black/10">
                                        <CheckCircle className={`h-10 w-10 ${scanResult.type === 'checkout' ? 'text-slate-700' : 'text-emerald-600'} animate-pulse`} />
                                    </div>
                                    <h3 className="font-black text-2xl uppercase tracking-widest">
                                        {scanResult.type === 'checkin' ? t('entryGranted') : scanResult.type === 'renewal' ? t('passRenewed') : t('exitGranted')}
                                    </h3>
                                    {scanResult.location && (
                                        <p className="text-sm mt-1 mb-1 font-semibold bg-white/20 px-3 py-1 rounded-xl">
                                            {scanResult.location}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-white/15 rounded-full backdrop-blur-sm border border-white/10">
                                        <Shield className="h-3 w-3" />
                                        <p className="text-[10px] font-bold uppercase tracking-tighter opacity-90">
                                            {t('securityVerified')} • {new Date().toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>

                                <div className={`p-6 space-y-6 ${scanResult.type === 'checkout' ? 'bg-slate-800' : ''}`}>
                                    {/* Primary Info Card */}
                                    <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm border border-white/10 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <Shield className="h-16 w-16" />
                                        </div>

                                        <div className="relative z-10 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1.5 ${scanResult.type === 'checkout' ? 'text-slate-300' : 'text-emerald-200'}`}>{t('primaryPassenger')}</p>
                                                    <h4 className="text-2xl font-black leading-tight tracking-tight">{scanResult.passenger?.name}</h4>
                                                </div>
                                                <button
                                                    onClick={() => setScanResult(null)}
                                                    className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className={`${scanResult.type === 'checkout' ? 'bg-slate-700' : 'bg-emerald-700/30'} rounded-xl p-2.5 border border-white/5`}>
                                                    <p className={`text-[9px] font-bold uppercase leading-none mb-1 ${scanResult.type === 'checkout' ? 'text-slate-300' : 'text-emerald-200'}`}>{t('passportNumber')}</p>
                                                    <p className="text-base font-mono font-black">{scanResult.passenger?.passport_number || t('na')}</p>
                                                </div>
                                                <div className={`${scanResult.type === 'checkout' ? 'bg-slate-700' : 'bg-emerald-700/30'} rounded-xl p-2.5 border border-white/5`}>
                                                    <p className={`text-[9px] font-bold uppercase leading-none mb-1 ${scanResult.type === 'checkout' ? 'text-slate-300' : 'text-emerald-200'}`}>{t('nationality')}</p>
                                                    <p className="text-base font-black truncate">{scanResult.passenger?.nationality}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Group / Occupancy Info */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${scanResult.type === 'checkout' ? 'text-slate-300' : 'text-emerald-200'}`}>{t('accessGroupDetails')}</p>
                                            <div className={`bg-white px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${scanResult.type === 'checkout' ? 'text-slate-800' : 'text-emerald-700'}`}>
                                                {t('totalPeople', { n: 1 + (scanResult.passenger?.companions?.length || 0) })}
                                            </div>
                                        </div>

                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                            {/* Accompanied Travellers */}
                                            {scanResult.passenger?.companions && scanResult.passenger.companions.length > 0 ? (
                                                scanResult.passenger.companions.map((c, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/10 hover:bg-white/15 transition-all">
                                                        <div className={`h-9 w-9 bg-white/90 rounded-xl flex items-center justify-center border border-white/10 shadow-inner font-black text-xs ${scanResult.type === 'checkout' ? 'text-slate-800' : 'text-emerald-700'}`}>
                                                            {c.type === 'child' ? tc('child', 'Child').substring(0, 2).toUpperCase() : tc('adult', 'Adult').substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex justify-between items-center mb-0.5">
                                                                <p className="text-xs font-bold truncate pr-2">{c.nationality}</p>
                                                                <p className="text-[10px] font-mono font-black text-white/70">{c.passport_number}</p>
                                                            </div>
                                                            <p className="text-[9px] text-white/50 uppercase font-bold tracking-tighter">{t('companionVerified')}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center italic text-white/60 text-xs">
                                                    {t('noCompanions')}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Security Footer */}
                                    <div className="pt-2">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-white/80 uppercase tracking-tight bg-white/5 p-3 rounded-xl border border-white/5">
                                            <div className={`h-2 w-2 rounded-full animate-pulse ${scanResult.type === 'checkout' ? 'bg-slate-300' : 'bg-emerald-400'}`}></div>
                                            <span>{scanResult.type === 'checkout' ? tc('checkoutClearance', 'Departure Clearance Confirmed') : t('secureDigitalClearance')}</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-start gap-4">
                                <div className="h-10 w-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <AlertCircle className="h-6 w-6 text-rose-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-base text-rose-900 leading-none mb-1">{t('accessDenied')}</h3>
                                    <p className="text-sm text-rose-700 leading-snug">{scanResult.message}</p>
                                </div>
                                <button
                                    onClick={() => setScanResult(null)}
                                    className="p-1 hover:bg-rose-200 rounded-full transition-colors text-rose-400"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                    </div>
                )}



                {/* QR Code Card - Hidden if success scan result is shown to focus security */}
                {(!scanResult || !scanResult.success) && (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
                        <div className="flex items-center gap-2 mb-3">
                            <QrCode className="h-5 w-5 text-indigo-600" />
                            <h2 className="text-lg font-bold text-slate-900">{t('boardingPass') || 'Your QR Code'}</h2>
                        </div>
                        <p className="text-slate-500 text-xs mb-5">{t('showQR') || 'Show this code to access services'}</p>

                        <div className={`bg-white p-4 rounded-2xl shadow-inner border-2 border-slate-100 mb-4 transition-opacity duration-300 ${isExpired ? 'opacity-30' : ''}`}>
                            <QRCodeSVG value={session.qr_token} size={180} fgColor={isExpired ? "#ef4444" : "#0f172a"} level="L" includeMargin={true} />
                        </div>

                        <div className="mb-4 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 w-full text-left space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">{t('passengerName') || 'Name'}</span>
                                    <div className="text-sm font-bold text-slate-800 truncate">{session.name}</div>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">{t('nationality') || 'Country'}</span>
                                    <div className="text-sm font-bold text-slate-800 truncate">{session.nationality || session.country}</div>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-slate-200">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('companions') || 'Companions'}</span>
                                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                                    <Users className="h-4 w-4 text-indigo-500" />
                                    <span>
                                        {session.companion_adults || 0} {t('adults') || 'Adults'}, {session.companion_children || 0} {t('kids') || 'Kids'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* QR Expiry Timer */}
                        {timeLeft !== null && (
                            <div className="mb-3">
                                {isExpired ? (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 text-rose-700 rounded-full text-sm font-semibold">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>{t('expired') || 'Expired'}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                                        <Clock className="h-4 w-4" />
                                        <span>{t('validFor')} <span className="font-bold tabular-nums">{formatCountdown(timeLeft)}</span></span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Status Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                            <span className="relative flex h-3 w-3">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${session.checked_in ? 'bg-emerald-400' : 'bg-amber-400'
                                    }`}></span>
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${session.checked_in ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`}></span>
                            </span>
                            {session.checked_in ? t('status_checked_in') : session.status === 'registered' ? t('status_registered') : t(`status_${session.status?.replace('-', '_')}`)}
                        </div>
                    </div>
                )}
                {/* Scan QR Code Button */}
                <button
                    onClick={startScanner}
                    className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
                >
                    <ScanLine className="h-6 w-6" />
                    {t('scanBuildingQR') || 'Scan QR Code'}
                </button>

                <p className="text-center text-xs text-slate-400 mt-2 leading-relaxed">
                    {t('scanInstructionsLine1')}<br />
                    {t('scanInstructionsLine2')}
                </p>
            </main>

            {/* ── Camera Scanner Modal ── */}
            {scanMode === 'scanning' && (
                <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-in fade-in duration-300">
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-black">
                        <div id="qr-reader" className="absolute inset-0 w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover opacity-80" />

                        {/* Custom Overlay for Scanner */}
                        <div className="absolute inset-0 pointer-events-none flex flex-col">
                            {/* Top dark area */}
                            <div className="w-full bg-black/60 backdrop-blur-[3px]" style={{ height: 'calc(50% - 140px)' }} />
                            <div className="w-full flex" style={{ height: '280px' }}>
                                {/* Left dark area */}
                                <div className="h-full bg-black/60 backdrop-blur-[3px] flex-1" />
                                {/* Clear Scan Area with cool animated corners */}
                                <div className="relative w-[280px] h-[280px] flex-shrink-0 relative">
                                    <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-indigo-500 rounded-tl-[32px] shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                                    <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-indigo-500 rounded-tr-[32px] shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                                    <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-indigo-500 rounded-bl-[32px] shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                                    <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-indigo-500 rounded-br-[32px] shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>

                                    {/* Laser line gradient effect */}
                                    <div className="absolute inset-0 overflow-hidden rounded-[28px] pointer-events-none">
                                        <div className="absolute top-0 left-0 right-0" style={{ animation: 'scanBeam 2.5s linear infinite' }}>
                                            <div className="h-[2px] bg-indigo-400 shadow-[0_0_15px_3px_rgba(99,102,241,1)]"></div>
                                            <div className="h-[80px] bg-gradient-to-b from-indigo-500/30 to-transparent"></div>
                                        </div>
                                    </div>
                                </div>
                                {/* Right dark area */}
                                <div className="h-full bg-black/60 backdrop-blur-[3px] flex-1" />
                            </div>
                            {/* Bottom dark area */}
                            <div className="w-full bg-black/60 backdrop-blur-[3px] flex-1 flex flex-col items-center justify-start pt-12 pb-[env(safe-area-inset-bottom)] px-6">
                                <div className="bg-black/40 backdrop-blur-md border border-white/10 text-white px-6 py-4 rounded-3xl flex items-center gap-4 text-left max-w-sm mb-auto shadow-2xl relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent"></div>
                                    <div className="bg-indigo-500/20 p-3 rounded-full flex-shrink-0 relative">
                                        <ScanLine className="h-6 w-6 text-indigo-400 relative z-10" />
                                        <div className="absolute inset-0 border-2 border-indigo-400 rounded-full animate-ping opacity-20" style={{ animationDuration: '2s' }}></div>
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="font-bold text-white mb-0.5">{t('scanBuildingQR') || 'Scan QR Code'}</h3>
                                        <p className="text-white/70 text-xs">{t('cameraInstructionsLine1') || 'Align the QR code within the frame'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Header overlay */}
                    <div className="absolute top-0 inset-x-0 pt-[env(safe-area-inset-top,1rem)] z-[210] flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent h-24">
                        <button
                            onClick={stopScanner}
                            className="h-10 w-10 bg-black/40 hover:bg-black/60 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center transition-all active:scale-95 ml-auto shadow-xl"
                        >
                            <X className="h-5 w-5 text-white" />
                        </button>
                    </div>
                </div>
            )}

            {/* Animations */}
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scanBeam { 
          0% { transform: translateY(-80px); opacity: 0; } 
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(280px); opacity: 0; } 
        }
      `}</style>
        </div>
    );
}

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { Plane, Coffee, MessageSquare, AlertCircle, Clock, CheckCircle, Megaphone, RefreshCw, Bell, X, Trash2, LogOut, ScanLine, Users } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../i18n/LanguageSwitcher';
import { useAutoTranslate } from '../i18n/useAutoTranslate';
import { Html5Qrcode } from 'html5-qrcode';

export default function PassengerApp() {
  const { qr_token: urlToken } = useParams();
  const navigate = useNavigate();
  const [passenger, setPassenger] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'qr' | 'help'>('qr');
  const [messageText, setMessageText] = useState('');
  const { t, rtl, lang } = useLanguage();

  // QR scanning state
  const [scanMode, setScanMode] = useState<'none' | 'scanning'>('none');
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    type?: string;
    passenger?: any;
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);

  // ───── Auto-translate dynamic content ─────
  const dynamicTexts = useMemo(() => {
    if (!passenger) return [];
    const texts: string[] = [];
    if (passenger.broadcastMessages) {
      for (const bm of passenger.broadcastMessages) {
        texts.push(bm.title || '');
        texts.push(bm.message || '');
      }
    }
    if (passenger.messages) {
      for (const m of passenger.messages) {
        texts.push(m.text || '');
      }
    }
    return texts;
  }, [passenger]);

  const translatedTexts = useAutoTranslate(dynamicTexts);

  const txMap = useMemo(() => {
    if (!passenger) return { bm: {} as Record<number, { title: string; message: string }>, msgs: {} as Record<number, string> };
    let idx = 0;
    const bm: Record<number, { title: string; message: string }> = {};
    if (passenger.broadcastMessages) {
      for (const msg of passenger.broadcastMessages) {
        bm[msg.id] = { title: translatedTexts[idx++] || '', message: translatedTexts[idx++] || '' };
      }
    }
    const msgs: Record<number, string> = {};
    if (passenger.messages) {
      for (const m of passenger.messages) {
        msgs[m.id] = translatedTexts[idx++] || '';
      }
    }
    return { bm, msgs };
  }, [passenger, translatedTexts]);

  const [notifOpen, setNotifOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem('aerocare_dismissed_notifs');
      if (stored) return JSON.parse(stored);
    } catch (err) {
      console.error('Failed to load dismissed notifications:', err);
    }
    return [];
  });
  const notifRef = useRef<HTMLDivElement>(null);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [renewing, setRenewing] = useState(false);

  const loadPassenger = useCallback(async (token: string) => {
    try {
      const res = await fetch(`/api/passengers/${token}`);
      if (!res.ok) throw new Error('Invalid token');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPassenger(data);
    } catch (error) {
      console.error('Failed to load passenger:', error);
      localStorage.removeItem('aerocare_passenger_token');
      navigate('/passenger/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = urlToken || localStorage.getItem('aerocare_passenger_token');
    if (token) {
      if (urlToken) {
        localStorage.setItem('aerocare_passenger_token', urlToken);
      }
      loadPassenger(token);
    } else {
      navigate('/passenger/login');
    }
  }, [urlToken, loadPassenger, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('aerocare_passenger_token');
    navigate('/passenger/login');
  };

  const startScanner = useCallback(async () => {
    setScanMode('scanning');
    setScanResult(null);

    setTimeout(async () => {
      try {
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode('qr-reader');
        }

        await scannerRef.current.start(
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
        );
      } catch (err) {
        console.error('Camera access or Html5Qrcode error:', err);
        setScanResult({
          success: false,
          message: t('cameraAccessDenied')
        });
        setScanMode('none');
      }
    }, 150);
  }, [passenger?.qr_token]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
    }
    setScanMode('none');
  }, []);

  const processScannedQR = async (qrData: string) => {
    stopScanner();
    if (!passenger?.qr_token) return;

    try {
      const res = await fetch('/api/building/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passenger_qr_token: passenger.qr_token,
          building_qr_code: qrData,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setScanResult({
          success: true,
          message: data.message,
          type: data.type,
          passenger: data.passenger,
        });
        window.scrollTo(0, 0);
        loadPassenger(passenger.qr_token);
      } else {
        setScanResult({
          success: false,
          message: data.error || data.message || t('verificationFailed'),
        });
        window.scrollTo(0, 0);
      }
    } catch (err) {
      console.error('Scan error:', err);
      setScanResult({
        success: false,
        message: t('connectionError'),
      });
    }
  };

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

  useEffect(() => {
    if (!passenger?.qr_generated_at || !passenger?.qr_expiry_minutes) return;

    const expiryMinutes = passenger.qr_expiry_minutes;
    const generatedAt = new Date(passenger.qr_generated_at).getTime();
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
  }, [passenger?.qr_generated_at, passenger?.qr_expiry_minutes]);

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

  const handleRenewQr = async () => {
    const token = passenger?.qr_token || urlToken;
    if (!token) return;
    setRenewing(true);
    try {
      const res = await fetch(`/api/passengers/${token}/renew-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to renew QR code');
      setPassenger(data);
    } catch (error) {
      console.error('Failed to renew QR code:', error);
    } finally {
      setRenewing(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passenger_id: passenger.id,
          text: messageText,
          sender: 'passenger'
        })
      });
      setMessageText('');
      const res = await fetch(`/api/passengers/${passenger.qr_token}`);
      const data = await res.json();
      setPassenger(data);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const broadcastMessages: any[] = passenger?.broadcastMessages || [];
  const activeNotifications = broadcastMessages.filter(
    (bm: any) => !dismissedIds.includes(bm.id)
  );
  const unreadCount = activeNotifications.length;

  const dismissNotification = (id: number) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    localStorage.setItem('aerocare_dismissed_notifs', JSON.stringify(updated));
  };

  const clearAllNotifications = () => {
    const allIds = broadcastMessages.map((bm: any) => bm.id);
    const updated = [...new Set([...dismissedIds, ...allIds])];
    setDismissedIds(updated);
    localStorage.setItem('aerocare_dismissed_notifs', JSON.stringify(updated));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  if (loading || !passenger) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <Plane className="h-12 w-12 text-indigo-400 mb-4" />
          <p className="text-slate-500 font-medium">{t('loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 pb-24 ${rtl ? 'text-right' : ''}`} dir={rtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-indigo-600 text-white p-6 rounded-b-3xl shadow-lg relative">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl pointer-events-none overflow-hidden"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('hi')}, {passenger.name}</h1>
            <p className="text-indigo-100 flex items-center gap-1 mt-1 font-medium">
              <Plane className="h-4 w-4" /> {t('flight')} {passenger.flight_number}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="icon" />
            <button
              onClick={handleLogout}
              className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-inner hover:bg-white/30 transition-colors"
              aria-label={t('logout')}
              title={t('logout')}
            >
              <LogOut className="h-5 w-5" />
            </button>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative h-10 w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-inner hover:bg-white/30 transition-colors"
              aria-label={t('notifications')}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-indigo-600 animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ───── Notification Panel ───── */}
      {notifOpen && (
        <div className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease' }}>
          <div
            ref={notifRef}
            className="absolute top-0 left-0 right-0 max-w-md mx-auto bg-white rounded-b-3xl shadow-2xl overflow-hidden"
            style={{ animation: 'slideDown 0.3s ease' }}
          >
            <div className="bg-indigo-600 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <h2 className="text-lg font-bold">{t('notifications')}</h2>
                {unreadCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeNotifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-full text-xs font-semibold transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t('clearAll')}
                  </button>
                )}
                <button
                  onClick={() => setNotifOpen(false)}
                  className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {broadcastMessages.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Bell className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="font-semibold text-slate-600">{t('noNotifications')}</h3>
                  <p className="text-sm text-slate-400 mt-1">{t('noNotificationsMsg')}</p>
                </div>
              ) : activeNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-8 w-8 text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-slate-600">{t('allCaught')}</h3>
                  <p className="text-sm text-slate-400 mt-1">{t('allCaughtMsg')}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {activeNotifications.map((bm: any) => (
                    <div key={bm.id} className="p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors group">
                      <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Megaphone className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 text-sm">{txMap.bm[bm.id]?.title || bm.title}</h3>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">{txMap.bm[bm.id]?.message || bm.message}</p>
                        <p className="text-xs text-slate-400 mt-2">
                          {new Date(bm.sent_at).toLocaleString(lang === 'en' ? 'en-US' : lang, {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => dismissNotification(bm.id)}
                        className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                        title={t('dismiss')}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      <main className="p-4 max-w-md mx-auto mt-2 space-y-6">
        {scanResult && (
          <div className={`rounded-3xl overflow-hidden shadow-2xl border-0 ${scanResult.success ? 'bg-emerald-600 text-white' : 'bg-rose-50 border-rose-200 border-2 p-5'}`}
            style={{ animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            {scanResult.success ? (
              scanResult.type === 'checkin' || scanResult.type === 'renewal' ? (
                /* Security Clearance Pass */
                <div className="flex flex-col">
                  {/* Header */}
                  <div className="bg-white/10 p-4 border-b border-white/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-300" />
                      <span className="font-bold tracking-widest text-xs uppercase opacity-90">{t('securityClearance')}</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-60 bg-black/20 px-2 py-1 rounded">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Main Content */}
                  <div className="p-8 flex flex-col items-center text-center">
                    <div className="h-20 w-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg mb-4 ring-8 ring-emerald-500/20">
                      <CheckCircle className="h-10 w-10 text-white animate-pulse" />
                    </div>

                    <h2 className="text-3xl font-black mb-1">{t('entryGranted')}</h2>
                    <p className="text-emerald-100 text-sm font-medium mb-6">{t('securityAuthActive')}</p>

                    <div className="w-full bg-black/20 rounded-2xl p-5 space-y-4 text-left border border-white/10">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-emerald-200/60 mb-1">{t('passengerName')}</p>
                        <p className="font-bold text-lg leading-tight uppercase">{scanResult.passenger?.name || passenger?.name}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-emerald-200/60 mb-1">{t('passportNumber')}</p>
                          <p className="font-bold font-mono text-sm uppercase">{scanResult.passenger?.passport_number || passenger?.passport_number}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-emerald-200/60 mb-1">{t('nationality')}</p>
                          <p className="font-bold text-sm uppercase">{scanResult.passenger?.nationality || passenger?.nationality}</p>
                        </div>
                      </div>

                      <div className="flex justify-between gap-4 pt-2 border-t border-white/5">
                        <div className="flex-1">
                          <p className="text-[10px] uppercase font-bold text-emerald-200/60 mb-1">{t('groupSize')}</p>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-emerald-300" />
                            <p className="font-bold">{t('totalPeople', { n: 1 + (scanResult.passenger?.companions?.length || passenger?.companions?.length || 0) })}</p>
                          </div>
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-[10px] uppercase font-bold text-emerald-200/60 mb-1">{t('passStatus')}</p>
                          <p className="bg-emerald-400 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-full inline-block uppercase">{t('verified')}</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setScanResult(null)}
                      className="mt-8 w-full py-4 bg-white text-emerald-700 rounded-2xl font-bold text-sm shadow-xl hover:bg-emerald-50 transition-all active:scale-95"
                    >
                      {t('closePass')}
                    </button>
                  </div>
                </div>
              ) : (
                /* Exit Granted UI */
                <div className="bg-indigo-500/30 p-8 flex flex-col items-center justify-center text-white text-center">
                  <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                    <LogOut className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-black text-2xl uppercase mb-2">{t('exitGranted')}</h3>
                  <p className="text-indigo-100 text-sm mb-6">{t('checkoutSuccess')}</p>
                  <button onClick={() => setScanResult(null)} className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-colors">{t('dismiss')}</button>
                </div>
              )
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-rose-800">{scanResult.message}</p>
                <button onClick={() => setScanResult(null)}><X className="h-5 w-5 text-rose-400" /></button>
              </div>
            )}
          </div>
        )}

        {passenger?.alwaysOnBroadcast?.visible && passenger.alwaysOnBroadcast.title && passenger.alwaysOnBroadcast.message && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
            <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">{passenger.alwaysOnBroadcast.title}</h3>
              <p className="text-sm text-amber-800 mt-1 leading-relaxed">{passenger.alwaysOnBroadcast.message}</p>
            </div>
          </div>
        )}

        {activeNotifications.length > 0 && (
          <div className="space-y-3">
            {activeNotifications.slice(0, 2).map((bm: any) => (
              <div key={bm.id} className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm relative group">
                <button
                  onClick={() => dismissNotification(bm.id)}
                  className="absolute top-2 right-2 h-6 w-6 rounded-full flex items-center justify-center text-indigo-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                  aria-label={t('dismiss')}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="h-8 w-8 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Megaphone className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="font-semibold text-indigo-900 text-sm">{txMap.bm[bm.id]?.title || bm.title}</h3>
                  <p className="text-sm text-indigo-800 mt-1 leading-relaxed">{txMap.bm[bm.id]?.message || bm.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'qr' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col items-center text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">{t('boardingPass')}</h2>
            <p className="text-slate-500 text-sm mb-8">{t('showQR')}</p>

            <div className={`bg-white p-4 rounded-2xl shadow-inner border-2 border-slate-100 mb-4 transition-opacity duration-300 ${isExpired ? 'opacity-30' : ''}`}>
              <QRCode value={passenger.qr_token} size={200} fgColor="#0f172a" />
            </div>

            {passenger.companions && passenger.companions.length > 0 && (
              <div className="mb-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 inline-flex flex-col items-center">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('passCovers')}</span>
                <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                  <Users className="h-4 w-4 text-indigo-500" />
                  {passenger.name} + {passenger.companions.length} {passenger.companions.length === 1 ? t('companion') : t('companions')}
                </div>
              </div>
            )}

            {timeLeft !== null && (
              <div className="mb-4 flex items-center gap-2">
                {isExpired ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 text-rose-700 rounded-full text-sm font-semibold">
                      <AlertCircle className="h-4 w-4" />
                      <span>{t('expired')}</span>
                    </div>
                    <button
                      onClick={handleRenewQr}
                      disabled={renewing}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 active:scale-95"
                    >
                      {renewing ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      {renewing ? t('renewing') : t('renewQR')}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                    <Clock className="h-4 w-4" />
                    <span>{t('expiresIn')} <span className="font-bold tabular-nums">{formatCountdown(timeLeft)}</span></span>
                  </div>
                )}
              </div>
            )}

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium mb-6">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${passenger.status === 'checked-in' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${passenger.status === 'checked-in' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              {t('status')}: <span className="capitalize">{t(`status_${passenger.status.replace('-', '_')}`)}</span>
            </div>

            <button
              onClick={startScanner}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl font-bold text-lg shadow-lg"
            >
              <ScanLine className="h-6 w-6" />
              {t('scanBuildingQR') || 'Scan QR Code'}
            </button>
          </div>
        )}


        {activeTab === 'help' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col h-[60vh]">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{t('supportChat')}</h2>
              <p className="text-sm text-slate-500">{t('supportMsg')}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {passenger.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
                  <p>{t('noMessages')}</p>
                </div>
              ) : (
                passenger.messages.map((m: any) => (
                  <div key={m.id} className={`flex ${m.sender === 'passenger' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${m.sender === 'passenger' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm'}`}>
                      {txMap.msgs[m.id] || m.text}
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={sendMessage} className="p-4 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                placeholder={t('typePlaceholder')}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
              <button type="submit" className="h-10 w-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-sm">
                <Plane className="h-4 w-4 transform rotate-45 ml-1" />
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 pb-safe z-50">
        <div className="flex max-w-md mx-auto">
          <button onClick={() => setActiveTab('qr')} className={`flex-1 py-3 flex flex-col items-center gap-0.5 ${activeTab === 'qr' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <QRCode value="dummy" size={20} fgColor="currentColor" className="h-5 w-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">{t('tabPass')}</span>
          </button>
          <button onClick={() => setActiveTab('help')} className={`flex-1 py-3 flex flex-col items-center gap-0.5 ${activeTab === 'help' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <MessageSquare className="h-5 w-5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">{t('tabHelp')}</span>
          </button>
        </div>
      </div>

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

      <style>{`
        @keyframes scanBeam { 
          0% { transform: translateY(-80px); opacity: 0; } 
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(280px); opacity: 0; } 
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

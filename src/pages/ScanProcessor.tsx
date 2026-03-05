import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function ScanProcessor() {
    const { qr_code } = useParams<{ qr_code: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const processScan = async () => {
            if (!qr_code) {
                setError(t('invalidQR') || 'Invalid QR Code');
                return;
            }

            const token = localStorage.getItem('aerocare_passenger_token');

            if (!token) {
                // Not logged in. Save code to session storage and redirect to login
                sessionStorage.setItem('pending_scan_code', qr_code);
                navigate('/passenger/login');
                return;
            }

            // Logged in, process scan immediately
            try {
                const res = await fetch('/api/building/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        passenger_qr_token: token,
                        building_qr_code: qr_code,
                    }),
                });

                const data = await res.json();

                // Navigate to home page and pass the scan result via state
                navigate('/passenger', {
                    state: {
                        scanResult: {
                            success: res.ok && data.success,
                            message: data.error || data.message || (res.ok && data.success ? '' : t('verificationFailed')),
                            type: data.type,
                            passenger: data.passenger,
                        }
                    },
                    replace: true // replace history so back button works correctly
                });

            } catch (err) {
                console.error('Scan processing error:', err);
                navigate('/passenger', {
                    state: {
                        scanResult: {
                            success: false,
                            message: t('connectionError') || 'Connection Error',
                        }
                    },
                    replace: true
                });
            }
        };

        processScan();
    }, [qr_code, navigate, t]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            {!error ? (
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                    <p className="text-slate-600 font-medium">{t('processingScan') || 'Processing your scan...'}</p>
                </div>
            ) : (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center max-w-sm w-full">
                    <p className="text-rose-600 font-bold mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold"
                    >
                        {t('returnHome') || 'Return Home'}
                    </button>
                </div>
            )}
        </div>
    );
}

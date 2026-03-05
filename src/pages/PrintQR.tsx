import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCodeSVG from 'react-qr-code';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';

interface BuildingQR {
    id: number;
    code: string;
    type: 'checkin' | 'checkout';
    label: string;
    expires_at: string | null;
}

export default function PrintQR() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [qr, setQr] = useState<BuildingQR | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchQR = async () => {
            try {
                const res = await fetch(`/api/building/qr-codes/${id}`);
                if (!res.ok) throw new Error('Failed to fetch QR code');
                const data = await res.json();
                setQr(data);
            } catch (err) {
                console.error(err);
                setError('QR code not found');
            } finally {
                setLoading(false);
            }
        };
        fetchQR();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (error || !qr) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Error</h1>
                <p className="text-slate-600 mb-6">{error || 'Something went wrong'}</p>
                <button
                    onClick={() => navigate('/control/settings')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Settings
                </button>
            </div>
        );
    }

    const isEntry = qr.type === 'checkin';
    const primaryColor = isEntry ? '#10b981' : '#f59e0b'; // Emerald-500 : Amber-500
    const textColor = isEntry ? 'text-emerald-600' : 'text-amber-600';
    const borderColor = isEntry ? 'border-emerald-500' : 'border-amber-500';

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
            {/* Action Bar - Hidden during print */}
            <div className="w-full max-w-[640px] flex justify-between items-center mb-8 print:hidden">
                <button
                    onClick={() => navigate('/control/settings')}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Settings
                </button>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    <Printer className="h-5 w-5" /> Print QR Design
                </button>
            </div>

            {/* Printable Card */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-16 w-full max-w-[640px] flex flex-col items-center text-center border border-slate-100 print:shadow-none print:border-slate-200 print:border-[1px] print:m-0">
                <h1 className={`text-6xl font-black tracking-tight mb-4 ${isEntry ? 'text-[#059669]' : 'text-[#d97706]'}`}>
                    {isEntry ? 'FACILITY ENTRY' : 'FACILITY EXIT'}
                </h1>
                <p className="text-2xl text-slate-500 font-semibold mb-16 px-4">
                    {isEntry ? 'Passengers scan this to check in' : 'Passengers scan this to check out'}
                </p>

                <div
                    className={`p-10 rounded-[3rem] border-[12px] ${isEntry ? 'border-[#059669]' : 'border-[#d97706]'} bg-white mb-16`}
                >
                    <QRCodeSVG
                        value={qr.code}
                        size={380}
                        level="L"
                        includeMargin={true}
                    />
                </div>

                <div className="space-y-6">
                    <p className="text-4xl font-extrabold text-slate-900 tracking-tight">
                        {isEntry ? 'Scan to Check-In' : 'Scan to Check-Out'}
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
                        <span className="text-slate-500 text-xs font-black uppercase tracking-[0.2em]">
                            Location: {qr.label || 'Default'}
                        </span>
                    </div>
                </div>

                <div className="mt-20 pt-10 border-t border-slate-100 w-full flex justify-center items-center gap-4">
                    <div className="h-10 w-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100 italic">A</div>
                    <div className="flex flex-col items-start leading-none">
                        <span className="text-2xl font-black text-slate-900 tracking-tighter uppercase">AeroCare</span>
                        <span className="text-[10px] text-slate-400 font-bold tracking-[0.3em] uppercase">Operations Control</span>
                    </div>
                </div>
            </div>

            {/* Print Helper CSS */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body { background: white !important; margin: 0 !important; padding: 0 !important; }
                    .min-h-screen { background: white !important; padding: 0 !important; height: auto !important; min-height: 0 !important; }
                    @page { margin: 20mm; }
                }
            `}} />
        </div>
    );
}

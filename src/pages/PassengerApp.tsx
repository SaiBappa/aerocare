import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { Plane, MapPin, Coffee, MessageSquare, AlertCircle, Clock, CheckCircle } from 'lucide-react';

export default function PassengerApp() {
  const { qr_token } = useParams();
  const [passenger, setPassenger] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'qr' | 'location' | 'benefits' | 'help'>('qr');
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    if (qr_token) {
      fetch(`/api/passengers/${qr_token}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) setPassenger(data);
        });
    }
  }, [qr_token]);

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
      // Refresh data to get new messages
      const res = await fetch(`/api/passengers/${qr_token}`);
      const data = await res.json();
      setPassenger(data);
    } catch (error) {
      console.error(error);
    }
  };

  if (!passenger) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <Plane className="h-12 w-12 text-indigo-400 mb-4" />
          <p className="text-slate-500 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-6 rounded-b-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Hi, {passenger.name}</h1>
            <p className="text-indigo-100 flex items-center gap-1 mt-1 font-medium">
              <Plane className="h-4 w-4" /> Flight {passenger.flight_number}
            </p>
          </div>
          <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-inner">
            <span className="text-lg font-bold">{passenger.name.charAt(0)}</span>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto mt-2 space-y-6">
        {/* Status Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
          <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900">Flight Update</h3>
            <p className="text-sm text-amber-800 mt-1 leading-relaxed">Your flight is currently delayed due to operational disruptions. Please proceed to your assigned rest area.</p>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'qr' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col items-center text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Your Boarding Pass</h2>
            <p className="text-slate-500 text-sm mb-8">Show this QR code to staff for location entry and benefit redemption.</p>
            
            <div className="bg-white p-4 rounded-2xl shadow-inner border-2 border-slate-100 mb-6">
              <QRCode value={passenger.qr_token} size={200} fgColor="#0f172a" />
            </div>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Status: <span className="capitalize">{passenger.status.replace('-', ' ')}</span>
            </div>
          </div>
        )}

        {activeTab === 'location' && passenger.location && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="h-32 bg-slate-200 relative">
                <img src={`https://picsum.photos/seed/${passenger.location.id}/800/400`} alt="Location" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h2 className="text-xl font-bold">{passenger.location.name}</h2>
                  <p className="text-sm opacity-90 flex items-center gap-1"><MapPin className="h-4 w-4" /> Assigned Rest Area</p>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-slate-900 mb-3">Available Facilities</h3>
                <div className="flex flex-wrap gap-2">
                  {passenger.location.facilities.split(',').map((f: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium border border-indigo-100">
                      {f.trim()}
                    </span>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="font-medium text-slate-900 flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-slate-500" /> Operating Hours
                  </h4>
                  <p className="text-sm text-slate-600">Open 24/7 during disruption period. Please ensure you check-in with staff upon arrival.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'benefits' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 px-2">Your Benefits</h2>
            {passenger.benefits.map((b: any) => (
              <div key={b.id} className={`p-5 rounded-2xl border flex items-center justify-between ${b.status === 'available' ? 'bg-white border-indigo-100 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${b.status === 'available' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                    <Coffee className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${b.status === 'available' ? 'text-slate-900' : 'text-slate-500'}`}>{b.name}</h3>
                    <p className="text-sm text-slate-500 capitalize">{b.type} • {b.value > 0 ? `${b.value}% Off` : 'Complimentary'}</p>
                  </div>
                </div>
                {b.status === 'available' ? (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider">Valid</span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-400 text-sm font-medium"><CheckCircle className="h-4 w-4" /> Used</span>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'help' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col h-[60vh]">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Support Chat</h2>
              <p className="text-sm text-slate-500">Airport operations team is here to help.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {passenger.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
                  <p>No messages yet.</p>
                </div>
              ) : (
                passenger.messages.map((m: any) => (
                  <div key={m.id} className={`flex ${m.sender === 'passenger' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${m.sender === 'passenger' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm'}`}>
                      {m.text}
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
                placeholder="Type your request..." 
                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
          <button onClick={() => setActiveTab('qr')} className={`flex-1 py-4 flex flex-col items-center gap-1 ${activeTab === 'qr' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <QRCode value="dummy" size={24} fgColor="currentColor" className="h-6 w-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Pass</span>
          </button>
          <button onClick={() => setActiveTab('location')} className={`flex-1 py-4 flex flex-col items-center gap-1 ${activeTab === 'location' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <MapPin className="h-6 w-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Zone</span>
          </button>
          <button onClick={() => setActiveTab('benefits')} className={`flex-1 py-4 flex flex-col items-center gap-1 ${activeTab === 'benefits' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <Coffee className="h-6 w-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Perks</span>
          </button>
          <button onClick={() => setActiveTab('help')} className={`flex-1 py-4 flex flex-col items-center gap-1 ${activeTab === 'help' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <MessageSquare className="h-6 w-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Help</span>
          </button>
        </div>
      </div>
    </div>
  );
}

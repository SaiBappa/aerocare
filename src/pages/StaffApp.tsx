import { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import { UserPlus, QrCode, CheckCircle, AlertCircle, MapPin, Coffee, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StaffApp() {
  const [activeTab, setActiveTab] = useState<'register' | 'scan'>('register');
  const [events, setEvents] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  
  // Registration State
  const [formData, setFormData] = useState({
    event_id: '',
    name: '',
    flight_number: '',
    location_id: ''
  });
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // Scan State
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanAction, setScanAction] = useState<'check-in' | 'check-out' | 'redeem'>('check-in');
  const [scanLocationId, setScanLocationId] = useState('');
  const [scanMessage, setScanMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    fetch('/api/events').then(res => res.json()).then(data => {
      setEvents(data);
      if (data.length > 0) setFormData(prev => ({ ...prev, event_id: data[0].id }));
    });
    fetch('/api/locations').then(res => res.json()).then(data => {
      setLocations(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, location_id: data[0].id }));
        setScanLocationId(data[0].id);
      }
    });
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/passengers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setRegSuccess(data.qr_token);
        setFormData({ ...formData, name: '', flight_number: '' });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleScan = async (result: any, error: any) => {
    if (result) {
      const token = result?.text;
      if (token && token !== scanResult) {
        setScanResult(token);
        
        try {
          const res = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              qr_token: token,
              action: scanAction,
              location_id: scanLocationId,
              outlet_id: 1, // Mock outlet
              benefit_id: 1 // Mock benefit
            })
          });
          const data = await res.json();
          if (data.success) {
            setScanMessage({ type: 'success', text: data.message });
          } else {
            setScanMessage({ type: 'error', text: data.error || 'Scan failed' });
          }
        } catch (err) {
          setScanMessage({ type: 'error', text: 'Network error' });
        }
        
        setTimeout(() => {
          setScanResult(null);
          setScanMessage(null);
        }, 3000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-indigo-600 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Staff Portal
          </h1>
          <Link to="/" className="text-indigo-200 hover:text-white text-sm">Exit</Link>
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto">
        {activeTab === 'register' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Register Passenger</h2>
            
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

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Event</label>
                <select 
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-slate-50 border"
                  value={formData.event_id}
                  onChange={e => setFormData({...formData, event_id: e.target.value})}
                  required
                >
                  {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-slate-50 border"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Flight Number</label>
                <input 
                  type="text" 
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-slate-50 border"
                  value={formData.flight_number}
                  onChange={e => setFormData({...formData, flight_number: e.target.value})}
                  required
                  placeholder="e.g. EK123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign Location</label>
                <select 
                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 bg-slate-50 border"
                  value={formData.location_id}
                  onChange={e => setFormData({...formData, location_id: e.target.value})}
                  required
                >
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name} (Cap: {l.capacity})</option>)}
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-colors mt-6"
              >
                Register & Generate QR
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Scan Action</label>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setScanAction('check-in')}
                  className={`py-2 px-2 rounded-lg text-sm font-medium flex flex-col items-center gap-1 ${scanAction === 'check-in' ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500' : 'bg-slate-100 text-slate-600 border-2 border-transparent'}`}
                >
                  <MapPin className="h-5 w-5" /> Check-in
                </button>
                <button 
                  onClick={() => setScanAction('check-out')}
                  className={`py-2 px-2 rounded-lg text-sm font-medium flex flex-col items-center gap-1 ${scanAction === 'check-out' ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500' : 'bg-slate-100 text-slate-600 border-2 border-transparent'}`}
                >
                  <ArrowRight className="h-5 w-5" /> Check-out
                </button>
                <button 
                  onClick={() => setScanAction('redeem')}
                  className={`py-2 px-2 rounded-lg text-sm font-medium flex flex-col items-center gap-1 ${scanAction === 'redeem' ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500' : 'bg-slate-100 text-slate-600 border-2 border-transparent'}`}
                >
                  <Coffee className="h-5 w-5" /> Redeem
                </button>
              </div>

              {(scanAction === 'check-in' || scanAction === 'check-out') && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Location</label>
                  <select 
                    className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 bg-slate-50 border"
                    value={scanLocationId}
                    onChange={e => setScanLocationId(e.target.value)}
                  >
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg relative aspect-square">
              <QrReader
                onResult={handleScan}
                constraints={{ facingMode: 'environment' }}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-4 border-indigo-500/50 m-12 rounded-2xl pointer-events-none"></div>
              
              {scanMessage && (
                <div className="absolute inset-x-0 bottom-4 mx-4">
                  <div className={`p-4 rounded-xl flex items-center gap-3 shadow-lg ${scanMessage.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {scanMessage.type === 'success' ? <CheckCircle className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                    <span className="font-medium">{scanMessage.text}</span>
                  </div>
                </div>
              )}
            </div>
            <p className="text-center text-sm text-slate-500">Point camera at passenger QR code</p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 pb-safe">
        <div className="flex max-w-md mx-auto">
          <button 
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-4 flex flex-col items-center gap-1 ${activeTab === 'register' ? 'text-indigo-600' : 'text-slate-500'}`}
          >
            <UserPlus className="h-6 w-6" />
            <span className="text-xs font-medium">Register</span>
          </button>
          <button 
            onClick={() => setActiveTab('scan')}
            className={`flex-1 py-4 flex flex-col items-center gap-1 ${activeTab === 'scan' ? 'text-indigo-600' : 'text-slate-500'}`}
          >
            <QrCode className="h-6 w-6" />
            <span className="text-xs font-medium">Scanner</span>
          </button>
        </div>
      </div>
    </div>
  );
}

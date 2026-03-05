/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { AuthProvider } from './auth/AuthContext';
import RequireAuth from './auth/RequireAuth';
import Landing from './pages/Landing';
import PassengerApp from './pages/PassengerApp';
import PassengerLogin from './pages/PassengerLogin';
import PassengerRegister from './pages/PassengerRegister';
import StaffApp from './pages/StaffApp';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminActivity from './pages/AdminActivity';
import AdminBroadcast from './pages/AdminBroadcast';
import AdminPassengers from './pages/AdminPassengers';
import AdminSupport from './pages/AdminSupport';
import AdminSettings from './pages/AdminSettings';
import PrintQR from './pages/PrintQR';
import StakeholderPortal from './pages/StakeholderPortal';

import ScanProcessor from './pages/ScanProcessor';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/s/:qr_code" element={<ScanProcessor />} />
            <Route path="/stakeholder" element={<StakeholderPortal />} />
            <Route path="/passenger" element={<PassengerApp />} />

            <Route path="/passenger/login" element={<PassengerLogin />} />
            <Route path="/passenger/register" element={<PassengerRegister />} />
            <Route path="/passenger/:qr_token" element={<PassengerApp />} />
            <Route path="/staff" element={<RequireAuth allowedRoles={['admin', 'staff']}><StaffApp /></RequireAuth>} />
            <Route path="/control/login" element={<AdminLogin />} />
            <Route path="/control" element={<RequireAuth allowedRoles={['admin', 'dashboard']}><AdminDashboard /></RequireAuth>} />
            <Route path="/control/activity" element={<RequireAuth allowedRoles={['admin', 'dashboard']}><AdminActivity /></RequireAuth>} />
            <Route path="/control/broadcast" element={<RequireAuth allowedRoles={['admin', 'dashboard']}><AdminBroadcast /></RequireAuth>} />
            <Route path="/control/passengers" element={<RequireAuth allowedRoles={['admin', 'dashboard']}><AdminPassengers /></RequireAuth>} />
            <Route path="/control/support" element={<RequireAuth allowedRoles={['admin', 'dashboard']}><AdminSupport /></RequireAuth>} />
            <Route path="/control/settings" element={<RequireAuth allowedRoles={['admin']}><AdminSettings /></RequireAuth>} />
            <Route path="/control/print-qr/:id" element={<RequireAuth allowedRoles={['admin', 'dashboard']}><PrintQR /></RequireAuth>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

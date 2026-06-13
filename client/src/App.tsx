import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { useAuthStore } from '@/store/authStore';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { LiveSessions } from '@/pages/LiveSessions';
import { CallRoom } from '@/pages/CallRoom';
import { Recordings } from '@/pages/Recordings';
import { SessionHistory } from '@/pages/SessionHistory';
import { Analytics } from '@/pages/Analytics';
import { Admin } from '@/pages/Admin';
import { Settings, Profile } from '@/pages/Settings';
import { ToastContainer } from '@/components/shared/Toast';
import { BootScreen } from '@/components/shared/BootScreen';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (user.role === 'customer') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function CallRoute() {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <CallRoom />;
}

export default function App() {
  const [booting, setBooting] = useState(true);

  return (
    <>
      <AnimatePresence mode="wait">
        {booting && <BootScreen key="boot" onDone={() => setBooting(false)} />}
      </AnimatePresence>

      {!booting && (
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/live-sessions" element={<ProtectedRoute><LiveSessions /></ProtectedRoute>} />
            <Route path="/call/:sessionId" element={<CallRoute />} />
            <Route path="/recordings" element={<ProtectedRoute><Recordings /></ProtectedRoute>} />
            <Route path="/session-history" element={<ProtectedRoute><SessionHistory /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <ToastContainer />
        </BrowserRouter>
      )}
    </>
  );
}

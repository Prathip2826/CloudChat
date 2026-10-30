import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { isConfigured } from './lib/supabase';
import Landing from './pages/Landing';
import AuthPage from './pages/AuthPage';
import SetupNotice from './pages/SetupNotice';
import AppShell from './pages/AppShell';
import EmptyChat from './pages/EmptyChat';
import ChatRoom from './pages/ChatRoom';
import Logo from './components/Logo';

function Splash() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="animate-pulse">
        <Logo />
      </div>
    </div>
  );
}

function RequireAuth({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <Splash />;
  return children;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (user) return <Navigate to="/app" replace />;
  return children;
}

export default function App() {
  if (!isConfigured) return <SetupNotice />;

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={
          <GuestOnly>
            <AuthPage mode="login" />
          </GuestOnly>
        }
      />
      <Route
        path="/register"
        element={
          <GuestOnly>
            <AuthPage mode="register" />
          </GuestOnly>
        }
      />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<EmptyChat />} />
        <Route path=":roomId" element={<ChatRoom />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

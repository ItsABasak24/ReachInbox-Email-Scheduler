import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import Toaster from './components/ui/Toast';
import Spinner from './components/ui/Spinner';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

// OAuth Callback Handler Component
const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      fetchUser().finally(() => {
        navigate('/dashboard', { replace: true });
      });
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, fetchUser]);

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" color="primary" />
      <p className="text-dark-300 text-sm">Completing authentication...</p>
    </div>
  );
};

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('token');

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!user && !token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Root index redirect
const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('token');

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return user || token ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/login" replace />
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Toaster />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;

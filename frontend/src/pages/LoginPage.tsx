import React from 'react';
import { Navigate } from 'react-router-dom';
import { Mail, ShieldCheck, Zap, BarChart3, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// Google Multicolor Icon
const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const token = localStorage.getItem('token');

  // If already authenticated, redirect to dashboard
  if (user || token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="relative w-full max-w-md bg-dark-900/90 border border-dark-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl z-10 text-center">
        {/* Logo and App Title */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center text-white shadow-xl shadow-primary-500/30 mb-4">
            <Mail className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Outbox</h1>
          <p className="text-sm text-dark-300 mt-2 font-medium">
            Production-grade email scheduling at scale
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="bg-dark-950/60 border border-dark-800/80 rounded-2xl p-4 mb-8 text-left space-y-2.5">
          <div className="flex items-center gap-2.5 text-xs text-dark-300">
            <Clock className="w-4 h-4 text-primary-400 shrink-0" />
            <span>Precise delay pacing & hourly sender quotas</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-dark-300">
            <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>BullMQ concurrency & automatic retries</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-dark-300">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Slack alerts & Google OAuth integration</span>
          </div>
        </div>

        {/* Google OAuth Login Button */}
        <button
          type="button"
          onClick={login}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-dark-950 font-semibold px-6 py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-black/20 hover:shadow-xl active:scale-[0.98] border border-gray-200"
        >
          <GoogleIcon className="w-5 h-5 shrink-0" />
          <span>Sign in with Google</span>
        </button>

        <p className="text-[11px] text-dark-400 mt-6 text-center leading-relaxed">
          ReachInbox Job Scheduler • Safe, rate-limited email distribution
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

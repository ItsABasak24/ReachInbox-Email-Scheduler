import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Check, LogOut, Loader2 } from 'lucide-react';
import api from '../../api/client';
import Button from '../ui/Button';

// Official Slack logo SVG
const SlackIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 122.8 122.8">
    <path
      d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z"
      fill="#E01E5A"
    />
    <path
      d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z"
      fill="#36C5F0"
    />
    <path
      d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C77.6 5.8 83.4 0 90.5 0s12.9 5.8 12.9 12.9v32.3z"
      fill="#2EB67D"
    />
    <path
      d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z"
      fill="#ECB22E"
    />
  </svg>
);

export interface SlackConnectProps {
  className?: string;
}

export const SlackConnect: React.FC<SlackConnectProps> = ({ className = '' }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [disconnecting, setDisconnecting] = useState<boolean>(false);

  const checkSlackStatus = async () => {
    try {
      const res = await api.get('/slack/status');
      const connected = res.data?.connected ?? res.data?.slackConnected ?? false;
      setIsConnected(Boolean(connected));
    } catch {
      // If endpoint fails or 404, assume not connected
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSlackStatus();
  }, []);

  const handleConnect = () => {
    const apiBase = import.meta.env.VITE_API_URL || '';
    window.location.href = `${apiBase}/api/slack/connect`;
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await api.post('/slack/disconnect');
      setIsConnected(false);
      toast.success('Slack disconnected successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to disconnect Slack');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-xs text-dark-400 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-dark-400" />
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <SlackIcon className="w-3.5 h-3.5 shrink-0" />
          <span>Slack Connected</span>
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <button
          type="button"
          onClick={handleDisconnect}
          disabled={disconnecting}
          title="Disconnect Slack"
          className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-dark-800 transition-colors disabled:opacity-50"
        >
          {disconnecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
        </button>
      </div>
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleConnect}
      leftIcon={<SlackIcon className="w-4 h-4" />}
      className={className}
    >
      Connect Slack
    </Button>
  );
};

export default SlackConnect;

import React from 'react';
import { ExternalLink, Calendar, Mail } from 'lucide-react';
import { Email } from '../../types';
import Badge from '../ui/Badge';

export interface EmailRowProps {
  email: Email;
  variant?: 'scheduled' | 'sent';
  onSelect?: (email: Email) => void;
}

export const EmailRow: React.FC<EmailRowProps> = ({ email, variant = 'scheduled', onSelect }) => {
  const getStatusBadge = (status: Email['status']) => {
    switch (status) {
      case 'sent':
        return <Badge variant="success" dot>Sent</Badge>;
      case 'scheduled':
        return <Badge variant="info" dot>Scheduled</Badge>;
      case 'processing':
        return <Badge variant="warning" dot>Processing</Badge>;
      case 'failed':
        return <Badge variant="error" dot>Failed</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  return (
    <tr
      onClick={() => onSelect && onSelect(email)}
      className="group hover:bg-dark-800/40 transition-colors border-b border-dark-800/60 text-sm"
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-dark-300">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium text-white">{email.recipientEmail}</div>
            {email.senderEmail && (
              <div className="text-xs text-dark-400">From: {email.senderEmail}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 max-w-xs truncate text-dark-200">
        <span className="font-medium text-white">{email.subject || '(No subject)'}</span>
        {email.body && (
          <p className="text-xs text-dark-400 truncate mt-0.5">{email.body}</p>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-dark-300">
        <div className="flex items-center gap-1.5 text-xs">
          <Calendar className="w-3.5 h-3.5 text-dark-400" />
          <span>
            {variant === 'sent'
              ? formatDate(email.sentAt || email.createdAt)
              : formatDate(email.scheduledAt)}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(email.status)}</td>
      {variant === 'sent' && (
        <td className="px-6 py-4 whitespace-nowrap text-right">
          {email.etherealUrl ? (
            <a
              href={email.etherealUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 underline underline-offset-4"
            >
              <span>View Email</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <span className="text-xs text-dark-500">—</span>
          )}
        </td>
      )}
    </tr>
  );
};

export default EmailRow;

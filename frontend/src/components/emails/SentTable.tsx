import React, { useEffect, useState } from 'react';
import { Mail, Calendar, ExternalLink, ChevronLeft, ChevronRight, RefreshCw, Send } from 'lucide-react';
import Table, { Column } from '../ui/Table';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { Email, PaginatedResponse } from '../../types';

export interface SentTableProps {
  emails: PaginatedResponse<Email>;
  isLoading: boolean;
  onRefresh: (page: number, search?: string) => void;
  searchQuery?: string;
}

export const SentTable: React.FC<SentTableProps> = ({
  emails,
  isLoading,
  onRefresh,
  searchQuery = '',
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Auto-refresh periodically (e.g. 15s)
  useEffect(() => {
    const interval = setInterval(() => {
      onRefresh(currentPage, searchQuery);
    }, 15000);

    return () => clearInterval(interval);
  }, [currentPage, searchQuery, onRefresh]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > (emails.totalPages || 1)) return;
    setCurrentPage(newPage);
    onRefresh(newPage, searchQuery);
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

  const columns: Column<Email>[] = [
    {
      header: 'Recipient Email',
      accessor: 'recipientEmail',
      render: (email) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-dark-800 border border-dark-700 flex items-center justify-center text-emerald-400 shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium text-white">{email.recipientEmail}</div>
            {email.senderEmail && (
              <div className="text-xs text-dark-400">From: {email.senderEmail}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Subject',
      accessor: 'subject',
      render: (email) => (
        <div className="max-w-md truncate">
          <span className="text-white font-medium">{email.subject || '(No subject)'}</span>
          {email.errorMessage ? (
            <p className="text-xs text-rose-400 truncate mt-0.5">Error: {email.errorMessage}</p>
          ) : email.body ? (
            <p className="text-xs text-dark-400 truncate mt-0.5">{email.body}</p>
          ) : null}
        </div>
      ),
    },
    {
      header: 'Sent Time',
      accessor: 'sentAt',
      render: (email) => (
        <div className="flex items-center gap-1.5 text-xs text-dark-300">
          <Calendar className="w-3.5 h-3.5 text-dark-400" />
          <span>{formatDate(email.sentAt || email.createdAt)}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (email) => {
        if (email.status === 'sent') {
          return <Badge variant="success" dot>Sent</Badge>;
        }
        if (email.status === 'failed') {
          return <Badge variant="error" dot>Failed</Badge>;
        }
        return <Badge variant="default">{email.status}</Badge>;
      },
    },
    {
      header: 'Preview Link',
      render: (email) => {
        if (email.etherealUrl) {
          return (
            <a
              href={email.etherealUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-400 hover:text-primary-300 bg-primary-500/10 hover:bg-primary-500/20 px-2.5 py-1 rounded-md border border-primary-500/20 transition-colors"
            >
              <span>View in Ethereal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          );
        }
        return <span className="text-xs text-dark-500">—</span>;
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Table Controls */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-dark-400">
          Total: <span className="text-white font-semibold">{emails.total || 0}</span> sent emails
        </div>
        <button
          type="button"
          onClick={() => onRefresh(currentPage, searchQuery)}
          disabled={isLoading}
          className="text-xs text-dark-400 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-dark-800/60 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Table */}
      <Table
        columns={columns}
        data={emails.data}
        isLoading={isLoading}
        emptyMessage={
          <EmptyState
            icon={<Send className="w-7 h-7 text-dark-400" />}
            title="No sent emails yet"
            description="Emails will appear here once processed and dispatched by the background worker."
          />
        }
      />

      {/* Pagination Controls */}
      {emails.totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-2">
          <span className="text-xs text-dark-400">
            Page <span className="text-white font-medium">{emails.page || currentPage}</span> of{' '}
            <span className="text-white font-medium">{emails.totalPages}</span>
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => handlePageChange(currentPage - 1)}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage >= emails.totalPages || isLoading}
              onClick={() => handlePageChange(currentPage + 1)}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SentTable;

import React, { useEffect, useState } from 'react';
import { Mail, Clock, ChevronLeft, ChevronRight, RefreshCw, Send } from 'lucide-react';
import Table, { Column } from '../ui/Table';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { Email, PaginatedResponse } from '../../types';

export interface ScheduledTableProps {
  emails: PaginatedResponse<Email>;
  isLoading: boolean;
  onRefresh: (page: number, search?: string) => void;
  onCompose?: () => void;
  searchQuery?: string;
}

export const ScheduledTable: React.FC<ScheduledTableProps> = ({
  emails,
  isLoading,
  onRefresh,
  onCompose,
  searchQuery = '',
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      onRefresh(currentPage, searchQuery);
    }, 10000);

    return () => clearInterval(interval);
  }, [currentPage, searchQuery, onRefresh]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > (emails.totalPages || 1)) return;
    setCurrentPage(newPage);
    onRefresh(newPage, searchQuery);
  };

  const formatDate = (dateStr: string) => {
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
          <div className="w-8 h-8 rounded-lg bg-dark-800 border border-dark-700 flex items-center justify-center text-primary-400 shrink-0">
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
          {email.body && (
            <p className="text-xs text-dark-400 truncate mt-0.5">{email.body}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Scheduled Time',
      accessor: 'scheduledAt',
      render: (email) => (
        <div className="flex items-center gap-1.5 text-xs text-dark-300">
          <Clock className="w-3.5 h-3.5 text-dark-400" />
          <span>{formatDate(email.scheduledAt)}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (email) => {
        switch (email.status) {
          case 'scheduled':
            return <Badge variant="info" dot>Scheduled</Badge>;
          case 'processing':
            return <Badge variant="warning" dot>Processing</Badge>;
          case 'failed':
            return <Badge variant="error" dot>Failed</Badge>;
          default:
            return <Badge variant="default">{email.status}</Badge>;
        }
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Table Controls */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-dark-400">
          Total: <span className="text-white font-semibold">{emails.total || 0}</span> scheduled emails
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
            icon={<Clock className="w-7 h-7 text-dark-400" />}
            title="No scheduled emails"
            description="You don't have any emails in the queue. Click 'Compose Email' to get started."
            action={
              onCompose
                ? {
                    label: 'Compose Email',
                    onClick: onCompose,
                    icon: <Send className="w-3.5 h-3.5" />,
                  }
                : undefined
            }
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

export default ScheduledTable;

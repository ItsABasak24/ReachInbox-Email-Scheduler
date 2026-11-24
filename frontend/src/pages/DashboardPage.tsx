import React, { useState, useEffect } from 'react';
import { Clock, Send, Plus, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import Sidebar, { NavItemKey } from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Tabs, { TabItem } from '../components/ui/Tabs';
import Button from '../components/ui/Button';
import ComposeModal from '../components/emails/ComposeModal';
import ScheduledTable from '../components/emails/ScheduledTable';
import SentTable from '../components/emails/SentTable';
import { useAuth } from '../hooks/useAuth';
import { useEmails } from '../hooks/useEmails';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    scheduledEmails,
    sentEmails,
    loading,
    fetchScheduled,
    fetchSent,
    scheduleEmails,
  } = useEmails();

  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [activeNav, setActiveNav] = useState<NavItemKey>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Initial fetch
  useEffect(() => {
    fetchScheduled(1, searchQuery);
    fetchSent(1, searchQuery);
  }, [fetchScheduled, fetchSent]);

  // Handle Search input
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (activeTab === 'scheduled') {
      fetchScheduled(1, query);
    } else {
      fetchSent(1, query);
    }
  };

  const handleNavSelect = (key: NavItemKey) => {
    setActiveNav(key);
    if (key === 'scheduled') {
      setActiveTab('scheduled');
    } else if (key === 'sent') {
      setActiveTab('sent');
    }
  };

  const handleTabChange = (tabId: string) => {
    const tab = tabId as 'scheduled' | 'sent';
    setActiveTab(tab);
    if (tab === 'scheduled') {
      fetchScheduled(1, searchQuery);
    } else {
      fetchSent(1, searchQuery);
    }
  };

  const tabs: TabItem[] = [
    {
      id: 'scheduled',
      label: 'Scheduled',
      count: scheduledEmails.total || 0,
      icon: <Clock className="w-4 h-4" />,
    },
    {
      id: 'sent',
      label: 'Sent',
      count: sentEmails.total || 0,
      icon: <Send className="w-4 h-4" />,
    },
  ];

  return (
    <div className="flex h-screen bg-dark-950 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar activeNav={activeNav} onNavSelect={handleNavSelect} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <Header
          user={user}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onCompose={() => setIsComposeOpen(true)}
          onLogout={logout}
        />

        {/* Dashboard Content */}
        <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-dark-400">
                  Scheduled Queue
                </p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {scheduledEmails.total || 0}
                </h3>
                <p className="text-xs text-primary-400 mt-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Throttled by worker
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-dark-400">
                  Delivered / Sent
                </p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {sentEmails.total || 0}
                </h3>
                <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Successfully sent
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Send className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-dark-400">
                  Job Orchestration
                </p>
                <h3 className="text-2xl font-bold text-white mt-1">BullMQ</h3>
                <p className="text-xs text-dark-400 mt-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> Redis concurrency
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Section Header with Tabs & Compose Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={handleTabChange}
              variant="underline"
            />

            <Button
              variant="primary"
              size="md"
              onClick={() => setIsComposeOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Compose Email
            </Button>
          </div>

          {/* Tab Views */}
          <div className="pt-2">
            {activeTab === 'scheduled' ? (
              <ScheduledTable
                emails={scheduledEmails}
                isLoading={loading}
                onRefresh={(page, search) => fetchScheduled(page, search ?? searchQuery)}
                onCompose={() => setIsComposeOpen(true)}
                searchQuery={searchQuery}
              />
            ) : (
              <SentTable
                emails={sentEmails}
                isLoading={loading}
                onRefresh={(page, search) => fetchSent(page, search ?? searchQuery)}
                searchQuery={searchQuery}
              />
            )}
          </div>
        </main>
      </div>

      {/* Compose & Schedule Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSchedule={scheduleEmails}
        defaultSenderEmail={user?.email || ''}
        onSuccess={() => {
          fetchScheduled(1, searchQuery);
          fetchSent(1, searchQuery);
        }}
      />
    </div>
  );
};

export default DashboardPage;

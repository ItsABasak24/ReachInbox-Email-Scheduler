import React from 'react';
import {
  LayoutDashboard,
  Clock,
  Send,
  Activity,
  Mail,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export type NavItemKey = 'dashboard' | 'scheduled' | 'sent';

export interface SidebarProps {
  activeNav: NavItemKey;
  onNavSelect: (key: NavItemKey) => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  onNavSelect,
  className = '',
}) => {
  const navItems = [
    {
      key: 'dashboard' as NavItemKey,
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      key: 'scheduled' as NavItemKey,
      label: 'Scheduled',
      icon: <Clock className="w-5 h-5" />,
    },
    {
      key: 'sent' as NavItemKey,
      label: 'Sent',
      icon: <Send className="w-5 h-5" />,
    },
  ];

  return (
    <aside
      className={`w-64 bg-dark-900 border-r border-dark-800 flex flex-col justify-between shrink-0 select-none min-h-screen ${className}`}
    >
      {/* Top Logo Section */}
      <div>
        <div className="h-16 px-6 flex items-center gap-3 border-b border-dark-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center text-white shadow-lg shadow-primary-500/25">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white text-lg tracking-tight">Outbox</div>
            <div className="text-[10px] text-dark-400 uppercase tracking-widest font-semibold">
              ReachInbox Scheduler
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3 py-2 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">
            Menu
          </div>
          {navItems.map((item) => {
            const isActive = activeNav === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavSelect(item.key)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary-600/15 text-primary-400 border border-primary-500/20 shadow-sm'
                    : 'text-dark-300 hover:text-white hover:bg-dark-800/60'
                }`}
              >
                <span className={isActive ? 'text-primary-400' : 'text-dark-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-4 px-3 py-2 text-[11px] font-semibold text-dark-400 uppercase tracking-wider">
            System
          </div>
          <a
            href="http://localhost:3001/admin/queues"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-dark-300 hover:text-white hover:bg-dark-800/60 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-dark-400 group-hover:text-emerald-400 transition-colors" />
              <span>Queue Monitor</span>
            </div>
            <ExternalLink className="w-4 h-4 text-dark-500 group-hover:text-dark-300 transition-colors" />
          </a>
        </nav>
      </div>

      {/* Bottom Footer Info */}
      <div className="p-4 border-t border-dark-800">
        <div className="bg-dark-800/50 rounded-xl p-3 border border-dark-800">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-dark-200">Worker Active</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-dark-400">
            <span>BullMQ Engine</span>
            <span className="font-mono">v1.0.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

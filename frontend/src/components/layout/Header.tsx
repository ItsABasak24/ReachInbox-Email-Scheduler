import React from 'react';
import { Search, Plus, LogOut, User as UserIcon } from 'lucide-react';
import Button from '../ui/Button';
import SlackConnect from '../slack/SlackConnect';
import { User } from '../../types';

export interface HeaderProps {
  user: User | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCompose: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  searchQuery,
  onSearchChange,
  onCompose,
  onLogout,
}) => {
  return (
    <header className="h-16 px-6 bg-dark-900 border-b border-dark-800 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-dark-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search emails by recipient, subject..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-dark-800/80 border border-dark-700/80 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
          />
        </div>
      </div>

      {/* Right Side Actions & User Profile */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Slack Connect Button/Badge */}
        <SlackConnect />

        {/* Compose Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onCompose}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-sm"
        >
          Compose Email
        </Button>

        <div className="h-6 w-px bg-dark-800" />

        {/* User Info & Avatar */}
        <div className="flex items-center gap-3">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name || 'User'}
              className="w-8 h-8 rounded-full border border-dark-700 object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400 text-xs font-semibold">
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </div>
          )}

          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-white leading-tight">
              {user?.name || user?.email || 'Logged in user'}
            </div>
            {user?.email && (
              <div className="text-[11px] text-dark-400 truncate max-w-[150px]">
                {user.email}
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            title="Log Out"
            className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-dark-800 transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

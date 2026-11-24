import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pills';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className = '',
}) => {
  if (variant === 'pills') {
    return (
      <div className={`flex items-center gap-1.5 p-1 bg-dark-900 rounded-xl border border-dark-800 ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-dark-450 text-dark-300 hover:text-white hover:bg-dark-800/60'
              }`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-primary-700/60 text-white'
                      : 'bg-dark-800 text-dark-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default 'underline' variant
  return (
    <div className={`border-b border-dark-800 flex items-center gap-8 ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 py-3.5 border-b-2 font-medium text-sm transition-all duration-150 ${
              isActive
                ? 'border-primary-500 text-primary-400 font-semibold'
                : 'border-transparent text-dark-400 hover:text-dark-200 hover:border-dark-700'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                  isActive
                    ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                    : 'bg-dark-800 text-dark-400 border border-dark-700/50'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;

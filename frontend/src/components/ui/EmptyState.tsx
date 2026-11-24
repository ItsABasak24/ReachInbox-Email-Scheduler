import React from 'react';
import Button from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-dark-800 bg-dark-900/40 ${className}`}
    >
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-dark-800/80 border border-dark-750 flex items-center justify-center text-dark-400 mb-4 shadow-inner">
          {icon}
        </div>
      )}
      <h4 className="text-base font-semibold text-white mb-1.5">{title}</h4>
      {description && (
        <p className="text-sm text-dark-400 max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant="primary"
          size="sm"
          onClick={action.onClick}
          leftIcon={action.icon}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;

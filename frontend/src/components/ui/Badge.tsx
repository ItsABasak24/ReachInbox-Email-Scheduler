import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'info' | 'error' | 'default';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  dot = false,
}) => {
  const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string; dot: string }> = {
    success: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      dot: 'bg-emerald-400',
    },
    warning: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      dot: 'bg-amber-400',
    },
    info: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/20',
      dot: 'bg-blue-400',
    },
    error: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20',
      dot: 'bg-rose-400',
    },
    default: {
      bg: 'bg-dark-800',
      text: 'text-dark-300',
      border: 'border-dark-700',
      dot: 'bg-dark-400',
    },
  };

  const style = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />}
      <span>{children}</span>
    </span>
  );
};

export default Badge;

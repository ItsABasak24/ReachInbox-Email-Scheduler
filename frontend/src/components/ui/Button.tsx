import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-950 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-lg';

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-950/30 focus:ring-primary-500 active:bg-primary-700 border border-primary-500/30',
    secondary:
      'bg-dark-800 hover:bg-dark-700 text-dark-100 hover:text-white border border-dark-700 focus:ring-dark-500 active:bg-dark-900',
    danger:
      'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/30 focus:ring-red-500 active:bg-red-700 border border-red-500/30',
    ghost:
      'bg-transparent hover:bg-dark-800/80 text-dark-300 hover:text-white focus:ring-dark-500',
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Button;

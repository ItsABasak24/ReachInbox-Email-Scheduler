import React from 'react';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerColor = 'primary' | 'white' | 'gray';

export interface SpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const sizeStyles: Record<SpinnerSize, string> = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  };

  const colorStyles: Record<SpinnerColor, string> = {
    primary: 'border-primary-500/20 border-t-primary-500',
    white: 'border-white/20 border-t-white',
    gray: 'border-dark-700 border-t-dark-300',
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full ${sizeStyles[size]} ${colorStyles[color]} ${className}`}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;

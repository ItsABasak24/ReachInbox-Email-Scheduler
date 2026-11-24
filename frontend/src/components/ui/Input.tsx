import React, { forwardRef } from 'react';

export interface BaseInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  isTextarea?: boolean;
  rows?: number;
}

export type InputProps = BaseInputProps &
  React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      isTextarea = false,
      rows = 4,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const inputClasses = `w-full rounded-lg bg-dark-800/90 border ${
      error
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
        : 'border-dark-700 focus:border-primary-500 focus:ring-primary-500/20'
    } text-white placeholder-dark-400 text-sm transition-colors duration-150 focus:outline-none focus:ring-2 ${
      leftIcon ? 'pl-10' : 'pl-3.5'
    } pr-3.5 py-2.5 disabled:opacity-50 disabled:bg-dark-900 disabled:cursor-not-allowed ${className}`;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-dark-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-400">
              {leftIcon}
            </div>
          )}
          {isTextarea ? (
            <textarea
              id={inputId}
              ref={ref as React.Ref<HTMLTextAreaElement>}
              rows={rows}
              className={`${inputClasses} resize-y min-h-[100px]`}
              {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              id={inputId}
              ref={ref as React.Ref<HTMLInputElement>}
              className={inputClasses}
              {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
            />
          )}
        </div>
        {error ? (
          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-dark-400 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

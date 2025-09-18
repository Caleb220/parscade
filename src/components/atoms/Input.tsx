import React, { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import type { ComponentWithRef } from '../../types/common';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label?: string;
  readonly error?: string;
  readonly helperText?: string;
  readonly leftIcon?: React.ReactNode;
  readonly rightIcon?: React.ReactNode;
  readonly variant?: 'default' | 'filled';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      variant = 'default',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? `input-${Math.random().toString(36).slice(2, 11)}`;

    const baseClasses = 'block w-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses: Record<NonNullable<InputProps['variant']>, string> = {
      default: 'border border-gray-300 rounded-md px-3 py-2 bg-white',
      filled: 'border-0 rounded-md px-3 py-2 bg-gray-100 focus:bg-white',
    };

    const errorClasses = error
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
      : '';

    const iconPadding = leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : '';

    const inputClasses = [
      baseClasses,
      variantClasses[variant],
      errorClasses,
      iconPadding,
      className,
    ].join(' ');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">{leftIcon}</span>
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400">{rightIcon}</span>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
) as ComponentWithRef<InputProps, HTMLInputElement>;

Input.displayName = 'Input';

export default Input;
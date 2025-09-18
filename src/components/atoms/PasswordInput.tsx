import React, { useState, forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { validatePassword, getPasswordStrengthLabel, getPasswordStrengthColor } from '../../utils/passwordValidation';
import type { ComponentWithRef } from '../../types/common';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  readonly label?: string;
  readonly error?: string;
  readonly helperText?: string;
  readonly showStrengthMeter?: boolean;
  readonly variant?: 'default' | 'filled';
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      label,
      error,
      helperText,
      showStrengthMeter = false,
      variant = 'default',
      className = '',
      id,
      value = '',
      onChange,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id ?? `password-${Math.random().toString(36).slice(2, 11)}`;
    
    const passwordStrength = showStrengthMeter && typeof value === 'string' 
      ? validatePassword(value) 
      : null;

    const baseClasses = 'block w-full pr-12 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses: Record<NonNullable<PasswordInputProps['variant']>, string> = {
      default: 'border border-gray-300 rounded-md px-3 py-2 bg-white',
      filled: 'border-0 rounded-md px-3 py-2 bg-gray-100 focus:bg-white',
    };

    const errorClasses = error
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
      : '';

    const inputClasses = [
      baseClasses,
      variantClasses[variant],
      errorClasses,
      className,
    ].join(' ');

    const togglePasswordVisibility = (): void => {
      setShowPassword(!showPassword);
    };

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
          <input
            ref={ref}
            id={inputId}
            type={showPassword ? 'text' : 'password'}
            className={inputClasses}
            value={value}
            onChange={onChange}
            {...props}
          />
          
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors duration-200"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Password Strength Meter */}
        <AnimatePresence>
          {showStrengthMeter && value && passwordStrength && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Password strength</span>
                <span className={`text-xs font-medium ${
                  passwordStrength.score >= 4 ? 'text-green-600' : 
                  passwordStrength.score >= 3 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {getPasswordStrengthLabel(passwordStrength.score)}
                </span>
              </div>
              
              <div className="flex space-x-1 mb-2">
                {Array.from({ length: 5 }, (_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      index < passwordStrength.score
                        ? getPasswordStrengthColor(passwordStrength.score)
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              
              {passwordStrength.feedback.length > 0 && (
                <ul className="text-xs text-gray-600 space-y-1">
                  {passwordStrength.feedback.map((feedback, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-1 h-1 bg-gray-400 rounded-full mr-2 flex-shrink-0" />
                      {feedback}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-600"
          >
            {error}
          </motion.p>
        )}
        
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
) as ComponentWithRef<PasswordInputProps, HTMLInputElement>;

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, User, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import Button from '../../../components/atoms/Button';
import Input from '../../../components/atoms/Input';
import PasswordInput from '../../../components/atoms/PasswordInput';
import { useAuth } from '../context/AuthContext';
import { FormErrors } from '../types/authTypes';
import { validatePassword } from '../../../utils/passwordValidation';

interface AuthFormProps {
  mode: 'signin' | 'signup';
  onModeChange: (mode: 'signin' | 'signup') => void;
  onSuccess?: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onModeChange, onSuccess }) => {
  const { signIn, signUp, resetPassword, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  // Clear errors when switching modes or when auth error changes
  useEffect(() => {
    setFormErrors({});
    clearError();
  }, [mode, clearError]);

  // Rate limiting for failed attempts
  const isRateLimited = attemptCount >= 5;
  const rateLimitResetTime = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    if (isRateLimited) {
      const timer = setTimeout(() => {
        setAttemptCount(0);
      }, rateLimitResetTime);
      return () => clearTimeout(timer);
    }
  }, [isRateLimited, rateLimitResetTime]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (mode === 'signup') {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        errors.password = 'Password does not meet security requirements';
      }
    }

    // Full name validation for signup
    if (mode === 'signup') {
      if (!formData.fullName.trim()) {
        errors.fullName = 'Full name is required';
      } else if (formData.fullName.trim().length < 2) {
        errors.fullName = 'Full name must be at least 2 characters';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRateLimited) {
      setFormErrors({ general: 'Too many failed attempts. Please wait 5 minutes before trying again.' });
      return;
    }

    if (!validateForm()) return;

    // Clear any existing errors before attempting auth
    setFormErrors({});
    clearError();

    try {
      if (mode === 'signin') {
        await signIn(formData.email, formData.password);
      } else {
        await signUp(formData.email, formData.password, formData.fullName);
      }

      // Reset attempt count on success
      setAttemptCount(0);
      onSuccess?.();
    } catch (authError) {
      // Increment attempt count on failure
      setAttemptCount((prev) => prev + 1);

      // Always show error message from auth context or fallback
      const errorMessage = error || 'Authentication failed. Please review your details and try again.';
      setFormErrors((prev) => ({
        ...prev,
        general: errorMessage,
      }));
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail) {
      setFormErrors({ email: 'Email is required' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      setFormErrors({ email: 'Please enter a valid email address' });
      return;
    }

    try {
      await resetPassword(resetEmail);
      setResetSuccess(true);
      setFormErrors({});
    } catch (resetError) {
      setFormErrors({ general: (resetError as Error).message });
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));

    // Clear field-specific error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Clear general error
    if (formErrors.general) {
      setFormErrors((prev) => ({ ...prev, general: undefined }));
    }

    clearError();
  };

  if (showResetPassword) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
          <p className="text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {resetSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-6 bg-green-50 rounded-lg border border-green-200"
          >
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">Check your email</h3>
            <p className="text-green-700 mb-4">
              We've sent a password reset link to {resetEmail}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setShowResetPassword(false);
                setResetSuccess(false);
                setResetEmail('');
              }}
            >
              Back to Sign In
            </Button>
          </motion.div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <Input
              type="email"
              label="Email Address"
              value={resetEmail}
              onChange={(event) => setResetEmail(event.target.value)}
              error={formErrors.email}
              leftIcon={<Mail className="w-5 h-5" />}
              placeholder="Enter your email"
              required
            />

            <div className="flex flex-col gap-4">
              <Button type="submit" fullWidth>
                Send Reset Link
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowResetPassword(false);
                  setResetSuccess(false);
                  setResetEmail('');
                  setFormErrors({});
                }}
              >
                Back to Sign In
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="text-gray-600">
          {mode === 'signin'
            ? 'Sign in to your Parscade account'
            : 'Start transforming your documents today'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {mode === 'signup' && (
          <Input
            type="text"
            label="Full Name"
            value={formData.fullName}
            onChange={handleInputChange('fullName')}
            error={formErrors.fullName}
            leftIcon={<User className="w-5 h-5" />}
            placeholder="Enter your full name"
            required
          />
        )}

        <Input
          type="email"
          label="Email Address"
          value={formData.email}
          onChange={handleInputChange('email')}
          error={formErrors.email}
          leftIcon={<Mail className="w-5 h-5" />}
          placeholder="Enter your email"
          required
        />

        <PasswordInput
          label="Password"
          value={formData.password}
          onChange={handleInputChange('password')}
          error={formErrors.password}
          placeholder={mode === 'signin' ? 'Enter your password' : 'Create a strong password'}
          showStrengthMeter={mode === 'signup'}
          required
        />

        {mode === 'signin' && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => window.location.href = '/forgot-password'}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
            >
              Forgot your password?
            </button>
          </div>
        )}

        {/* Error Display */}
        <AnimatePresence>
          {(error || formErrors.general) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md"
            >
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
              <span className="text-sm text-red-700">
                {formErrors.general || error}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rate Limit Warning */}
        {isRateLimited && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-md"
          >
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" />
            <span className="text-sm text-yellow-700">
              Too many failed attempts. Please wait 5 minutes before trying again.
            </span>
          </motion.div>
        )}

        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
          disabled={isRateLimited}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => onModeChange(mode === 'signin' ? 'signup' : 'signin')}
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </motion.div>
  );
};

export default AuthForm;

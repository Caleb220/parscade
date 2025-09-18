import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Layout from '../../../components/templates/Layout';
import RecoveryLayout from '../../../components/templates/RecoveryLayout';
import Button from '../../../components/atoms/Button';
import LoadingSpinner from '../../../components/atoms/LoadingSpinner';
import {
  extractResetTokens,
  establishRecoverySession,
  updateUserPassword,
  generateSessionId,
  isRecoveryMode,
  completeRecoveryFlow,
  validatePasswordStrength,
  validatePasswordResetForm,
  type PasswordResetForm,
  type PasswordResetTokens,
} from '../../../services/passwordResetService';
import { logger } from '../../../services/logger';
import { trackFormSubmit } from '../../../utils/analytics';

/**
 * Enterprise-grade Reset Password page component.
 * Handles secure password reset flow with comprehensive validation and error handling.
 */
const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Component state
  const [formData, setFormData] = useState<PasswordResetForm>({
    password: '',
    confirmPassword: '',
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidSession, setIsValidSession] = useState<boolean>(false);
  const [resetTokens, setResetTokens] = useState<PasswordResetTokens | null>(null);
  const [inRecoveryMode, setInRecoveryMode] = useState<boolean>(false);
  const [isAutoLoggedIn, setIsAutoLoggedIn] = useState<boolean>(false);
  
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false,
  });
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sessionId] = useState(() => generateSessionId());

  // Prevent navigation loops
  const recoveryModeRef = useRef<boolean | null>(null);
  const initializationRef = useRef<boolean>(false);

  /**
   * Initialize password reset flow.
   */
  useEffect(() => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    // Check recovery mode
    if (recoveryModeRef.current === null) {
      const recoveryMode = isRecoveryMode();
      recoveryModeRef.current = recoveryMode;
      setInRecoveryMode(recoveryMode);
    }

    const initializeResetFlow = async (): Promise<void> => {
      try {
        logger.info('Initializing password reset flow', {
          context: { feature: 'password-reset', action: 'initialization' },
        });
        
        // Wait for auth loading to complete
        if (authLoading) {
          return;
        }
        
        // Check if user is already authenticated from reset link (auto-login scenario)
        if (isAuthenticated && user) {
          logger.info('User auto-logged in from reset link', {
            context: { feature: 'password-reset', action: 'autoLoginDetected' },
          });
          
          setIsAutoLoggedIn(true);
          setIsValidSession(true);
          setIsLoading(false);
          return;
        }
        
        // Try token-based flow
        const tokens = extractResetTokens();
        if (!tokens) {
          setError('Invalid or missing password reset tokens. Please request a new reset link.');
          setIsLoading(false);
          return;
        }
        
        setResetTokens(tokens);
        
        // Establish recovery session
        await establishRecoverySession(tokens);
        
        setIsValidSession(true);
        setIsLoading(false);
        setError(null);
        
        logger.info('Password reset flow initialized successfully', {
          context: { feature: 'password-reset', action: 'initializationComplete' },
        });
        
      } catch (error) {
        logger.error('Password reset initialization failed', {
          context: { feature: 'password-reset', action: 'initialization' },
          error: error instanceof Error ? error : new Error(String(error)),
        });
        
        setIsLoading(false);
        setError('Failed to initialize password reset. Please request a new reset link.');
      }
    };

    void initializeResetFlow();
  }, [isAuthenticated, user, authLoading]);

  /**
   * Handle form input changes.
   */
  const handleInputChange = useCallback(
    (field: keyof PasswordResetForm) =>
      (event: React.ChangeEvent<HTMLInputElement>): void => {
        const value = event.target.value;
        
        setFormData(prev => ({
          ...prev,
          [field]: value,
        }));

        // Clear field-specific error
        if (fieldErrors[field]) {
          setFieldErrors(prev => ({
            ...prev,
            [field]: undefined,
          }));
        }

        // Clear general error
        if (error) {
          setError(null);
        }
      },
    [fieldErrors, error]
  );

  /**
   * Toggle password visibility.
   */
  const togglePasswordVisibility = useCallback(
    (field: keyof typeof showPasswords) => (): void => {
      setShowPasswords(prev => ({
        ...prev,
        [field]: !prev[field],
      }));
    },
    []
  );

  /**
   * Handle password reset form submission.
   */
  const handleSubmit = useCallback(async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    // Validate form
    const validation = validatePasswordResetForm(formData);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      await updateUserPassword(formData, sessionId);
      
      trackFormSubmit('password-reset', true);
      setIsComplete(true);

      // Complete recovery flow after delay
      setTimeout(async () => {
        await completeRecoveryFlow();
      }, 2000);

    } catch (error) {
      logger.warn('Password reset submission failed', {
        context: { feature: 'password-reset', action: 'formSubmission' },
        error: error instanceof Error ? error : new Error(String(error)),
      });
      
      trackFormSubmit('password-reset', false);
      setError(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, sessionId]);

  // Get password strength for display
  const passwordStrength = formData.password ? validatePasswordStrength(formData.password) : null;

  // Choose layout based on recovery mode
  const LayoutComponent = inRecoveryMode ? RecoveryLayout : Layout;

  // Loading state
  if (isLoading || authLoading) {
    return (
      <LayoutComponent>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md w-full text-center"
          >
            <LoadingSpinner size="lg" className="mx-auto mb-6" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Validating Reset Link
            </h1>
            <p className="text-gray-600">
              Please wait while we verify your password reset request.
            </p>
          </motion.div>
        </div>
      </LayoutComponent>
    );
  }

  // Error state for invalid tokens
  if (!isValidSession && !isAutoLoggedIn && error) {
    return (
      <LayoutComponent>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md w-full text-center"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-4">
              Invalid Reset Link
            </h1>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/forgot-password')}
                size="lg"
                fullWidth
              >
                Request New Reset Link
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                size="lg"
                fullWidth
              >
                Back to Home
              </Button>
            </div>
          </motion.div>
        </div>
      </LayoutComponent>
    );
  }

  // Success state
  if (isComplete) {
    return (
      <LayoutComponent>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md w-full text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>
            <h1 className="text-xl font-semibold text-gray-900 mb-4">
              Password Updated Successfully!
            </h1>
            <p className="text-gray-600 mb-6">
              Your password has been updated. You will be redirected to sign in with your new password.
            </p>
            <div className="flex items-center justify-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Redirecting...
            </div>
          </motion.div>
        </div>
      </LayoutComponent>
    );
  }

  // Main reset password form
  if (!isValidSession && !isAutoLoggedIn) {
    return (
      <LayoutComponent>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md w-full text-center"
          >
            <LoadingSpinner size="lg" className="mx-auto mb-6" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Preparing Reset Form
            </h1>
            <p className="text-gray-600">
              Setting up your password reset form...
            </p>
          </motion.div>
        </div>
      </LayoutComponent>
    );
  }

  return (
    <LayoutComponent>
      <div className={`${inRecoveryMode ? '' : 'min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-white rounded-2xl p-8 shadow-sm border border-gray-100 w-full ${inRecoveryMode ? '' : 'max-w-md'}`}
        >
          {/* Auto-login notification */}
          {isAutoLoggedIn && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md"
            >
              <p className="text-sm text-blue-800">
                <strong>Reset Link Verified:</strong> You can now set a new password for your account.
              </p>
            </motion.div>
          )}

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Set New Password
            </h1>
            <p className="text-gray-600">
              Choose a strong password to secure your Parscade account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.password ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  className={`block w-full pr-12 border rounded-md px-3 py-2 bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    fieldErrors.password
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter your new password"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility('password')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.password ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
              
              {/* Password Strength Indicator */}
              {formData.password && passwordStrength && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Password strength</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength.isValid ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {passwordStrength.isValid ? 'Strong' : 'Weak'}
                    </span>
                  </div>
                  <div className="flex space-x-1 mb-2">
                    {Array.from({ length: 5 }, (_, index) => (
                      <div
                        key={index}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          passwordStrength.isValid && index < 5
                            ? 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  {passwordStrength.errors.length > 0 && (
                    <ul className="text-xs text-gray-600 space-y-1">
                      {passwordStrength.errors.slice(0, 3).map((error, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mr-2 flex-shrink-0" />
                          {error}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  className={`block w-full pr-12 border rounded-md px-3 py-2 bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    fieldErrors.confirmPassword
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Confirm your new password"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility('confirmPassword')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
                  <span className="text-sm text-red-700">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isSubmitting ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Security Notice:</strong> This password reset link is valid for one use only
              and will expire in 24 hours.
              {inRecoveryMode && ' You cannot navigate away during the recovery process.'}
            </p>
          </div>
        </motion.div>
      </div>
    </LayoutComponent>
  );
};

export default ResetPasswordPage;
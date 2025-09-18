import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
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
} from '../../../services/passwordResetService';
import {
  passwordResetFormSchema,
  type PasswordResetForm,
  type PasswordResetQuery,
} from '../../../schemas/auth/passwordReset';
import { validatePassword } from '../../../utils/passwordValidation';
import { formatErrorForUser } from '../../../utils/zodError';
import { logger } from '../../../services/logger';
import { trackFormSubmit } from '../../../utils/analytics';

/**
 * Enterprise-grade Reset Password page component.
 * Handles secure password reset flow with recovery mode detection.
 */
const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Component state
  const [formData, setFormData] = useState<PasswordResetForm>({
    password: '',
    confirmPassword: '',
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<number>(0);
  const [isValidSession, setIsValidSession] = useState<boolean>(false);
  const [resetTokens, setResetTokens] = useState<PasswordResetQuery | null>(null);
  const [inRecoveryMode, setInRecoveryMode] = useState<boolean>(false);
  
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false,
  });
  
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof PasswordResetForm, string>>>({});
  const [sessionId] = useState(() => generateSessionId());

  // Prevent navigation loops by checking recovery mode only once
  const recoveryModeRef = useRef<boolean | null>(null);

  /**
   * Initialize password reset flow with secure token extraction.
   */
  useEffect(() => {
    // Check if we're in recovery mode
    if (recoveryModeRef.current === null) {
      const recoveryMode = isRecoveryMode();
      recoveryModeRef.current = recoveryMode;
      setInRecoveryMode(recoveryMode);
    }
    
    if (recoveryModeRef.current) {
      logger.info('Password reset page loaded in recovery mode', {
        context: { feature: 'password-reset', action: 'recoveryModeDetected' },
      });
    }

    const initializeResetFlow = async (): Promise<void> => {
      try {
        logger.info('Initializing password reset flow', {
          context: { feature: 'password-reset', action: 'initialization' },
        });
        
        // Step 1: Extract tokens from URL BEFORE any signout operations
        const tokens = extractResetTokens();
        if (!tokens) {
          setError('Invalid password reset link. Please request a new one.');
          setIsLoading(false);
          return;
        }
        
        logger.debug('Reset tokens extracted successfully');
        setResetTokens(tokens);
        
        // Step 3: Establish recovery session using extracted tokens
        await establishRecoverySession(tokens);
        
        // Step 4: Mark session as valid
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
        setError(formatErrorForUser(error, 'Failed to initialize password reset. Please request a new reset link.'));
      }
    };

    void initializeResetFlow();
  }, []);

  /**
   * Handle form input changes with real-time validation.
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
   * Toggle password visibility for better UX.
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
   * Validate form data and show inline errors.
   */
  const validateForm = useCallback((): boolean => {
    const validation = passwordResetFormSchema.safeParse(formData);
    
    if (validation.success) {
      setFieldErrors({});
      return true;
    }

    const errors: Partial<Record<keyof PasswordResetForm, string>> = {};
    validation.error.issues.forEach(issue => {
      const field = issue.path[0] as keyof PasswordResetForm;
      if (field && !errors[field]) {
        errors[field] = issue.message;
      }
    });

    setFieldErrors(errors);
    return false;
  }, [formData]);

  /**
   * Handle password reset form submission.
   */
  const handleSubmit = useCallback(async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setAttempts(prev => prev + 1);

    try {
      await updateUserPassword(formData, sessionId);
      
      // Track successful reset
      trackFormSubmit('password-reset', true);
      
      setIsComplete(true);

      // Handle redirect based on recovery mode
      if (inRecoveryMode) {
        // In recovery mode: complete the flow properly
        setTimeout(async () => {
          await completeRecoveryFlow(false); // Keep user logged in
        }, 2000);
      } else {
        // Normal flow: redirect to home
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
      }

    } catch (error) {
      logger.warn('Reset password: form submission failed', {
        context: { feature: 'password-reset', action: 'formSubmission' },
        error: error instanceof Error ? error : new Error(String(error)),
      });
      
      // Track failed reset
      trackFormSubmit('password-reset', false);
      
      setError(formatErrorForUser(error));
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, sessionId, validateForm, navigate, inRecoveryMode]);

  /**
   * Get password strength for real-time feedback.
   */
  const passwordStrength = formData.password ? validatePassword(formData.password) : null;

  // Choose layout based on recovery mode
  const LayoutComponent = inRecoveryMode ? RecoveryLayout : Layout;

  // Loading state during token validation
  if (isLoading) {
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
  if (!isValidSession && error) {
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
                disabled={inRecoveryMode} // Block navigation in recovery mode
              >
                Request New Reset Link
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                size="lg"
                fullWidth
                disabled={inRecoveryMode} // Block navigation in recovery mode
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
              Your password has been updated successfully. 
              {inRecoveryMode ? ' Redirecting to your dashboard...' : ' Please sign in with your new password.'}
            </p>
            {!inRecoveryMode && (
              <Button
                onClick={() => navigate('/')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                size="lg"
                fullWidth
              >
                Sign In
              </Button>
            )}
          </motion.div>
        </div>
      </LayoutComponent>
    );
  }

  // Main reset password form
  return (
    <LayoutComponent>
      <div className={`${inRecoveryMode ? '' : 'min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-white rounded-2xl p-8 shadow-sm border border-gray-100 w-full ${inRecoveryMode ? '' : 'max-w-md'}`}
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Set New Password
            </h1>
            <p className="text-gray-600">
              {inRecoveryMode 
                ? 'Choose a strong password to secure your account.'
                : 'Choose a strong password to secure your Parscade account.'
              }
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
                      passwordStrength.score >= 4 ? 'text-green-600' : 
                      passwordStrength.score >= 3 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {passwordStrength.score >= 4 ? 'Strong' : 
                       passwordStrength.score >= 3 ? 'Good' : 'Weak'}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    {Array.from({ length: 5 }, (_, index) => (
                      <div
                        key={index}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          index < passwordStrength.score
                            ? passwordStrength.score >= 4 ? 'bg-green-500' :
                              passwordStrength.score >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="mt-2 text-xs text-gray-600 space-y-1">
                      {passwordStrength.feedback.slice(0, 3).map((feedback, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mr-2 flex-shrink-0" />
                          {feedback}
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
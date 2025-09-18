import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Layout from '../../../components/templates/Layout';
import Button from '../../../components/atoms/Button';
import LoadingSpinner from '../../../components/atoms/LoadingSpinner';
import {
  validateResetQuery,
  exchangeRecoverySession,
  updateUserPassword,
  generateSessionId,
} from '../../../services/passwordResetService';
import {
  passwordResetFormSchema,
  type PasswordResetForm,
  type PasswordResetState,
} from '../../../schemas/auth/passwordReset';
import { validatePassword } from '../../../utils/passwordValidation';
import { formatErrorForUser } from '../../../utils/zodError';
import { logWarn } from '../../../utils/log';
import { trackFormSubmit } from '../../../utils/analytics';
import { supabase } from '../../../lib/supabase';

/**
 * Enterprise-grade Reset Password page component.
 * Handles secure password reset flow with Supabase integration.
 */
const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Component state
  const [formData, setFormData] = useState<PasswordResetForm>({
    password: '',
      // Check if user was automatically logged in from reset link
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('✅ User automatically logged in from reset link');
        setIsValidSession(true);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
        }));
        return;
      }
      
    confirmPassword: '',
  });
  
  const [state, setState] = useState<PasswordResetState>({
    isLoading: true, // Start with loading to validate tokens
    isComplete: false,
    error: null,
    attempts: 0,
    lastAttempt: null,
  });
  
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false,
  });
  
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof PasswordResetForm, string>>>({});
  const [sessionId] = useState(() => generateSessionId());
  const [isValidSession, setIsValidSession] = useState(false);

  /**
   * Validate and exchange recovery tokens on component mount.
   */
  useEffect(() => {
    const initializeResetFlow = async (): Promise<void> => {
      try {
        console.log('🔄 Initializing reset flow...');
        console.log('🔍 Full URL:', window.location.href);
        console.log('🔍 Search params:', Object.fromEntries(searchParams.entries()));
        console.log('🔍 URL Hash:', window.location.hash);
        
        // Validate query parameters
        const resetQuery = validateResetQuery(searchParams);
        if (!resetQuery) {
          console.error('❌ Invalid query parameters');
          console.error('🔍 Current URL for debugging:', window.location.href);
          console.error('🔍 Expected URL format should include access_token');
          
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: 'No reset token found in URL. This usually indicates a Supabase configuration issue. Please check your email template and Site URL settings.',
          }));
          return;
        }

        console.log('✅ Query parameters validated');
        console.log('🔄 Exchanging recovery session...');
        
        // Exchange recovery session
        await exchangeRecoverySession(resetQuery);
        
        console.log('✅ Recovery session established');
        setIsValidSession(true);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
        }));
      } catch (error) {
        console.error('❌ Reset password session initialization failed:', error);
        logWarn('Reset password: session initialization failed');
        
        // Enhanced error handling for different failure modes
        let errorMessage = 'Failed to validate password reset link.';
        
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          
          if (message.includes('expired') || message.includes('invalid')) {
            errorMessage = 'This password reset link has expired or is invalid. Please request a new one.';
          } else if (message.includes('session')) {
            errorMessage = 'Unable to establish reset session. Please try the link again or request a new one.';
          } else if (message.includes('token')) {
            errorMessage = 'Invalid reset token. Please request a new password reset link.';
          } else {
            errorMessage = error.message;
          }
        }
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
      }
    };

    void initializeResetFlow();
  }, [searchParams]);

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
        if (state.error) {
          setState(prev => ({ ...prev, error: null }));
        }
      },
    [fieldErrors, state.error]
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

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      attempts: prev.attempts + 1,
      lastAttempt: new Date(),
    }));

    try {
      await updateUserPassword(formData, sessionId);
      
      // Track successful reset
      trackFormSubmit('password-reset', true);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isComplete: true,
      }));

      // Redirect to dashboard after success message
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 3000);

    } catch (error) {
      logWarn('Reset password: form submission failed');
      
      // Track failed reset
      trackFormSubmit('password-reset', false);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: formatErrorForUser(error),
      }));
    }
  }, [formData, sessionId, validateForm, navigate]);

  /**
   * Get password strength for real-time feedback.
   */
  const passwordStrength = formData.password ? validatePassword(formData.password) : null;

  // Loading state during token validation
  if (state.isLoading && !isValidSession) {
    return (
      <Layout>
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
      </Layout>
    );
  }

  // Error state for invalid tokens
  if (!isValidSession && state.error) {
    return (
      <Layout>
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
              {state.error}
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
      </Layout>
    );
  }

  // Success state
  if (state.isComplete) {
    return (
      <Layout>
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
              Your password has been updated. You'll be redirected to your dashboard shortly.
            </p>
            <Button
              onClick={() => navigate('/dashboard')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              size="lg"
              fullWidth
            >
              Go to Dashboard
            </Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  // Main reset password form
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 w-full max-w-md"
        >
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
              {state.error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
                  <span className="text-sm text-red-700">{state.error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={state.isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {state.isLoading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Security Notice:</strong> This password reset link is valid for one use only
              and will expire in 24 hours. Your new password will be encrypted and stored securely.
            </p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ResetPasswordPage;
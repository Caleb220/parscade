import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../../../components/templates/Layout';
import Button from '../../../components/atoms/Button';
import Input from '../../../components/atoms/Input';
import { useAuth } from '../context/AuthContext';
import { trackFormSubmit } from '../../../utils/analytics';
import { logger } from '../../../services/logger';

/**
 * Forgot Password page component for requesting password reset emails.
 * Provides secure email-based password reset flow with rate limiting.
 */
const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<number>(0);

  // Rate limiting configuration
  const MAX_ATTEMPTS = 3;
  const isRateLimited = attempts >= MAX_ATTEMPTS;

  /**
   * Validate email format.
   */
  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }, []);

  /**
   * Handle form submission with rate limiting.
   */
  const handleSubmit = useCallback(async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    
    if (isRateLimited) {
      setError('Too many reset requests. Please wait 15 minutes before trying again.');
      return;
    }

    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      setError('Email address is required.');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAttempts(prev => prev + 1);

    try {
      await resetPassword(trimmedEmail);
      
      trackFormSubmit('forgot-password', true);
      setIsSuccess(true);
    } catch (resetError) {
      logger.warn('Forgot password request failed', {
        context: { 
          feature: 'auth', 
          action: 'forgotPasswordRequest',
        },
        error: resetError instanceof Error ? resetError : new Error(String(resetError)),
      });
      
      trackFormSubmit('forgot-password', false);
      
      const errorMessage = resetError instanceof Error 
        ? resetError.message 
        : 'Failed to send password reset email. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [email, isRateLimited, resetPassword, validateEmail]);

  /**
   * Handle email input change.
   */
  const handleEmailChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setEmail(event.target.value);
    
    if (error) {
      setError(null);
    }
  }, [error]);

  // Success state
  if (isSuccess) {
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
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Check Your Email
            </h1>
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to <strong>{email}</strong>.
              Please check your inbox and follow the instructions to reset your password.
            </p>
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsSuccess(false);
                  setEmail('');
                  setAttempts(0);
                }}
                size="lg"
                fullWidth
              >
                Send Another Email
              </Button>
              <Button
                as={Link}
                to="/"
                variant="ghost"
                size="lg"
                fullWidth
              >
                Back to Home
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-6">
              Didn't receive the email? Check your spam folder or try again with a different email address.
            </p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  // Main forgot password form
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Forgot Password?
            </h1>
            <p className="text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="email"
              label="Email Address"
              value={email}
              onChange={handleEmailChange}
              leftIcon={<Mail className="w-5 h-5" />}
              placeholder="Enter your email address"
              error={error}
              required
            />

            {/* Rate Limiting Warning */}
            {attempts >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-md"
              >
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" />
                <span className="text-sm text-yellow-700">
                  {isRateLimited ? 
                    'Maximum attempts reached. Please wait 15 minutes.' :
                    `${MAX_ATTEMPTS - attempts} attempt${MAX_ATTEMPTS - attempts === 1 ? '' : 's'} remaining.`
                  }
                </span>
              </motion.div>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              disabled={isRateLimited}
            >
              {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
            </Button>
          </form>

          {/* Back to Sign In */}
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Sign In
            </Link>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Security Note:</strong> For your protection, we'll only send password reset
              emails to registered account addresses. If you don't receive an email, the address
              may not be associated with an account.
            </p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ForgotPasswordPage;
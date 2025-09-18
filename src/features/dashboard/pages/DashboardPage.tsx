import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Users, Settings, Plus } from 'lucide-react';
import Layout from '../../../components/templates/Layout';
import Button from '../../../components/atoms/Button';
import LoadingSpinner from '../../../components/atoms/LoadingSpinner';
import { useAuth } from '../../auth';
import AuthLoadingSkeleton from '../../../components/molecules/AuthLoadingSkeleton';
import StatCardGrid from '../components/StatCardGrid';

const DashboardPage: React.FC = () => {
  const { isEmailConfirmed, user, resendConfirmationEmail } = useAuth();
  const [isResendingEmail, setIsResendingEmail] = React.useState(false);
  const [resendSuccess, setResendSuccess] = React.useState(false);
  const prefersReducedMotion = useReducedMotion();

  const handleResendConfirmation = React.useCallback(async () => {
    if (!user?.email) return;

    setIsResendingEmail(true);
    try {
      await resendConfirmationEmail(user.email);
      setResendSuccess(true);
    } catch (error) {
      console.error('Failed to resend confirmation email:', error);
    } finally {
      setIsResendingEmail(false);
    }
  }, [resendConfirmationEmail, user?.email]);

  const betaUpdates = useMemo(
    () => [
      'Welcome to the Parscade beta program!',
      'Dashboard features coming in next release',
      'Share feedback via the contact form',
    ],
    [],
  );

  if (!isEmailConfirmed) {
    return (
      <Layout>
        <section className="bg-gray-50 min-h-screen" aria-labelledby="confirm-email-heading">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <motion.div
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? undefined : { duration: 0.6 }}
              className="bg-white rounded-lg p-8 shadow-sm border border-gray-100 text-center"
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h1 id="confirm-email-heading" className="text-2xl font-bold text-gray-900 mb-4">
                Confirm Your Email Address
              </h1>

              <p className="text-gray-600 mb-6">
                We've sent a confirmation email to <strong>{user?.email}</strong>. Please check your inbox and click the confirmation link to access your dashboard.
              </p>

              {resendSuccess ? (
                <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4" role="status">
                  <p className="text-green-800">Confirmation email sent! Please check your inbox.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Didn't receive the email? Check your spam folder or resend it.
                  </p>
                  <Button onClick={handleResendConfirmation} disabled={isResendingEmail} variant="primary">
                    {isResendingEmail ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Sending…</span>
                      </>
                    ) : (
                      'Resend Confirmation Email'
                    )}
                  </Button>
                </div>
              )}

              <div className="mt-8 border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-500">
                  Need help?{' '}
                  <a href="mailto:admin@parscade.com" className="text-blue-600 hover:text-blue-700">
                    Contact Support
                  </a>
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <header className="bg-white border-b border-gray-200" aria-labelledby="dashboard-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 id="dashboard-heading" className="text-2xl font-bold text-gray-900">
                Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}
              </h1>
              <p className="text-gray-600 mt-1">Manage your document processing workflows</p>
            </div>
            <Button leftIcon={<Plus className="w-4 h-4" />} aria-label="Create a new project">
              New Project
            </Button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10" aria-label="Dashboard content">
          <StatCardGrid />

          <section aria-labelledby="beta-updates" className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <motion.section
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={prefersReducedMotion ? undefined : { duration: 0.6, delay: 0.2 }}
              className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm"
              aria-labelledby="beta-updates"
            >
              <h2 id="beta-updates" className="text-lg font-semibold text-gray-900 mb-4">
                Beta Updates
              </h2>
              <ul className="space-y-4">
                {betaUpdates.map((update) => (
                  <li key={update} className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                      <div className="h-2 w-2 rounded-full bg-blue-600" aria-hidden />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{update}</p>
                      <p className="text-xs text-gray-500">Beta Program</p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.section>

            <motion.section
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={prefersReducedMotion ? undefined : { duration: 0.6, delay: 0.3 }}
              className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm"
              aria-labelledby="beta-feedback"
            >
              <h2 id="beta-feedback" className="text-lg font-semibold text-gray-900 mb-4">
                Beta Feedback
              </h2>
              <div className="flex h-32 flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-gray-600">Help us build better features</p>
                <div className="mt-3 flex gap-4">
                  <Button variant="outline" size="sm">Send Feedback</Button>
                  <Button variant="ghost" size="sm" leftIcon={<Settings className="h-4 w-4" />}>Beta Guide</Button>
                </div>
              </div>
            </motion.section>
          </section>

          <motion.section
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
            whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={prefersReducedMotion ? undefined : { duration: 0.6, delay: 0.4 }}
            className="rounded-lg border border-gray-100 bg-white p-8 shadow-sm"
            aria-labelledby="feature-preview"
          >
            <div className="text-center">
              <h2 id="feature-preview" className="text-xl font-semibold text-gray-900 mb-4">
                Help Us Build the Perfect Dashboard
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                As a beta user, your input directly shapes our product. Tell us what dashboard features would be most valuable for your document processing needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="primary">Share Feedback</Button>
                <Button variant="outline">Contact Team</Button>
              </div>
            </div>
          </motion.section>
        </main>
      </div>
    </Layout>
  );
};

export default DashboardPage;

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, FileText, Clock, Users, Settings, Plus } from 'lucide-react';
import Layout from '../components/templates/Layout';
import Button from '../components/atoms/Button';
import LoadingSpinner from '../components/atoms/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/organisms/AuthModal';
import AuthLoadingSkeleton from '../components/molecules/AuthLoadingSkeleton';

const DashboardPage: React.FC = () => {
  const { isAuthenticated, isEmailConfirmed, isLoading, user, resendConfirmationEmail } = useAuth();
  const [isResendingEmail, setIsResendingEmail] = React.useState(false);
  const [resendSuccess, setResendSuccess] = React.useState(false);

  // Redirect to auth if not authenticated
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to home page for authentication
      window.location.href = '/';
    }
  }, [isLoading, isAuthenticated]);

  const handleResendConfirmation = async () => {
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
  };

  if (isLoading) {
    return (
      <AuthLoadingSkeleton />
    );
  }

  // Show email confirmation notice if user is authenticated but email not confirmed
  if (isAuthenticated && !isEmailConfirmed) {
    return (
      <Layout>
        <div className="bg-gray-50 min-h-screen">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-lg p-8 shadow-sm border border-gray-100 text-center"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Confirm Your Email Address
              </h1>
              
              <p className="text-gray-600 mb-6">
                We've sent a confirmation email to <strong>{user?.email}</strong>. 
                Please check your inbox and click the confirmation link to access your dashboard.
              </p>
              
              {resendSuccess ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-800">
                    Confirmation email sent! Please check your inbox.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Didn't receive the email? Check your spam folder or resend it.
                  </p>
                  
                  <Button
                    onClick={handleResendConfirmation}
                    disabled={isResendingEmail}
                    variant="primary"
                  >
                    {isResendingEmail ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Sending...
                      </>
                    ) : (
                      'Resend Confirmation Email'
                    )}
                  </Button>
                </div>
              )}
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Need help? <a href="mailto:support@parscade.com" className="text-blue-600 hover:text-blue-700">Contact Support</a>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </Layout>
    );
  }
  return (
    <>
      <Layout>
        <div className="bg-gray-50 min-h-screen">
          {/* Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}
                  </h1>
                  <p className="text-gray-600 mt-1">Manage your document processing workflows</p>
                </div>
                <Button leftIcon={<Plus className="w-4 h-4" />}>
                  New Project
                </Button>
              </div>
            </div>
          </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Coming Soon Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-1">
                  Beta Dashboard
                </h3>
                <p className="text-blue-700">
                  Welcome to the Parscade beta! We're actively developing dashboard features. 
                  Your feedback helps us prioritize what to build next.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { icon: FileText, title: 'Beta Documents', value: '0', change: 'Start testing' },
              { icon: BarChart3, title: 'Beta Status', value: 'Active', change: 'Enrolled' },
              { icon: Clock, title: 'Feedback Sent', value: '0', change: 'Share ideas' },
              { icon: Users, title: 'Beta Community', value: '250+', change: 'Growing' },
            ].map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-lg p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="text-sm text-blue-600 font-medium">{stat.change}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.title}</div>
              </motion.div>
            ))}
          </div>

          {/* Placeholder Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Beta Updates</h3>
              <div className="space-y-4">
                {[
                  'Welcome to the Parscade beta program!',
                  'Dashboard features coming in next release',
                  'Share feedback via the contact form'
                ].map((update, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-900">{update}</div>
                      <div className="text-xs text-gray-500">Beta Program</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-100"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Beta Feedback</h3>
              <div className="flex items-center justify-center h-32 flex-col">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-gray-600">Help us build better features</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Send Feedback
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Feature Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8 bg-white rounded-lg p-8 shadow-sm border border-gray-100"
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Help Us Build the Perfect Dashboard
              </h3>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                As a beta user, your input directly shapes our product. Tell us what dashboard features 
                would be most valuable for your document processing needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="primary">
                  Share Feedback
                </Button>
                <Button variant="outline">
                  Contact Team
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      </Layout>

    </>
  );
};

export default DashboardPage;
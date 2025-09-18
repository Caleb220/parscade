import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Home, Mail, AlertTriangle } from 'lucide-react';
import { Link, useInRouterContext } from 'react-router-dom';
import Button from '../../../components/atoms/Button';
import Layout from '../../../components/templates/Layout';

interface ErrorPageProps {
  error?: Error;
  resetError?: () => void;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ error, resetError }) => {
  const isInRouter = useInRouterContext();

  const handleRetry = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  const handleReportIssue = () => {
    window.location.assign('mailto:admin@parscade.com?subject=Error Report #P500');
  };

  const page = (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full text-center"
      >
        {/* Error Icon */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <div className="text-sm text-gray-500 font-mono">#P500</div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Something went wrong
          </h1>
          <p className="text-gray-600 leading-relaxed mb-4">
            We encountered an unexpected error. Our team has been notified and
            is working to fix this issue.
          </p>

          {process.env.NODE_ENV === 'development' && error && (
            <details className="text-left bg-gray-100 rounded-lg p-4 mb-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                Error Details (Development)
              </summary>
              <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                {error.stack || error.message}
              </pre>
            </details>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleRetry}
              leftIcon={<RefreshCw className="w-4 h-4" />}
              size="lg"
            >
              Try Again
            </Button>

            {isInRouter ? (
              <Button
                as={Link}
                to="/"
                variant="outline"
                leftIcon={<Home className="w-4 h-4" />}
                size="lg"
              >
                Go Home
              </Button>
            ) : (
              <Button
                onClick={() => window.location.assign('/')}
                variant="outline"
                leftIcon={<Home className="w-4 h-4" />}
                size="lg"
              >
                Go Home
              </Button>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3">
              If this problem persists, please contact our support team.
            </p>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Mail className="w-4 h-4" />}
              onClick={handleReportIssue}
            >
              Report Issue
            </Button>
          </div>
        </motion.div>

        {/* Decorative Elements */}
        <motion.div
          animate={{
            y: [-8, 8, -8],
            rotate: [0, 3, -3, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-10 right-10 w-16 h-16 bg-red-100 rounded-full opacity-30"
        />

        <motion.div
          animate={{
            y: [8, -8, 8],
            rotate: [0, -3, 3, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1.5,
          }}
          className="absolute bottom-10 left-10 w-12 h-12 bg-orange-100 rounded-full opacity-30"
        />
      </motion.div>
    </div>
  );

  return isInRouter ? <Layout>{page}</Layout> : <div className="min-h-screen flex flex-col">{page}</div>;
};

export default ErrorPage;

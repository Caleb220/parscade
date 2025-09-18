import React from 'react';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../../components/atoms/Button';
import Layout from '../../../components/templates/Layout';

const NotFoundPage: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full text-center"
        >
          {/* Error Code */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <div className="text-8xl font-bold text-gray-300 mb-2">404</div>
            <div className="text-sm text-gray-500 font-mono">#P404</div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Page Not Found
            </h1>
            <p className="text-gray-600 leading-relaxed">
              The page you're looking for doesn't exist or has been moved. 
              Don't worry, it happens to the best of us.
            </p>
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
                as={Link}
                to="/"
                leftIcon={<Home className="w-4 h-4" />}
                size="lg"
              >
                Go Home
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                size="lg"
              >
                Go Back
              </Button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-3">
                Still having trouble? We're here to help.
              </p>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Mail className="w-4 h-4" />}
                onClick={() => window.location.assign('mailto:admin@parscade.com')}
              >
                Contact Support
              </Button>
            </div>
          </motion.div>

          {/* Decorative Elements */}
          <motion.div
            animate={{ 
              y: [-10, 10, -10],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
            className="absolute top-10 right-10 w-20 h-20 bg-blue-100 rounded-full opacity-20"
          />
          
          <motion.div
            animate={{ 
              y: [10, -10, 10],
              rotate: [0, -5, 5, 0]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              ease: 'easeInOut',
              delay: 1
            }}
            className="absolute bottom-10 left-10 w-16 h-16 bg-purple-100 rounded-full opacity-20"
          />
        </motion.div>
      </div>
    </Layout>
  );
};

export default NotFoundPage;

import React from 'react';
import { motion } from 'framer-motion';

const AuthLoadingSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-lg shadow-sm p-8 w-full max-w-md"
      >
        {/* Header skeleton */}
        <div className="text-center mb-8">
          <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto" />
        </div>

        {/* Form skeleton */}
        <div className="space-y-6">
          <div>
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-1/4" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
          
          <div>
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-1/3" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>

          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Footer skeleton */}
        <div className="mt-6 text-center">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3 mx-auto" />
        </div>
      </motion.div>
    </div>
  );
};

export default AuthLoadingSkeleton;
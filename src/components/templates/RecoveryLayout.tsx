import React, { ReactNode, useEffect } from 'react';
import { motion } from 'framer-motion';

interface RecoveryLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Minimal layout for password recovery flow.
 * No navigation, sidebar, or app shell - just centered content.
 */
const RecoveryLayout: React.FC<RecoveryLayoutProps> = ({ children, className = '' }) => {
  useEffect(() => {
    // Block navigation during recovery mode
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your password reset will be cancelled.';
      return e.returnValue;
    };

    // Block back/forward navigation
    const blockNavigation = () => {
      window.history.pushState(null, '', window.location.href);
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', blockNavigation);
    
    // Push initial state to block back navigation
    window.history.pushState(null, '', window.location.href);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', blockNavigation);
    };
  }, []);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center px-4 ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {children}
      </motion.div>
      
      {/* Recovery mode indicator */}
      <div className="fixed top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
        🔒 Password Recovery Mode
      </div>
    </div>
  );
};

export default RecoveryLayout;
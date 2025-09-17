import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Header from '../organisms/Header';
import Footer from '../organisms/Footer';
import ErrorBoundary from '../molecules/ErrorBoundary';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  return (
    <ErrorBoundary>
      <div className={`min-h-screen flex flex-col ${className}`}>
        <Header />
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1"
        >
          {children}
        </motion.main>
        <Footer />
      </div>
    </ErrorBoundary>
  );
};

export default Layout;
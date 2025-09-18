import React, { useEffect } from 'react';
import type { FC } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, ResetPasswordPage, ForgotPasswordPage } from './features/auth';
import { useAuth } from './features/auth';
import ErrorBoundary from './components/molecules/ErrorBoundary';
import HomePage from './features/marketing/pages/HomePage';
import ProductPage from './features/marketing/pages/ProductPage';
import { DashboardPage } from './features/dashboard';
import AccountPage from './features/account/pages/AccountPage';
import BillingPage from './features/marketing/pages/BillingPage';
import ContactPage from './features/marketing/pages/ContactPage';
import AboutPage from './features/marketing/pages/AboutPage';
import PrivacyPage from './features/marketing/pages/PrivacyPage';
import TermsPage from './features/marketing/pages/TermsPage';
import NotFoundPage from './features/marketing/pages/NotFoundPage';
import ErrorPage from './features/marketing/pages/ErrorPage';
import { updateSEO, defaultSEO } from './utils/seo';
import { isRecoveryMode } from './services/passwordResetService';
import type { SeoConfig } from './schemas';
import { analytics, trackPageView } from './utils/analytics';
import { logger } from './services/logger';
import { env } from './config/env';
import LoadingSpinner from './components/atoms/LoadingSpinner';

/**
 * Protected Route component that prevents authentication loops
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

/**
 * Public Route component that redirects authenticated users
 */
const PublicRoute: React.FC<{ children: React.ReactNode; redirectTo?: string }> = ({ 
  children, 
  redirectTo = '/dashboard' 
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }
  
  return <>{children}</>;
};

/**
 * Component to handle route changes and analytics.
 * Manages SEO updates and page view tracking for different routes.
 */
const RouteHandler: FC = () => {
  const location = useLocation();
  const inRecoveryMode = location.pathname === '/reset-password' && isRecoveryMode();

  useEffect(() => {
    // Define SEO configuration for each route
    const routeSEO: Record<string, Partial<SeoConfig>> = {
      '/': {
        title: 'Parscade',
        description: 'Intelligent document parsing platform that automatically extracts, structures, and delivers data from any document format with enterprise-grade accuracy.',
      },
      '/product': {
        title: 'Parscade',
        description: 'Discover how Parscade\'s intelligent parsing pipeline transforms documents through four seamless stages, delivering structured data ready for your applications.',
      },
      '/dashboard': {
        title: 'Parscade',
        description: 'Manage your document processing workflows with Parscade\'s intuitive dashboard.',
      },
      '/account': {
        title: 'Parscade',
        description: 'Manage your account preferences, security settings, and team configuration.',
      },
      '/billing': {
        title: 'Parscade',
        description: 'Choose the perfect plan for your document processing needs. Simple, transparent pricing with no hidden fees.',
      },
      '/contact': {
        title: 'Parscade',
        description: 'Get in touch with our team. We\'re here to help with any questions about Parscade.',
      },
      '/about': {
        title: 'Parscade',
        description: 'Learn about our mission to revolutionize document processing and join our beta program.',
      },
      '/privacy': {
        title: 'Parscade',
        description: 'How we protect your data and respect your privacy during our beta program.',
      },
      '/terms': {
        title: 'Parscade',
        description: 'Terms and conditions for using Parscade during our beta program.',
      },
      '/404': {
        title: 'Parscade - Page Not Found',
        description: 'The page you\'re looking for doesn\'t exist.',
      },
      '/error': {
        title: 'Parscade',
        description: 'An unexpected error occurred.',
      },
      '/reset-password': {
        title: 'Parscade - Reset Password',
        description: 'Set a new password for your Parscade account.',
      },
      '/forgot-password': {
        title: 'Parscade - Forgot Password',
        description: 'Request a password reset link for your Parscade account.',
      },
    } as const;

    const currentRoute = routeSEO[location.pathname];
    updateSEO({
      ...defaultSEO,
      ...currentRoute,
      url: `${window.location.origin}${location.pathname}`,
    });

    // Track page view
    trackPageView(location.pathname);
    
    // Log recovery mode detection
    if (inRecoveryMode) {
      logger.info('Recovery mode detected in app router', {
        context: { feature: 'password-reset', action: 'recoveryModeRouting' },
      });
    }
  }, [location, inRecoveryMode]);

  // In recovery mode, restrict routing to only the reset password page
  if (inRecoveryMode && location.pathname !== '/reset-password') {
    logger.warn('Attempted navigation during recovery mode blocked', {
      context: { feature: 'password-reset', action: 'navigationBlocked' },
      metadata: { attemptedPath: location.pathname },
    });
    
    // Redirect back to reset password page
    window.location.href = '/reset-password';
    return null;
  }
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/product" element={<ProductPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/account" element={
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        } />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/reset-password" element={
          <PublicRoute redirectTo="/dashboard">
            <ResetPasswordPage />
          </PublicRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        } />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
};

/**
 * Main application component.
 * Sets up providers, routing, and analytics initialization.
 */
const App: FC = () => {
  useEffect(() => {
    // Initialize analytics if API key is available
    if (env.analytics.key) {
      analytics.init(env.analytics.key);
    }
    
    // Set up global request context for Sentry
    logger.setContext('app', {
      version: import.meta.env?.VITE_APP_VERSION || '1.0.0',
      environment: import.meta.env?.MODE || 'development',
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  }, []);

  return (
    <ErrorBoundary fallback={<ErrorPage />}>
      <AuthProvider>
        <Router>
          <RouteHandler />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;

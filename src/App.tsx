import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/molecules/ErrorBoundary';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import DashboardPage from './pages/DashboardPage';
import AccountPage from './pages/AccountPage';
import BillingPage from './pages/BillingPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';
import ErrorPage from './pages/ErrorPage';
import { updateSEO, defaultSEO } from './utils/seo';
import { analytics, trackPageView } from './utils/analytics';

// Component to handle route changes and analytics
const RouteHandler: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Update SEO based on route
    const routeSEO = {
      '/': {
        title: 'Parscade - Transform Documents into Structured Data',
        description: 'Intelligent document parsing platform that automatically extracts, structures, and delivers data from any document format with enterprise-grade accuracy.',
      },
      '/product': {
        title: 'Product - Parscade Document Processing Platform',
        description: 'Discover how Parscade\'s intelligent parsing pipeline transforms documents through four seamless stages, delivering structured data ready for your applications.',
      },
      '/dashboard': {
        title: 'Dashboard - Parscade',
        description: 'Manage your document processing workflows with Parscade\'s intuitive dashboard.',
      },
      '/account': {
        title: 'Account Settings - Parscade',
        description: 'Manage your account preferences, security settings, and team configuration.',
      },
      '/billing': {
        title: 'Billing & Plans - Parscade',
        description: 'Choose the perfect plan for your document processing needs. Simple, transparent pricing with no hidden fees.',
      },
      '/contact': {
        title: 'Contact Us - Parscade',
        description: 'Get in touch with our team. We\'re here to help with any questions about Parscade.',
      },
      '/404': {
        title: 'Page Not Found - Parscade',
        description: 'The page you\'re looking for doesn\'t exist.',
      },
      '/error': {
        title: 'Error - Parscade',
        description: 'An unexpected error occurred.',
      },
    };

    const currentRoute = routeSEO[location.pathname as keyof typeof routeSEO];
    updateSEO({
      ...defaultSEO,
      ...currentRoute,
      url: `${window.location.origin}${location.pathname}`,
    });

    // Track page view
    trackPageView(location.pathname);
  }, [location]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/product" element={<ProductPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    // Initialize analytics
    analytics.init(import.meta.env.VITE_ANALYTICS_KEY);
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
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown } from 'lucide-react';
import Button from '../atoms/Button';
import AuthModal from '../../features/auth/components/AuthModal';
import UserMenu from './UserMenu';
import { useAuth } from '../../features/auth';

interface NavigationItem {
  label: string;
  href: string;
  children?: NavigationItem[];
  requiresAuth?: boolean;
}

const navigationItems: NavigationItem[] = [
  { label: 'Product', href: '/product' },
  { label: 'Dashboard', href: '/dashboard', requiresAuth: true },
  { label: 'Account', href: '/account', requiresAuth: true },
  { label: 'Billing', href: '/billing' },
  { label: 'Contact', href: '/contact' },
];

const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // Filter navigation items based on authentication status
  const visibleNavigationItems = navigationItems.filter(item => 
    !item.requiresAuth || isAuthenticated
  );

  const isActive = (href: string): boolean => {
    return location.pathname === href;
  };

  const toggleMobileMenu = (): void => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleDropdownToggle = (label: string): void => {
    setActiveDropdown(activeDropdown === label ? null : label);
  };

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };
  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <motion.img
              src="/main-logo.png"
              alt="Parscade Logo"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2 sm:mr-3"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            />
            <motion.div
              className="text-3xl font-black text-gray-900"
              style={{
                fontFamily: "'Poppins', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                fontWeight: 900,
                letterSpacing: '-0.01em',
              }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              Parscade
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {visibleNavigationItems.map((item) => (
              <div key={item.label} className="relative">
                {item.children ? (
                  <div>
                    <button
                      onClick={() => handleDropdownToggle(item.label)}
                      className="flex items-center text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors duration-200"
                    >
                      {item.label}
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </button>
                    <AnimatePresence>
                      {activeDropdown === item.label && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1"
                        >
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              to={child.href}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                              onClick={() => setActiveDropdown(null)}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    to={item.href}
                    className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                      isActive(item.href)
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            {isLoading ? (
              <div className="flex items-center space-x-4">
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
              </div>
            ) : isAuthenticated ? (
              <UserMenu />
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => openAuthModal('signin')}
                >
                  Sign In
                </Button>
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => openAuthModal('signup')}
                >
                  Join Beta
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 p-2"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-200"
          >
            <div className="px-4 py-2 space-y-1">
              {visibleNavigationItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`block px-3 py-2 text-base font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 pb-2 border-t border-gray-200 space-y-2">
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="h-10 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 bg-gray-200 rounded animate-pulse" />
                  </div>
                ) : isAuthenticated ? (
                  <div className="px-3 py-2">
                    <UserMenu />
                  </div>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      fullWidth
                      onClick={() => {
                        openAuthModal('signin');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Sign In
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      fullWidth
                      onClick={() => {
                        openAuthModal('signup');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Join Beta
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </nav>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
};

export default Navigation;
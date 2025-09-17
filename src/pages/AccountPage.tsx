import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/templates/Layout';
import { useAuth } from '../contexts/AuthContext';
import AuthLoadingSkeleton from '../components/molecules/AuthLoadingSkeleton';
import AccountSettings from '../components/organisms/AccountManagement';

const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuth();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return <AuthLoadingSkeleton />;
  }

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" role="banner">
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
            <p className="mt-1 text-gray-600">
              Manage your Parscade profile, security preferences, and integrations.
              {user?.email && (
                <span className="block text-sm text-blue-600 mt-1" aria-live="polite">
                  Signed in as {user.email}
                </span>
              )}
            </p>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" aria-label="Account settings">
          <AccountSettings />
        </main>
      </div>
    </Layout>
  );
};

export default AccountPage;

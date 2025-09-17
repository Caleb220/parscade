import React from 'react';
import Layout from '../components/templates/Layout';
import { useAuth } from '../contexts/AuthContext';
import AuthLoadingSkeleton from '../components/molecules/AuthLoadingSkeleton';
import AccountSettings from '../components/organisms/AccountManagement'


const AccountPage: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Redirect to auth if not authenticated
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to home page for authentication
      window.location.href = '/';
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <AuthLoadingSkeleton />
    );
  }

  return (
    <>
      <Layout>
        <div className="bg-gray-50 min-h-screen">
          {/* Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-gray-600 mt-1">
                Beta account management - features coming soon
                {user?.email && (
                  <span className="block text-sm text-blue-600 mt-1">
                    Signed in as {user.email}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AccountSettings />
          </div>
        </div>
      </Layout>

    </>
  );
};

export default AccountPage;
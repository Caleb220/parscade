import React from 'react';
import { motion } from 'framer-motion';
import { User, Settings, Shield, Bell, CreditCard } from 'lucide-react';
import Layout from '../components/templates/Layout';
import Button from '../components/atoms/Button';

const AccountPage: React.FC = () => {
  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-600 mt-1">Manage your account preferences and security settings</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Coming Soon Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-1">
                  Account Management Coming Soon
                </h3>
                <p className="text-blue-700">
                  We're building comprehensive account management features including profile settings, 
                  security options, and team management tools.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Preview Sections */}
          <div className="space-y-6">
            {[
              {
                icon: User,
                title: 'Profile Information',
                description: 'Update your personal information and preferences',
                features: ['Name and email', 'Profile picture', 'Contact preferences', 'Timezone settings']
              },
              {
                icon: Shield,
                title: 'Security & Privacy',
                description: 'Manage your security settings and privacy preferences',
                features: ['Password management', 'Two-factor authentication', 'API keys', 'Login history']
              },
              {
                icon: Bell,
                title: 'Notifications',
                description: 'Configure how and when you receive notifications',
                features: ['Email notifications', 'Processing alerts', 'Team updates', 'System announcements']
              },
              {
                icon: Settings,
                title: 'Integrations',
                description: 'Connect Parscade with your favorite tools and services',
                features: ['API integrations', 'Webhook configurations', 'Third-party apps', 'Custom connectors']
              }
            ].map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-lg p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <section.icon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h3>
                    <p className="text-gray-600 mb-4">{section.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      {section.features.map((feature) => (
                        <div key={feature} className="flex items-center text-sm text-gray-500">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Coming Soon
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Beta Program CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white text-center"
          >
            <h3 className="text-xl font-semibold mb-4">
              Want early access to account features?
            </h3>
            <p className="text-blue-100 mb-6">
              Join our beta program to get early access to new features and help shape the future of Parscade.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-white text-blue-600 hover:bg-gray-50">
                Join Beta Program
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                Contact Support
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default AccountPage;
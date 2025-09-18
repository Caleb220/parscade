import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, Lock, Users } from 'lucide-react';
import Layout from '../../../components/templates/Layout';

const PrivacyPage: React.FC = () => {
  const principles = [
    {
      icon: Shield,
      title: 'Data Protection',
      description: 'Your documents and data are encrypted in transit and at rest. We never store more than necessary.'
    },
    {
      icon: Eye,
      title: 'Transparency',
      description: 'We clearly explain what data we collect, why we need it, and how we use it. No hidden practices.'
    },
    {
      icon: Lock,
      title: 'Security First',
      description: 'Built with enterprise-grade security from day one. Regular audits and compliance checks.'
    },
    {
      icon: Users,
      title: 'User Control',
      description: 'You own your data. Delete it anytime, export it easily, and control who has access.'
    }
  ];

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Privacy Policy
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Your privacy is fundamental to everything we build. Here's how we protect your data and respect your rights.
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Last updated: January 2025 • Beta Version
              </p>
            </motion.div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Privacy Principles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Privacy Principles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {principles.map((principle, index) => (
                <motion.div
                  key={principle.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <principle.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{principle.title}</h3>
                      <p className="text-gray-600">{principle.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Policy Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 prose prose-lg max-w-none"
          >
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-blue-800 mb-0">
                <strong>Beta Notice:</strong> This privacy policy applies to our beta program. 
                We may update these terms as we develop our platform, always with advance notice to users.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Information</h3>
            <ul className="text-gray-600 mb-6">
              <li>Email address and name for account creation</li>
              <li>Authentication data (encrypted passwords)</li>
              <li>Profile preferences and settings</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Document Processing Data</h3>
            <ul className="text-gray-600 mb-6">
              <li>Documents you upload for processing (temporarily stored)</li>
              <li>Extracted data and processing results</li>
              <li>Usage analytics to improve our service</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Technical Information</h3>
            <ul className="text-gray-600 mb-8">
              <li>IP addresses and browser information</li>
              <li>API usage and performance metrics</li>
              <li>Error logs for debugging and improvement</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
            <ul className="text-gray-600 mb-8">
              <li><strong>Service Delivery:</strong> Process your documents and provide results</li>
              <li><strong>Account Management:</strong> Maintain your account and preferences</li>
              <li><strong>Product Improvement:</strong> Analyze usage to enhance our platform</li>
              <li><strong>Communication:</strong> Send important updates and beta program information</li>
              <li><strong>Security:</strong> Protect against fraud and unauthorized access</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security</h2>
            <p className="text-gray-600 mb-4">
              We implement industry-standard security measures including:
            </p>
            <ul className="text-gray-600 mb-8">
              <li>End-to-end encryption for data in transit</li>
              <li>AES-256 encryption for data at rest</li>
              <li>Regular security audits and penetration testing</li>
              <li>Access controls and authentication requirements</li>
              <li>Secure cloud infrastructure with leading providers</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-600 mb-4">You have the right to:</p>
            <ul className="text-gray-600 mb-8">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct your information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Export your data in a standard format</li>
              <li><strong>Objection:</strong> Opt out of certain data processing activities</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
            <p className="text-gray-600 mb-8">
              We retain your data only as long as necessary to provide our services. 
              Documents are typically processed and deleted within 24 hours unless you 
              choose to save results. Account data is retained until you delete your account.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Services</h2>
            <p className="text-gray-600 mb-8">
              We use select third-party services for infrastructure, analytics, and support. 
              All partners are required to maintain the same privacy standards we uphold. 
              We never sell your data to third parties.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-600 mb-4">
              Questions about privacy? We're here to help:
            </p>
            <ul className="text-gray-600 mb-8">
              <li>Email: admin@parscade.com</li>
              <li>Contact form: Available on our contact page</li>
              <li>Response time: Within 48 hours for privacy inquiries</li>
            </ul>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Beta Program Privacy</h3>
              <p className="text-gray-600 mb-0">
                As a beta user, you may be asked to provide feedback about our service. 
                This feedback helps us improve Parscade but is always voluntary. We may 
                use anonymized feedback in our product development process.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPage;
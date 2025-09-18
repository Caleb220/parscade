import React from 'react';
import { motion } from 'framer-motion';
import { FileText, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import Layout from '../../../components/templates/Layout';

const TermsPage: React.FC = () => {
  const highlights = [
    {
      icon: FileText,
      title: 'Beta Terms',
      description: 'Special terms for our beta program participants with flexible usage rights.'
    },
    {
      icon: AlertTriangle,
      title: 'Fair Use',
      description: 'Reasonable usage limits to ensure service quality for all beta users.'
    },
    {
      icon: CheckCircle,
      title: 'Your Rights',
      description: 'Clear rights and protections for beta users, including data ownership.'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Guidelines for participating in our beta community and feedback programs.'
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
                Terms of Service
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Clear, fair terms for using Parscade during our beta program and beyond.
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Last updated: January 2025 • Beta Version
              </p>
            </motion.div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Key Points */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Key Points</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {highlights.map((highlight, index) => (
                <motion.div
                  key={highlight.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <highlight.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{highlight.title}</h3>
                      <p className="text-gray-600">{highlight.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Terms Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 prose prose-lg max-w-none"
          >
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-blue-800 mb-0">
                <strong>Beta Program:</strong> These terms apply to our beta program. 
                We may update these terms as we develop our platform, with advance notice to users.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-6">
              By accessing or using Parscade, you agree to be bound by these Terms of Service. 
              If you don't agree to these terms, please don't use our service.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Beta Program Participation</h2>
            <p className="text-gray-600 mb-4">
              Parscade is currently in beta. This means:
            </p>
            <ul className="text-gray-600 mb-6">
              <li>The service may have bugs, limitations, or interruptions</li>
              <li>Features may change or be discontinued</li>
              <li>We may request feedback about your experience</li>
              <li>Beta access may be limited or revoked at our discretion</li>
              <li>No service level agreements (SLAs) apply during beta</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Registration</h2>
            <p className="text-gray-600 mb-4">
              To use Parscade, you must:
            </p>
            <ul className="text-gray-600 mb-6">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Be at least 18 years old or have parental consent</li>
              <li>Use the service only for lawful purposes</li>
              <li>Not share your account with others</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use</h2>
            <p className="text-gray-600 mb-4">
              You may not use Parscade to:
            </p>
            <ul className="text-gray-600 mb-6">
              <li>Process illegal, harmful, or inappropriate content</li>
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Attempt to reverse engineer or hack our service</li>
              <li>Overload our systems or interfere with other users</li>
              <li>Process personal data without proper consent</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data and Privacy</h2>
            <p className="text-gray-600 mb-4">
              Regarding your data:
            </p>
            <ul className="text-gray-600 mb-6">
              <li>You retain ownership of all documents and data you upload</li>
              <li>We process your data only as necessary to provide our service</li>
              <li>We implement security measures to protect your data</li>
              <li>You're responsible for ensuring you have rights to process uploaded content</li>
              <li>See our Privacy Policy for detailed information</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Service Availability</h2>
            <p className="text-gray-600 mb-6">
              During beta, we strive for high availability but cannot guarantee uninterrupted service. 
              We may perform maintenance, updates, or modifications that temporarily affect service availability.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
            <p className="text-gray-600 mb-6">
              Parscade and its technology are protected by intellectual property laws. 
              You may not copy, modify, or distribute our software or content without permission. 
              You grant us a limited license to process your uploaded documents to provide our service.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-600 mb-6">
              As a beta service, Parscade is provided "as is" without warranties. 
              We're not liable for any damages arising from your use of the service, 
              including data loss, business interruption, or other indirect damages.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Termination</h2>
            <p className="text-gray-600 mb-6">
              Either party may terminate your account at any time. Upon termination, 
              your access to the service will cease, and we'll delete your data according 
              to our retention policies. You may export your data before termination.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to Terms</h2>
            <p className="text-gray-600 mb-6">
              We may update these terms as our service evolves. We'll notify users of 
              significant changes via email or through our service. Continued use after 
              changes constitutes acceptance of the new terms.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Information</h2>
            <p className="text-gray-600 mb-4">
              Questions about these terms? Contact us:
            </p>
            <ul className="text-gray-600 mb-8">
              <li>Email: admin@parscade.com</li>
              <li>Contact form: Available on our contact page</li>
              <li>Response time: Within 5 business days</li>
            </ul>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Beta Program Benefits</h3>
              <p className="text-gray-600 mb-0">
                As a beta user, you get early access to new features, direct communication 
                with our team, and the opportunity to influence our product development. 
                Thank you for helping us build something amazing!
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default TermsPage;
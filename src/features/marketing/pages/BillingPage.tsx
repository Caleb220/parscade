import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Check, Zap, Star, Shield } from 'lucide-react';
import Layout from '../../../components/templates/Layout';
import Button from '../../../components/atoms/Button';

const BillingPage: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Starter',
      monthlyPrice: 29,
      annualPrice: 23, // 20% discount
      period: '/month',
      description: 'Perfect for small teams getting started with document processing',
      features: [
        '1,000 documents/month',
        'Basic parsing features',
        'API access',
        'Email support',
        '99.5% uptime SLA'
      ],
      popular: false
    },
    {
      name: 'Professional',
      monthlyPrice: 99,
      annualPrice: 79, // 20% discount
      period: '/month',
      description: 'Advanced features for growing businesses and teams',
      features: [
        '10,000 documents/month',
        'Advanced parsing & AI',
        'Custom integrations',
        'Priority support',
        '99.9% uptime SLA',
        'Team collaboration',
        'Advanced analytics'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      monthlyPrice: null,
      annualPrice: null,
      period: '',
      description: 'Tailored solutions for large organizations',
      features: [
        'Unlimited documents',
        'Custom AI models',
        'Dedicated infrastructure',
        '24/7 phone support',
        '99.99% uptime SLA',
        'Advanced security',
        'Custom integrations',
        'Dedicated success manager'
      ],
      popular: false
    }
  ];

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900">Billing & Plans</h1>
            <p className="text-gray-600 mt-1">Future pricing plans - currently in beta development</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Pricing Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Future Pricing Plans
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              We're still in beta, but here's our planned pricing structure. Beta users get special early access pricing.
            </p>
            
            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 mb-8">
              <button 
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  !isAnnual 
                    ? 'text-gray-900 bg-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isAnnual 
                    ? 'text-gray-900 bg-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Annual
                <span className="ml-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative bg-white rounded-2xl shadow-sm border ${
                  plan.popular 
                    ? 'border-blue-200 ring-2 ring-blue-100' 
                    : 'border-gray-200'
                } p-8`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.monthlyPrice ? (
                        `$${isAnnual ? plan.annualPrice : plan.monthlyPrice}`
                      ) : (
                        'Custom'
                      )}
                    </span>
                    <span className="text-gray-600 ml-1">{plan.period}</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <Button
                    variant={plan.popular ? 'primary' : 'outline'}
                    size="lg"
                    fullWidth
                  >
                    {plan.name === 'Enterprise' ? 'Contact Us' : 'Join Beta'}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Features Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-16"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              What we're building
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Lightning Fast</h4>
                <p className="text-gray-600">Targeting sub-second processing with cloud-native architecture</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Enterprise Security</h4>
                <p className="text-gray-600">Building with enterprise security and compliance from day one</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Flexible Billing</h4>
                <p className="text-gray-600">Simple, transparent pricing with no hidden fees</p>
              </div>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Beta Program FAQ
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  question: 'What does beta access include?',
                  answer: 'Beta users get early access to our platform, direct feedback channels with our team, and special pricing when we launch.'
                },
                {
                  question: 'When will the full platform launch?',
                  answer: 'We\'re targeting a full launch in 2025. Beta users will be the first to know and get priority access.'
                },
                {
                  question: 'How can I influence the product?',
                  answer: 'Beta users have direct access to our product team and can request features, report issues, and shape our roadmap.'
                },
                {
                  question: 'What are the beta requirements?',
                  answer: 'Just enthusiasm for better document processing! We welcome feedback from users of all technical levels.'
                }
              ].map((faq, index) => (
                <div key={index}>
                  <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mt-16"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Join our beta program
            </h3>
            <p className="text-gray-600 mb-8">
              Be among the first to experience the future of document processing. Help us build something amazing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">
                Join Beta Program
              </Button>
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default BillingPage;

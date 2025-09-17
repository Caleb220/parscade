import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Check, Zap, Star, Shield } from 'lucide-react';
import Layout from '../components/templates/Layout';
import Button from '../components/atoms/Button';

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
            <p className="text-gray-600 mt-1">Choose the perfect plan for your document processing needs</p>
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
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Start free, scale as you grow. No hidden fees, no surprises.
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
                    disabled
                  >
                    {plan.name === 'Enterprise' ? 'Contact Sales' : 'Coming Soon'}
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
              All plans include
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Lightning Fast</h4>
                <p className="text-gray-600">Process documents in seconds with our optimized infrastructure</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Enterprise Security</h4>
                <p className="text-gray-600">Bank-grade encryption and SOC 2 compliance included</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Flexible Billing</h4>
                <p className="text-gray-600">Pay only for what you use with transparent pricing</p>
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
              Frequently Asked Questions
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  question: 'Can I change plans anytime?',
                  answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.'
                },
                {
                  question: 'What happens if I exceed my limit?',
                  answer: 'We\'ll notify you before you reach your limit and help you upgrade to avoid any service interruption.'
                },
                {
                  question: 'Do you offer custom pricing?',
                  answer: 'Yes, we offer custom enterprise pricing for high-volume customers with specific requirements.'
                },
                {
                  question: 'Is there a free trial?',
                  answer: 'Yes, all plans come with a 14-day free trial. No credit card required to get started.'
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
              Ready to get started?
            </h3>
            <p className="text-gray-600 mb-8">
              Join thousands of companies already using Parscade to transform their document workflows.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" disabled>
                Start Free Trial
              </Button>
              <Button variant="outline" size="lg">
                Contact Sales
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default BillingPage;
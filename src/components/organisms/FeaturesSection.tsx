import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Zap, 
  Database, 
  Shield, 
  BarChart3, 
  Webhook,
  Clock,
  Users,
  Globe
} from 'lucide-react';
import FeatureCard from '../molecules/FeatureCard';

const features = [
  {
    title: 'Multi-Format Support',
    description: 'Process PDFs, Word documents, images, spreadsheets, and more with unified parsing capabilities.',
    icon: FileText,
  },
  {
    title: 'Lightning Fast Processing',
    description: 'Advanced algorithms deliver results in seconds, not minutes. Scale to thousands of documents effortlessly.',
    icon: Zap,
  },
  {
    title: 'Structured Output',
    description: 'Get clean, structured data in JSON, CSV, or XML formats ready for your applications and databases.',
    icon: Database,
  },
  {
    title: 'Enterprise Security',
    description: 'Bank-grade encryption, SOC 2 compliance, and GDPR-ready data handling for complete peace of mind.',
    icon: Shield,
  },
  {
    title: 'Advanced Analytics',
    description: 'Real-time insights into processing performance, accuracy metrics, and usage patterns.',
    icon: BarChart3,
  },
  {
    title: 'API & Webhooks',
    description: 'Seamless integration with your existing systems through RESTful APIs and real-time webhooks.',
    icon: Webhook,
  },
  {
    title: '24/7 Processing',
    description: 'Round-the-clock document processing with 99.9% uptime SLA and automatic failover.',
    icon: Clock,
  },
  {
    title: 'Team Collaboration',
    description: 'Built-in collaboration tools, role-based access control, and audit trails for team workflows.',
    icon: Users,
  },
  {
    title: 'Global Infrastructure',
    description: 'Distributed processing centers worldwide ensure low latency and data residency compliance.',
    icon: Globe,
  },
];

const FeaturesSection: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Everything you need to process documents at scale
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From simple text extraction to complex data structuring, Parscade provides enterprise-grade tools for every document processing challenge.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-16"
        >
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to transform your document workflow?
            </h3>
            <p className="text-gray-600 mb-6">
              Join thousands of companies already using Parscade to streamline their document processing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200">
                Start Free Trial
              </button>
              <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200">
                Schedule Demo
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
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
import FeatureCard from '../../../components/molecules/FeatureCard';
import Button from '../../../components/atoms/Button';
import { useAuth } from '../../auth';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    title: 'Multi-Format Support',
    description: 'Designed to handle PDFs, Word documents, images, spreadsheets, and more with intelligent format detection.',
    icon: FileText,
  },
  {
    title: 'Lightning Fast Processing',
    description: 'Architecting for speed - targeting sub-second processing times with cloud-native scalability.',
    icon: Zap,
  },
  {
    title: 'Structured Output',
    description: 'Clean, structured data output in JSON, CSV, or XML formats, designed for seamless integration.',
    icon: Database,
  },
  {
    title: 'Enterprise Security',
    description: 'Building with enterprise-grade encryption, SOC 2 compliance, and GDPR-ready data handling from day one.',
    icon: Shield,
  },
  {
    title: 'Advanced Analytics',
    description: 'Comprehensive analytics dashboard for processing performance, accuracy metrics, and usage insights.',
    icon: BarChart3,
  },
  {
    title: 'API & Webhooks',
    description: 'Developer-friendly APIs and webhooks designed for seamless integration with your existing systems.',
    icon: Webhook,
  },
  {
    title: '24/7 Processing',
    description: 'Designing for 24/7 availability with high uptime targets and automatic failover capabilities.',
    icon: Clock,
  },
  {
    title: 'Team Collaboration',
    description: 'Team collaboration features with role-based access control and audit trails for enterprise workflows.',
    icon: Users,
  },
  {
    title: 'Global Infrastructure',
    description: 'Planning global infrastructure for low latency processing and data residency compliance.',
    icon: Globe,
  },
];

const FeaturesSection: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleJoinBetaClick = (): void => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      // Scroll to top to show the auth modal from hero section
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            The future of document processing
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            We're building intelligent tools that will revolutionize how businesses handle document processing. Here's what we're working on.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
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
              Want to be part of the journey?
            </h3>
            <p className="text-gray-600 mb-6">
              Join our beta program and help us build the future of document processing. Your feedback will directly shape our product.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleJoinBetaClick}>
                {isAuthenticated ? 'Go to Dashboard' : 'Join Beta Program'}
              </Button>
              <Button variant="outline">
                Learn More
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;

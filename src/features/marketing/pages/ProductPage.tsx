import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Zap, 
  Database, 
  Send, 
  ArrowRight, 
  CheckCircle,
  Code,
  BarChart3
} from 'lucide-react';
import Layout from '../../../components/templates/Layout';
import Button from '../../../components/atoms/Button';
import { useAuth } from '../../auth';
import { useNavigate } from 'react-router-dom';

const ProductPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleJoinBetaClick = (): void => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/', { state: { openAuthModal: true } });
    }
  };

  const pipelineSteps = [
    {
      icon: FileText,
      title: 'Document Ingestion',
      description: 'Upload documents through our web interface, API, or automated integrations. We support PDFs, Word docs, images, spreadsheets, and more.',
      features: [
        'Drag & drop interface',
        'Bulk upload capabilities',
        'API integration',
        'Automated folder monitoring',
        'Cloud storage connectors'
      ]
    },
    {
      icon: Zap,
      title: 'Intelligent Parsing',
      description: 'Our AI-powered engine analyzes document structure, extracts text, and identifies key data points with industry-leading accuracy.',
      features: [
        'OCR for scanned documents',
        'Table extraction',
        'Form field recognition',
        'Multi-language support',
        'Custom parsing rules'
      ]
    },
    {
      icon: Database,
      title: 'Data Structuring',
      description: 'Transform extracted content into clean, structured formats with customizable schemas and validation rules.',
      features: [
        'JSON/XML/CSV output',
        'Custom data schemas',
        'Data validation',
        'Field mapping',
        'Quality scoring'
      ]
    },
    {
      icon: Send,
      title: 'Delivery & Integration',
      description: 'Seamlessly deliver processed data to your systems through APIs, webhooks, or direct database connections.',
      features: [
        'RESTful APIs',
        'Real-time webhooks',
        'Database connectors',
        'File exports',
        'Custom integrations'
      ]
    }
  ];

  const useCases = [
    {
      title: 'Invoice Processing',
      description: 'Automatically extract vendor information, line items, and totals from invoices.',
      accuracy: '99.5%',
      volume: '10K+/day'
    },
    {
      title: 'Contract Analysis',
      description: 'Parse legal documents to extract key terms, dates, and obligations.',
      accuracy: '98.8%',
      volume: '1K+/day'
    },
    {
      title: 'Form Processing',
      description: 'Digitize paper forms and extract structured data for databases.',
      accuracy: '99.2%',
      volume: '50K+/day'
    },
    {
      title: 'Report Extraction',
      description: 'Extract data from financial reports, research papers, and analytics.',
      accuracy: '97.9%',
      volume: '5K+/day'
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Next-Generation Document Processing
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {' '}Platform
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              We're building an intelligent parsing platform that will transform how businesses extract and structure data from documents. Join us in shaping the future.
            </p>
            <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
              Join Beta Program
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Pipeline Deep Dive */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Our Vision: Intelligent Document Processing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're developing a revolutionary four-stage pipeline that will deliver unprecedented accuracy and reliability for document processing.
            </p>
          </motion.div>

          <div className="space-y-20">
            {pipelineSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`grid lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
                }`}
              >
                <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <step.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">
                        Stage {index + 1}
                      </span>
                      <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                    {step.description}
                  </p>

                  <ul className="space-y-3">
                    {step.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={index % 2 === 1 ? 'lg:col-start-1' : ''}>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 h-80 flex items-center justify-center">
                    <div className="text-center">
                      <step.icon className="w-20 h-20 text-blue-600 mx-auto mb-4" />
                      <div className="text-gray-500">Coming in beta release</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Target Use Cases
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're designing Parscade to excel in these key areas. Help us prioritize and refine these capabilities.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {useCase.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {useCase.description}
                </p>
                <div className="flex justify-between items-center">
                  <div className="flex space-x-4">
                    <div>
                      <div className="text-sm text-gray-500">Target Accuracy</div>
                      <div className="font-semibold text-blue-600">{useCase.accuracy}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Target Volume</div>
                      <div className="font-semibold text-blue-600">{useCase.volume}</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Beta Access
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Specs */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Designed for the Future
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're building with enterprise-grade standards from day one. Here's what we're focusing on.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Code className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Developer-First</h3>
              <p className="text-gray-600">
                Clean APIs, thorough documentation, and developer tools that make integration seamless.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Performance</h3>
              <p className="text-gray-600">
                Architecting for speed and scale - targeting sub-second processing with enterprise reliability.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Compliance</h3>
              <p className="text-gray-600">
                Building with security and compliance in mind - SOC 2, GDPR, and enterprise-grade protection.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready to shape the future with us?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join our beta program and be among the first to experience next-generation document processing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleJoinBetaClick}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors duration-200 shadow-lg"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Join Beta Program'}
              </button>
              <button
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors duration-200"
              >
                {isAuthenticated ? 'View Features' : 'Request Access'}
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default ProductPage;
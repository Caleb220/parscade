import React from 'react';
import { motion } from 'framer-motion';
import { Target, Users, Lightbulb, Rocket } from 'lucide-react';
import Layout from '../../../components/templates/Layout';
import Button from '../../../components/atoms/Button';

const AboutPage: React.FC = () => {
  const values = [
    {
      icon: Target,
      title: 'Mission-Driven',
      description: 'We believe document processing should be intelligent, not tedious. Our mission is to eliminate manual data entry forever.'
    },
    {
      icon: Users,
      title: 'User-Centric',
      description: 'Every feature we build starts with user feedback. Our beta community directly shapes our product roadmap.'
    },
    {
      icon: Lightbulb,
      title: 'Innovation First',
      description: 'We\'re not just improving existing solutions - we\'re reimagining what document processing can be.'
    },
    {
      icon: Rocket,
      title: 'Move Fast',
      description: 'As a startup, we ship quickly and iterate based on real user needs. Your feedback becomes features in weeks, not years.'
    }
  ];

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Building the Future of
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  {' '}Document Processing
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We're a small team with a big vision: making document processing intelligent, 
                fast, and accessible to everyone. Join us on this journey.
              </p>
            </motion.div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Our Story */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Story</h2>
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Parscade started with a simple frustration: why does extracting data from documents 
                still require so much manual work? In 2024, we should be able to upload any document 
                and get structured data back instantly.
              </p>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                We're building the platform we wish existed - one that understands documents like 
                humans do, but processes them at machine speed. Our beta program lets us work 
                directly with users to create something truly useful.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                This is just the beginning. With your feedback and support, we're creating the 
                next generation of document processing technology.
              </p>
            </div>
          </motion.div>

          {/* Values */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">What Drives Us</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <value.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{value.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Current Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Where We Are Today</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">Beta</div>
                <div className="text-gray-600">Current Stage</div>
                <p className="text-sm text-gray-500 mt-2">
                  Actively developing with user feedback
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">250+</div>
                <div className="text-gray-600">Beta Users</div>
                <p className="text-sm text-gray-500 mt-2">
                  Growing community of early adopters
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">2025</div>
                <div className="text-gray-600">Target Launch</div>
                <p className="text-sm text-gray-500 mt-2">
                  Full platform release planned
                </p>
              </div>
            </div>
          </motion.div>

          {/* Join Us */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center"
          >
            <h2 className="text-3xl font-bold mb-4">Join Our Journey</h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              We're looking for beta users, advisors, and team members who share our vision. 
              Help us build the future of document processing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-white text-blue-600 hover:bg-gray-50">
                Join Beta Program
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                Contact Us
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;

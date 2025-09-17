import React from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/templates/Layout';
import HeroSection from '../components/organisms/HeroSection';
import PipelineCarousel from '../components/molecules/PipelineCarousel';
import FeaturesSection from '../components/organisms/FeaturesSection';

const HomePage: React.FC = () => {
  return (
    <Layout>
      <HeroSection />
      
      {/* Pipeline Demo Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              See how it works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Our intelligent pipeline transforms your documents through four seamless stages, delivering structured data ready for your applications.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <PipelineCarousel />
          </motion.div>
        </div>
      </section>

      <FeaturesSection />

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Join the future of document processing
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Be among the first to experience next-generation document parsing. Join our beta program and help shape the future of intelligent data extraction.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors duration-200 shadow-lg">
                Join Beta Program
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors duration-200">
                Request Early Access
              </button>
            </div>
            <p className="text-blue-200 text-sm mt-4">
              Early access • Beta program • Shape the product with us
            </p>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;
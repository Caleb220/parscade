import React, { Suspense, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '../../../components/templates/Layout';
import HeroSection from '../sections/HeroSection';
import FeaturesSection from '../sections/FeaturesSection';
import { AuthModal } from '../../auth';

const PipelineCarousel = React.lazy(() => import('../components/PipelineCarousel'));

const HomePage: React.FC = () => {
  const location = useLocation();
  const [authModalOpen, setAuthModalOpen] = React.useState<boolean>(false);

  useEffect(() => {
    // Check if we should open the auth modal (e.g., from ProductPage redirect)
    if (location.state?.openAuthModal === true) {
      setAuthModalOpen(true);
      // Clear the state to prevent modal from opening again on subsequent visits
      window.history.replaceState({}, document.title);
    }
  }, []);

  return (
    <Layout>
      <HeroSection />

      <section className="py-20 bg-white" aria-labelledby="pipeline-demo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 id="pipeline-demo" className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              See how it works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Our intelligent pipeline transforms your documents through four seamless stages, delivering structured data ready for your applications.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Suspense
              fallback={(
                <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-gray-300">
                  <span className="text-sm text-gray-500">Loading interactive preview...</span>
                </div>
              )}
            >
              <PipelineCarousel />
            </Suspense>
          </motion.div>
        </div>
      </section>

      <FeaturesSection />

      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700" aria-labelledby="final-cta">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <h2 id="final-cta" className="text-3xl lg:text-4xl font-bold text-white mb-6">
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
      
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode="signup"
      />
    </Layout>
  );
};

export default HomePage;


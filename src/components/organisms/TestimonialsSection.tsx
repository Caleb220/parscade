import React from 'react';
import { motion } from 'framer-motion';
import TestimonialCard from '../molecules/TestimonialCard';
import { Testimonial } from '../../types';

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Head of Operations',
    company: 'TechFlow Inc',
    content: 'Parscade reduced our document processing time from hours to minutes. The accuracy is incredible and the API integration was seamless.',
  },
  {
    id: '2',
    name: 'Michael Rodriguez',
    role: 'CTO',
    company: 'DataVault Solutions',
    content: 'We process thousands of invoices daily. Parscade\'s enterprise features and reliability have been game-changing for our operations.',
  },
  {
    id: '3',
    name: 'Emily Watson',
    role: 'Product Manager',
    company: 'CloudSync',
    content: 'The structured data output is exactly what we needed. No more manual data entry - everything flows directly into our systems.',
  },
  {
    id: '4',
    name: 'David Kim',
    role: 'Engineering Lead',
    company: 'FinanceFlow',
    content: 'Outstanding accuracy and speed. The team collaboration features make it easy to manage our document processing workflows.',
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    role: 'Operations Director',
    company: 'LogiCore',
    content: 'Parscade\'s multi-format support handles everything we throw at it. From PDFs to images, the results are consistently excellent.',
  },
  {
    id: '6',
    name: 'James Wilson',
    role: 'VP of Technology',
    company: 'ScaleUp Ventures',
    content: 'The enterprise security features give us complete confidence. SOC 2 compliance and GDPR readiness were essential for our use case.',
  },
];

const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-20 bg-white">
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
            Trusted by industry leaders
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how companies across industries are transforming their document workflows with Parscade.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.id}
              {...testimonial}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl lg:text-4xl font-bold mb-2">10M+</div>
              <div className="text-blue-100">Documents Processed</div>
            </div>
            <div>
              <div className="text-3xl lg:text-4xl font-bold mb-2">99.2%</div>
              <div className="text-blue-100">Average Accuracy</div>
            </div>
            <div>
              <div className="text-3xl lg:text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Enterprise Customers</div>
            </div>
            <div>
              <div className="text-3xl lg:text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Uptime SLA</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  readonly title: string;
  readonly description: string;
  readonly icon: LucideIcon;
  readonly delay?: number;
  readonly className?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon: Icon,
  delay = 0,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -5 }}
      className={`bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto sm:mx-0">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default FeatureCard;
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Zap, Database, Send } from 'lucide-react';
import type { PipelineStep } from '../../../types';
import StepNavigator from '../../../components/molecules/StepNavigator';

const pipelineSteps: readonly PipelineStep[] = [
  {
    id: '1',
    title: 'Document Ingestion',
    shortTitle: 'Ingestion',
    description: 'Smart document upload system that will handle PDFs, Word docs, images, and more with intelligent preprocessing.',
    icon: 'FileText',
    status: 'processing',
  },
  {
    id: '2',
    title: 'Intelligent Parsing',
    shortTitle: 'Parsing',
    description: 'Next-generation AI algorithms that will understand document structure and extract data with unprecedented accuracy.',
    icon: 'Zap',
    status: 'processing',
  },
  {
    id: '3',
    title: 'Data Structuring',
    shortTitle: 'Structuring',
    description: 'Advanced structuring engine that will transform raw data into clean, application-ready formats.',
    icon: 'Database',
    status: 'pending',
  },
  {
    id: '4',
    title: 'Delivery & Integration',
    shortTitle: 'Delivery',
    description: 'Flexible delivery system with APIs, webhooks, and integrations designed for modern workflows.',
    icon: 'Send',
    status: 'pending',
  },
] as const;

/**
 * Maps string icon names to Lucide React components.
 * Provides type safety for icon rendering.
 */
const iconMap = {
  FileText,
  Zap,
  Database,
  Send,
} as const;

type IconName = keyof typeof iconMap;

interface PipelineCarouselProps {
  readonly autoPlay?: boolean;
  readonly interval?: number;
}

const PipelineCarousel: React.FC<PipelineCarouselProps> = ({
  autoPlay = true,
  interval = 5000,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => (prev + 1) % pipelineSteps.length);
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => (prev - 1 + pipelineSteps.length) % pipelineSteps.length);
  }, []);

  const goToStep = useCallback((index: number) => {
    setCurrentStep(index);
  }, []);

  useEffect(() => {
    if (autoPlay && !isHovered) {
      const timer = setInterval(nextStep, interval);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [autoPlay, interval, isHovered, nextStep]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      prevStep();
    } else if (event.key === 'ArrowRight') {
      nextStep();
    }
  }, [nextStep, prevStep]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const currentStepData = pipelineSteps[currentStep];
  if (!currentStepData) {
    throw new Error(`Invalid step index: ${currentStep}`);
  }
  
  const IconComponent = iconMap[currentStepData.icon as IconName];

  // Convert pipeline steps to navigator format
  const navigatorSteps = pipelineSteps.map(step => ({
    id: step.id,
    title: step.title,
    shortTitle: step.shortTitle,
  }));

  return (
    <div
      className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 sm:p-8 lg:p-10 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600" />
      </div>

      {/* Content */}
      <div className="relative z-10">

        {/* Main Content */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[300px] sm:min-h-[320px]">
          {/* Icon and Visual */}
          <div className="flex justify-center order-1 lg:order-none">
            <motion.div
              key={currentStep}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="relative"
            >
              <div className="w-28 h-28 sm:w-36 sm:h-36 bg-white rounded-full flex items-center justify-center shadow-xl border border-gray-100">
                <IconComponent className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600" />
              </div>
              
              {/* Status Indicator */}
              <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2">
                <div
                  className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full border-2 border-white ${
                    currentStepData.status === 'completed'
                      ? 'bg-green-500'
                      : currentStepData.status === 'processing'
                      ? 'bg-yellow-500 animate-pulse'
                      : 'bg-gray-300'
                  }`}
                />
              </div>
            </motion.div>
          </div>

          {/* Text Content */}
          <div className="text-center lg:text-left order-2 lg:order-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-2">
                  <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">
                    Step {currentStep + 1} of {pipelineSteps.length}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                  {currentStepData.title}
                </h3>
                <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                  {currentStepData.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div>
          {/* Step Navigator */}
          <StepNavigator
            steps={navigatorSteps}
            currentStep={currentStep}
            onStepChange={goToStep}
            className="mt-8 sm:mb-8"
          />
         </div>
      </div>
    </div>
  );
};

export default PipelineCarousel;
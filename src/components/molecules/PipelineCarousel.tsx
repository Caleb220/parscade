import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, FileText, Zap, Database, Send } from 'lucide-react';
import { PipelineStep } from '../../types';

const pipelineSteps: PipelineStep[] = [
  {
    id: '1',
    title: 'Document Ingestion',
    description: 'Smart document upload system that will handle PDFs, Word docs, images, and more with intelligent preprocessing.',
    icon: 'FileText',
    status: 'processing',
  },
  {
    id: '2',
    title: 'Intelligent Parsing',
    description: 'Next-generation AI algorithms that will understand document structure and extract data with unprecedented accuracy.',
    icon: 'Zap',
    status: 'processing',
  },
  {
    id: '3',
    title: 'Data Structuring',
    description: 'Advanced structuring engine that will transform raw data into clean, application-ready formats.',
    icon: 'Database',
    status: 'pending',
  },
  {
    id: '4',
    title: 'Delivery & Integration',
    description: 'Flexible delivery system with APIs, webhooks, and integrations designed for modern workflows.',
    icon: 'Send',
    status: 'pending',
  },
];

const iconMap = {
  FileText,
  Zap,
  Database,
  Send,
};

interface PipelineCarouselProps {
  autoPlay?: boolean;
  interval?: number;
}

const PipelineCarousel: React.FC<PipelineCarouselProps> = ({
  autoPlay = true,
  interval = 4000,
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
  const IconComponent = iconMap[currentStepData.icon as keyof typeof iconMap];

  return (
    <div
      className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-4 sm:p-6 lg:p-8 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Step Indicators */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="flex space-x-2">
            {pipelineSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => goToStep(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-blue-600 scale-125'
                    : 'bg-blue-200 hover:bg-blue-300'
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-8 items-center min-h-[280px] sm:min-h-[300px]">
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
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full flex items-center justify-center shadow-lg">
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
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                  {currentStepData.title}
                </h3>
                <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                  {currentStepData.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 sm:mt-8 gap-4 sm:gap-0">
          {/* Mobile: Step buttons first */}
          <div className="flex flex-wrap justify-center gap-2 sm:hidden order-2 sm:order-none">
            {pipelineSteps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => goToStep(index)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  index === currentStep
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
                }`}
              >
                {step.title.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Navigation arrows */}
          <div className="flex justify-between items-center w-full sm:w-auto order-1 sm:order-none">
          <button
            onClick={prevStep}
            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow duration-200 text-gray-600 hover:text-gray-900"
            aria-label="Previous step"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Desktop: Step buttons in center */}
          <div className="hidden sm:flex space-x-2 lg:space-x-4">
            {pipelineSteps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => goToStep(index)}
                className={`px-3 py-2 lg:px-4 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-all duration-200 ${
                  index === currentStep
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
                }`}
              >
                <span className="hidden lg:inline">{step.title}</span>
                <span className="lg:hidden">{step.title.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          <button
            onClick={nextStep}
            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow duration-200 text-gray-600 hover:text-gray-900"
            aria-label="Next step"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineCarousel;
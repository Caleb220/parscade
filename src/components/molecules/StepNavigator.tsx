import React from 'react';
import { motion } from 'framer-motion';

interface Step {
  readonly id: string;
  readonly title: string;
  readonly shortTitle?: string;
}

interface StepNavigatorProps {
  readonly steps: readonly Step[];
  readonly currentStep: number;
  readonly onStepChange: (stepIndex: number) => void;
  readonly className?: string;
}

const StepNavigator: React.FC<StepNavigatorProps> = ({
  steps,
  currentStep,
  onStepChange,
  className = '',
}) => {
  const handleKeyDown = (event: React.KeyboardEvent, stepIndex: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onStepChange(stepIndex);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center justify-center">
        <div className="flex items-center space-x-4 lg:space-x-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              {/* Node */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => onStepChange(index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className={`relative w-12 h-12 lg:w-16 lg:h-16 rounded-full border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    index === currentStep
                      ? 'bg-blue-600 border-blue-600 shadow-lg scale-110'
                      : index < currentStep
                      ? 'bg-green-500 border-green-500 hover:scale-105'
                      : 'bg-white border-gray-300 hover:border-blue-300 hover:scale-105'
                  }`}
                  aria-label={`Go to step ${index + 1}: ${step.title}`}
                >
                  {/* Node Content */}
                  <div className="flex items-center justify-center w-full h-full">
                    {index < currentStep ? (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 lg:w-6 lg:h-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </motion.svg>
                    ) : (
                      <span
                        className={`text-sm lg:text-base font-semibold ${
                          index === currentStep ? 'text-white' : 'text-gray-600'
                        }`}
                      >
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Active Node Pulse Animation */}
                  {index === currentStep && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-blue-600"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  )}
                </button>

                {/* Node Label */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="mt-3 text-center"
                >
                  <div
                    className={`text-xs lg:text-sm font-medium max-w-20 lg:max-w-24 ${
                      index === currentStep
                        ? 'text-blue-600'
                        : index < currentStep
                        ? 'text-green-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {step.shortTitle ?? step.title}
                  </div>
                </motion.div>
              </div>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4 lg:mx-8">
                  <div className="relative h-0.5 bg-gray-200">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-600 to-green-500"
                      initial={{ scaleX: 0 }}
                      animate={{
                        scaleX: index < currentStep ? 1 : 0,
                      }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      style={{ transformOrigin: 'left' }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="sm:hidden">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center space-x-3 overflow-x-auto pb-2 px-4 pt-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-shrink-0">
                {/* Mobile Node */}
                <button
                  onClick={() => onStepChange(index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className={`relative w-8 h-8 rounded-full border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    index === currentStep
                      ? 'bg-blue-600 border-blue-600 shadow-lg scale-110'
                      : index < currentStep
                      ? 'bg-green-500 border-green-500'
                      : 'bg-white border-gray-300'
                  }`}
                  aria-label={`Go to step ${index + 1}: ${step.title}`}
                >
                  <div className="flex items-center justify-center w-full h-full">
                    {index < currentStep ? (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <span
                        className={`text-xs font-semibold ${
                          index === currentStep ? 'text-white' : 'text-gray-600'
                        }`}
                      >
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Mobile Active Pulse */}
                  {index === currentStep && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-blue-600"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  )}
                </button>

                {/* Mobile Connecting Line */}
                {index < steps.length - 1 && (
                  <div className="w-8 h-0.5 bg-gray-200 mx-2">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-600 to-green-500"
                      initial={{ scaleX: 0 }}
                      animate={{
                        scaleX: index < currentStep ? 1 : 0,
                      }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      style={{ transformOrigin: 'left' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Step Labels */}
        <div className="text-center">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-medium text-blue-600"
          >
            Step {currentStep + 1}: {steps[currentStep]?.title}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StepNavigator;
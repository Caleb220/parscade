import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  accentLabel?: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  subtitle,
  accentLabel,
  delay = 0,
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 16 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? undefined : { duration: 0.4, delay }}
      className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-600" aria-hidden>
          {icon}
        </div>
        {accentLabel && (
          <span className="text-sm font-semibold text-blue-600">{accentLabel}</span>
        )}
      </div>
      <dl className="mt-6" aria-label={title}>
        <dt className="text-sm font-medium text-gray-500">{title}</dt>
        <dd className="mt-1 text-3xl font-semibold text-gray-900 tracking-tight">
          {value}
        </dd>
        {subtitle && (
          <dd className="mt-2 text-sm text-gray-500">{subtitle}</dd>
        )}
      </dl>
    </motion.div>
  );
};

export default React.memo(StatCard);

/**
 * Legacy logging utilities - now redirecting to centralized logger.
 * This file maintains backward compatibility while routing to Sentry.
 */

import { logger } from '../services/logger';

/**
 * Determines if the application is running in production mode.
 */
export const isProduction = 
  typeof import.meta !== 'undefined' && 
  import.meta.env?.MODE === 'production';

/**
 * Logs an info message.
 * @deprecated Use logger.info() instead
 */
export const logInfo = (message: string): void => {
  logger.info(message);
};

/**
 * Logs a warning message.
 * @deprecated Use logger.warn() instead
 */
export const logWarn = (message: string): void => {
  logger.warn(message);
};

/**
 * Logs an error message.
 * @deprecated Use logger.error() instead
 */
export const logError = (message: string): void => {
  logger.error(message);
};
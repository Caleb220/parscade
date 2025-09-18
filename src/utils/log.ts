/**
 * Simple logging utilities using console.
 */

/**
 * Determines if the application is running in production mode.
 */
export const isProduction = 
  typeof import.meta !== 'undefined' && 
  import.meta.env?.MODE === 'production';

/**
 * Logs an info message.
 */
export const logInfo = (message: string): void => {
  console.info(`[INFO] ${message}`);
};

/**
 * Logs a warning message.
 */
export const logWarn = (message: string): void => {
  console.warn(`[WARN] ${message}`);
};

/**
 * Logs an error message.
 */
export const logError = (message: string): void => {
  console.error(`[ERROR] ${message}`);
};
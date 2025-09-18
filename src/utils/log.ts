/**
 * Determines if the application is running in production mode.
 * Safely checks for import.meta availability and mode.
 */
export const isProduction = 
  typeof import.meta !== 'undefined' && 
  import.meta.env?.MODE === 'production';

/**
 * Logs an info message in development mode only.
 * 
 * @param message - The message to log
 */
export const logInfo = (message: string): void => {
  if (!isProduction) console.info(message);
};

/**
 * Logs a warning message in development mode only.
 * 
 * @param message - The warning message to log
 */
export const logWarn = (message: string): void => {
  if (!isProduction) console.warn(message);
};

/**
 * Logs an error message in development mode only.
 * 
 * @param message - The error message to log
 */
export const logError = (message: string): void => {
  if (!isProduction) console.error(message);
};


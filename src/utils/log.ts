export const isProduction = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'production';

export const logInfo = (message: string): void => {
  if (!isProduction) console.info(message);
};

export const logWarn = (message: string): void => {
  if (!isProduction) console.warn(message);
};

export const logError = (message: string): void => {
  if (!isProduction) console.error(message);
};


import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { logger } from './services/logger';
import App from './App.tsx';
import './index.css';

console.info('🚀 Parscade application starting', {
  mode: import.meta.env.MODE,
  version: import.meta.env?.VITE_APP_VERSION || '1.0.0'
});

// Initialize basic console logger
logger.initialize();

// Basic startup logging
setTimeout(() => {
  logger.info('✅ Application fully loaded and ready');
}, 1000);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
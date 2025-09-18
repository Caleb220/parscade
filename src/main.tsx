import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { logger } from './services/logger';
import App from './App.tsx';
import './index.css';

// Initialize logging system with Sentry
logger.initialize(
  'http://3a277508b33447ba9f4f97d01a95498b@sentry-logging.cdubz-hub.com/2',
  import.meta.env?.VITE_APP_VERSION || '1.0.0'
);

// Log application startup
logger.info('🚀 Parscade application starting');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

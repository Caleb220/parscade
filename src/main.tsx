import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { logger } from './services/logger';
import App from './App.tsx';
import './index.css';

// Enable Sentry debug mode in development or when explicitly set
if (import.meta.env.DEV || import.meta.env.VITE_SENTRY_DEBUG === 'true') {
  console.info('🔧 Sentry debug mode enabled');
}

// Initialize logging system with Sentry (disabled in development)
const sentryDsn = import.meta.env.VITE_SENTRY_DSN || 
  (import.meta.env.PROD 
    ? 'http://3a277508b33447ba9f4f97d01a95498b@sentry-logging.cdubz-hub.com/2'
  )
    : undefined);

console.info('🚀 Parscade application starting', {
  mode: import.meta.env.MODE,
  hasSentryDsn: !!sentryDsn,
  sentryDebug: import.meta.env.VITE_SENTRY_DEBUG === 'true',
  version: import.meta.env?.VITE_APP_VERSION || '1.0.0'
});

logger.initialize(sentryDsn, import.meta.env?.VITE_APP_VERSION || '1.0.0');

// Test logger functionality
setTimeout(() => {
  logger.info('✅ Application fully loaded and ready');
  
  // Add manual test functions to window for debugging
  if (import.meta.env.DEV) {
    (window as any).testSentry = {
      testMessage: () => {
        logger.info('🧪 Manual Sentry test message from console');
        console.info('Test message sent. Check Sentry dashboard.');
      },
      testError: () => {
        logger.error('🧪 Manual Sentry test error from console', {
          error: new Error('Manual test error'),
          context: { feature: 'manual-test', action: 'console-test' }
        });
        console.info('Test error sent. Check Sentry dashboard.');
      },
      testException: () => {
        throw new Error('🧪 Manual test exception - this should be caught by Sentry');
      }
    };
    console.info('🧪 Sentry test functions available: window.testSentry.testMessage(), window.testSentry.testError(), window.testSentry.testException()');
  }
}, 3000);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

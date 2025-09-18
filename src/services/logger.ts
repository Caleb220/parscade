import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';

/**
 * Enterprise-grade logging service with Sentry integration.
 * Provides centralized error tracking, performance monitoring, and structured logging.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  readonly userId?: string;
  readonly userEmail?: string;
  readonly sessionId?: string;
  readonly url?: string;
  readonly userAgent?: string;
  readonly feature?: string;
  readonly action?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface LogEntry {
  readonly message: string;
  readonly level: LogLevel;
  readonly context?: LogContext;
  readonly error?: Error;
  readonly timestamp: string;
}

/**
 * Sensitive data patterns to sanitize before sending to Sentry.
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /key/i,
  /secret/i,
  /authorization/i,
  /auth/i,
  /session/i,
];

/**
 * Sanitizes sensitive data from objects before sending to Sentry.
 */
const sanitizeData = (data: unknown): unknown => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Logger class for centralized logging with Sentry integration.
 */
class Logger {
  private isInitialized = false;
  private isProduction: boolean;
  private isDevelopment: boolean;
  private isDebugMode: boolean;

  constructor() {
    this.isProduction = import.meta.env?.MODE === 'production';
    this.isDevelopment = import.meta.env?.MODE === 'development';
    this.isDebugMode = import.meta.env?.VITE_SENTRY_DEBUG === 'true' || this.isDevelopment;
  }

  /**
   * Initialize Sentry with proper configuration.
   */
  initialize(dsn?: string, release?: string): void {
    if (this.isInitialized) {
      return;
    }

    console.info('🔧 Initializing Sentry logger...', {
      hasDS: !!dsn,
      environment: import.meta.env?.MODE,
      isProduction: this.isProduction,
      isDevelopment: this.isDevelopment,
      isDebugMode: this.isDebugMode,
      release: release || 'unknown'
    });

    // Skip Sentry if no DSN provided
    if (!dsn) {
      console.warn('⚠️ No Sentry DSN provided - logging will use console only');
      this.isInitialized = true;
      return;
    }

    console.info('🚀 Initializing Sentry with DSN:', dsn.substring(0, 50) + '...');

    try {
      Sentry.init({
        dsn,
        debug: this.isDebugMode,
        environment: import.meta.env?.MODE || 'development',
        release: release || `parscade@${import.meta.env?.VITE_APP_VERSION || '1.0.0'}`,
        
        // Enhanced configuration for debugging
        maxBreadcrumbs: 50,
        attachStacktrace: true,
        sendClientReports: true,
        
        integrations: [
          new Integrations.BrowserTracing({
            tracingOrigins: [window.location.hostname, /^\//],
            routingInstrumentation: Sentry.reactRouterV6Instrumentation(
              React.useEffect,
              useLocation,
              useNavigate,
              createRoutesFromChildren,
              matchRoutes
            ),
          }),
        ],
        tracesSampleRate: this.isProduction ? 0.1 : 1.0,
        
        beforeSend: (event) => {
          console.debug('📤 Sentry beforeSend triggered:', {
            eventId: event.event_id,
            level: event.level,
            message: event.message,
            fingerprint: event.fingerprint,
          });
          
          // Sanitize sensitive data
          if (event.extra) {
            event.extra = sanitizeData(event.extra) as Record<string, unknown>;
          }
          if (event.contexts) {
            event.contexts = sanitizeData(event.contexts) as typeof event.contexts;
          }
          
          console.debug('📤 Sentry event processed and ready to send');
          return event;
        },
        
        beforeBreadcrumb: (breadcrumb) => {
          console.debug('🍞 Sentry breadcrumb:', breadcrumb.message, breadcrumb.category);
          // Sanitize breadcrumb data
          if (breadcrumb.data) {
            breadcrumb.data = sanitizeData(breadcrumb.data) as Record<string, unknown>;
          }
          return breadcrumb;
        },
        
        // Transport options for debugging network issues
        transport: (options) => {
          const transport = new Sentry.BrowserTransport(options);
          return {
            ...transport,
            send: (envelope) => {
              console.debug('📡 Sentry transport sending envelope:', {
                items: envelope[1]?.length || 0,
                dsn: options.url
              });
              
              return transport.send(envelope).catch(error => {
                console.error('❌ Sentry transport error:', error);
                throw error;
              });
            }
          };
        }
      });

      // Set up global error handlers
      this.setupGlobalHandlers();
      this.isInitialized = true;

      console.info('✅ Sentry initialized successfully', {
        dsn: dsn.substring(0, 50) + '...',
        environment: import.meta.env?.MODE,
        release: release || `parscade@${import.meta.env?.VITE_APP_VERSION || '1.0.0'}`,
        debug: this.isDebugMode
      });
      
      // Run test events to verify connection
      this.runInitialTests();
      
    } catch (error) {
      // Fallback to console if Sentry fails to initialize
      console.warn('⚠️ Sentry initialization failed, falling back to console logging:', error);
      this.isInitialized = true; // Mark as initialized so we don't try again
    }
  }
  
  /**
   * Run initial test events to verify Sentry connection
   */
  private runInitialTests(): void {
    setTimeout(() => {
      console.info('🧪 Running Sentry connection tests...');
      
      // Test message capture
      Sentry.captureMessage('Sentry Test Message: Logger initialized successfully', 'info');
      console.info('📤 Test message sent to Sentry');
      
      // Test exception capture
      Sentry.captureException(new Error('Sentry Test Exception: Logger test error'));
      console.info('📤 Test exception sent to Sentry');
      
      // Test breadcrumb
      Sentry.addBreadcrumb({
        message: 'Sentry Test Breadcrumb: Logger initialized',
        level: 'info',
        category: 'test'
      });
      console.info('📤 Test breadcrumb added to Sentry');
      
      console.info('✅ Sentry test events completed. Check your Sentry dashboard for events.');
    }, 2000); // Wait 2 seconds after initialization
  }

  /**
   * Set up global error handlers for unhandled exceptions.
   */
  private setupGlobalHandlers(): void {
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        context: { feature: 'global', action: 'unhandledRejection' },
        error: new Error(event.reason),
      });
    });

    // Global error handler
    window.addEventListener('error', (event) => {
      this.error('Global error', {
        context: { 
          feature: 'global', 
          action: 'globalError',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          }
        },
        error: event.error || new Error(event.message),
      });
    });
  }

  /**
   * Set user context for Sentry.
   */
  setUserContext(user: { id?: string; email?: string; username?: string }): void {
    if (!this.isInitialized) return;

    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  }

  /**
   * Clear user context (e.g., on logout).
   */
  clearUserContext(): void {
    if (!this.isInitialized) return;
    Sentry.setUser(null);
  }

  /**
   * Set additional context for requests.
   */
  setContext(key: string, context: Record<string, unknown>): void {
    if (!this.isInitialized) return;
    Sentry.setContext(key, sanitizeData(context) as Record<string, unknown>);
  }

  /**
   * Add breadcrumb for tracking user actions.
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
    if (!this.isInitialized) return;

    Sentry.addBreadcrumb({
      message,
      category,
      data: data ? sanitizeData(data) as Record<string, unknown> : undefined,
      level: 'info',
    });
  }

  /**
   * Log debug message (development only).
   */
  debug(message: string, options?: { context?: LogContext; metadata?: Record<string, unknown> }): void {
    // Only log debug in development
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, options?.metadata || '');
    }
  }

  /**
   * Log info message.
   */
  info(message: string, options?: { context?: LogContext; metadata?: Record<string, unknown> }): void {
    // Minimal console logging - only critical info
    if (this.isDevelopment || message.includes('🚀')) {
      console.info(`[INFO] ${message}`);
    }

    if (this.isInitialized && this.isProduction) {
      Sentry.addBreadcrumb({
        message,
        level: 'info',
        data: options?.metadata ? sanitizeData(options.metadata) as Record<string, unknown> : undefined,
      });
    }
  }

  /**
   * Log warning message.
   */
  warn(message: string, options?: { context?: LogContext; metadata?: Record<string, unknown>; error?: Error }): void {
    // Don't flood console - warnings go to Sentry
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, options?.metadata || '');
    }

    if (this.isInitialized && this.isProduction) {
      Sentry.withScope((scope) => {
        if (options?.context) {
          scope.setContext('logContext', sanitizeData(options.context) as Record<string, unknown>);
        }
        if (options?.metadata) {
          scope.setContext('metadata', sanitizeData(options.metadata) as Record<string, unknown>);
        }
        
        if (options?.error) {
          Sentry.captureException(options.error);
        } else {
          Sentry.captureMessage(message, 'warning');
        }
      });
    }
  }

  /**
   * Log error message.
   */
  error(message: string, options?: { context?: LogContext; metadata?: Record<string, unknown>; error?: Error }): void {
    // Critical errors might need console output in production for immediate debugging
    if (this.isDevelopment || (this.isProduction && message.includes('CRITICAL'))) {
      console.error(`[ERROR] ${message}`, options?.error || options?.metadata || '');
    }

    if (this.isInitialized) {
      console.debug('📤 Sending error to Sentry:', { message, hasError: !!options?.error });
      Sentry.withScope((scope) => {
        if (options?.context) {
          scope.setContext('logContext', sanitizeData(options.context) as Record<string, unknown>);
        }
        if (options?.metadata) {
          scope.setContext('metadata', sanitizeData(options.metadata) as Record<string, unknown>);
        }
        
        if (options?.error) {
          Sentry.captureException(options.error);
          console.debug('📤 Exception sent to Sentry');
        } else {
          Sentry.captureMessage(message, 'error');
          console.debug('📤 Error message sent to Sentry');
        }
      });
    }
  }

  /**
   * Log fatal error (critical system failure).
   */
  fatal(message: string, options?: { context?: LogContext; metadata?: Record<string, unknown>; error?: Error }): void {
    // Fatal errors always go to console for immediate attention
    console.error(`[FATAL] ${message}`, options?.error || options?.metadata || '');

    if (this.isInitialized && this.isProduction) {
      Sentry.withScope((scope) => {
        scope.setLevel('fatal');
        
        if (options?.context) {
          scope.setContext('logContext', sanitizeData(options.context) as Record<string, unknown>);
        }
        if (options?.metadata) {
          scope.setContext('metadata', sanitizeData(options.metadata) as Record<string, unknown>);
        }
        
        if (options?.error) {
          Sentry.captureException(options.error);
        } else {
          Sentry.captureMessage(message, 'fatal');
        }
      });
    }
  }

  /**
   * Capture exception with context.
   */
  captureException(error: Error, context?: LogContext, metadata?: Record<string, unknown>): void {
    if (!this.isInitialized || !this.isProduction) {
      if (this.isDevelopment) {
        console.error('Exception:', error);
      }
      return;
    }

    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('logContext', sanitizeData(context) as Record<string, unknown>);
      }
      if (metadata) {
        scope.setContext('metadata', sanitizeData(metadata) as Record<string, unknown>);
      }
      
      Sentry.captureException(error);
    });
  }

  /**
   * Start a new transaction for performance monitoring.
   */
  startTransaction(name: string, op: string): ReturnType<typeof Sentry.startTransaction> | null {
    if (!this.isInitialized || !this.isProduction) return null;
    
    return Sentry.startTransaction({
      name,
      op,
    });
  }
}

// Export singleton instance
export const logger = new Logger();
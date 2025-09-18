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

  constructor() {
    this.isProduction = import.meta.env?.MODE === 'production';
    this.isDevelopment = import.meta.env?.MODE === 'development';
  }

  /**
   * Initialize Sentry with proper configuration.
   */
  initialize(dsn?: string, release?: string): void {
    if (this.isInitialized) {
      return;
    }

    // Skip Sentry in development if DSN is not accessible
    if (!dsn || this.isDevelopment) {
      console.info('🔧 Sentry disabled in development mode');
      this.isInitialized = true;
      return;
    }

    try {
      Sentry.init({
        dsn,
        environment: import.meta.env?.MODE || 'development',
        release: release || `parscade@${import.meta.env?.VITE_APP_VERSION || '1.0.0'}`,
        integrations: [
          new Integrations.BrowserTracing({
            tracingOrigins: [window.location.hostname, /^\//],
          }),
        ],
        tracesSampleRate: this.isProduction ? 0.1 : 1.0,
        beforeSend: (event) => {
          // Sanitize sensitive data
          if (event.extra) {
            event.extra = sanitizeData(event.extra) as Record<string, unknown>;
          }
          if (event.contexts) {
            event.contexts = sanitizeData(event.contexts) as typeof event.contexts;
          }
          return event;
        },
        beforeBreadcrumb: (breadcrumb) => {
          // Sanitize breadcrumb data
          if (breadcrumb.data) {
            breadcrumb.data = sanitizeData(breadcrumb.data) as Record<string, unknown>;
          }
          return breadcrumb;
        },
      });

      // Set up global error handlers
      this.setupGlobalHandlers();
      this.isInitialized = true;

      console.info('🚀 Sentry logging initialized successfully');
    } catch (error) {
      // Fallback to console if Sentry fails to initialize
      console.warn('⚠️ Sentry initialization failed, falling back to console logging:', error);
      this.isInitialized = true; // Mark as initialized so we don't try again
    }
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
          Sentry.captureMessage(message, 'error');
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
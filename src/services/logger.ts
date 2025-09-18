/**
 * Basic console logging service for development.
 * Simple console-based logging without external dependencies.
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

/**
 * Simple console-based logger class.
 */
class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env?.MODE === 'development';
  }

  /**
   * Initialize logger (no-op for basic console logging).
   */
  initialize(_dsn?: string, _release?: string): void {
    console.info('🔧 Basic console logger initialized');
  }

  /**
   * Set user context (no-op for basic logging).
   */
  setUserContext(_user: { id?: string; email?: string; username?: string }): void {
    // No-op for basic logging
  }

  /**
   * Clear user context (no-op for basic logging).
   */
  clearUserContext(): void {
    // No-op for basic logging
  }

  /**
   * Set additional context (no-op for basic logging).
   */
  setContext(_key: string, _context: Record<string, unknown>): void {
    // No-op for basic logging
  }

  /**
   * Add breadcrumb (no-op for basic logging).
   */
  addBreadcrumb(_message: string, _category: string, _data?: Record<string, unknown>): void {
    // No-op for basic logging
  }

  /**
   * Log debug message (development only).
   */
  debug(message: string, options?: { context?: LogContext; metadata?: Record<string, unknown> }): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, options?.metadata || '');
    }
  }

  /**
   * Log info message.
   */
  info(message: string, options?: { context?: LogContext; metadata?: Record<string, unknown> }): void {
    console.info(`[INFO] ${message}`);
  }

  /**
   * Log warning message.
   */
  warn(message: string, options?: { context?: LogContext; metadata?: Record<string, unknown>; error?: Error }): void {
    console.warn(`[WARN] ${message}`, options?.error || options?.metadata || '');
  }

  /**
   * Log error message.
   */
  error(message: string, options?: { context?: LogContext; metadata?: Record<string, unknown>; error?: Error }): void {
    console.error(`[ERROR] ${message}`, options?.error || options?.metadata || '');
  }

  /**
   * Log fatal error (critical system failure).
   */
  fatal(message: string, options?: { context?: LogContext; metadata?: Record<string, unknown>; error?: Error }): void {
    console.error(`[FATAL] ${message}`, options?.error || options?.metadata || '');
  }

  /**
   * Capture exception with context.
   */
  captureException(error: Error, _context?: LogContext, _metadata?: Record<string, unknown>): void {
    console.error('Exception:', error);
  }

  /**
   * Start a new transaction for performance monitoring (no-op).
   */
  startTransaction(_name: string, _op: string): null {
    return null;
  }
}

// Export singleton instance
export const logger = new Logger();
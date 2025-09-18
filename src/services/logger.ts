import pino from 'pino';
import pinoElastic from 'pino-elasticsearch';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  readonly userId?: string;
  readonly userEmail?: string;
  readonly sessionId?: string;
  readonly url?: string;
  readonly userAgent?: string;
  readonly feature?: string;
  readonly action?: string;
  readonly route?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Sanitizes sensitive data from log objects before sending to Elasticsearch.
 */
const sanitizeLogData = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'authorization', 
    'cookie', 'session', 'jwt', 'api_key', 'access_token',
    'refresh_token', 'client_secret', 'private_key'
  ];
  
  const sanitized = { ...data };
  
  const sanitizeObject = (obj: any, path: string[] = []): any => {
    if (!obj || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map((item, index) => sanitizeObject(item, [...path, index.toString()]));
    }
    
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const fieldPath = [...path, key].join('.');
      
      // Check if field name contains sensitive keywords
      const isSensitive = sensitiveFields.some(field => 
        lowerKey.includes(field) || fieldPath.toLowerCase().includes(field)
      );
      
      if (isSensitive) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = sanitizeObject(value, [...path, key]);
      } else {
        result[key] = value;
      }
    }
    return result;
  };
  
  return sanitizeObject(sanitized);
};

/**
 * Enhanced Pino logger with Elasticsearch transport and console fallback.
 */
class PinoLogger {
  private logger: pino.Logger;
  private elasticTransport: any = null;
  private isElasticConnected = false;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env?.MODE === 'development';
    this.setupLogger();
  }

  private setupLogger(): void {
    const elasticUrl = import.meta.env?.VITE_ELASTIC_URL || 
                      import.meta.env?.ELASTIC_URL || 
                      'https://elastic-search.cdubz-hub.com';

    // Base logger configuration
    const baseConfig: pino.LoggerOptions = {
      level: this.isDevelopment ? 'debug' : 'info',
      base: {
        service: 'parscade-frontend',
        env: import.meta.env?.MODE || 'development',
        version: import.meta.env?.VITE_APP_VERSION || '1.0.0',
        timestamp: new Date().toISOString(),
      },
      formatters: {
        level: (label) => ({ level: label }),
        log: (object) => sanitizeLogData(object),
      },
    };

    // Create transports array
    const transports: any[] = [];

    // Console transport (always available as fallback)
    const consoleTransport = pino.transport({
      target: 'pino-pretty',
      level: this.isDevelopment ? 'debug' : 'warn', // Only errors/warnings in production console
      options: {
        colorize: this.isDevelopment,
        translateTime: 'yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname',
        messageFormat: this.isDevelopment 
          ? '{service}[{level}]: {msg}' 
          : '{msg}',
      },
    });
    transports.push(consoleTransport);

    // Elasticsearch transport (with error handling)
    try {
      this.elasticTransport = pinoElastic({
        index: 'app-logs',
        node: elasticUrl,
        'es-version': 7,
        'flush-bytes': 1000,
        'flush-interval': 5000,
        consistency: false, // Don't wait for acknowledgment to prevent blocking
      });

      // Add error handling for Elasticsearch transport
      this.elasticTransport.on('error', (error: Error) => {
        this.isElasticConnected = false;
        console.warn('[Logger] Elasticsearch transport error:', error.message);
        console.warn('[Logger] Continuing with console-only logging');
      });

      this.elasticTransport.on('insertError', (error: Error) => {
        console.warn('[Logger] Failed to insert log into Elasticsearch:', error.message);
      });

      this.elasticTransport.on('insert', () => {
        if (!this.isElasticConnected) {
          this.isElasticConnected = true;
          console.info('[Logger] ✅ Connected to Elasticsearch successfully');
        }
      });

      transports.push(this.elasticTransport);
    } catch (error) {
      console.warn('[Logger] Failed to initialize Elasticsearch transport:', error);
      console.info('[Logger] Falling back to console-only logging');
    }

    // Create logger with transports
    this.logger = pino(
      baseConfig,
      pino.multistream(transports, { dedupe: true })
    );

    // Test Elasticsearch connection
    this.testElasticConnection();
  }

  private async testElasticConnection(): Promise<void> {
    try {
      // Send a test log to verify Elasticsearch connectivity
      this.logger.info({
        component: 'logger',
        action: 'connection-test',
        message: 'Logger initialized - testing Elasticsearch connection',
      });
      
      // Wait a bit to see if we get connection feedback
      setTimeout(() => {
        if (!this.isElasticConnected && this.isDevelopment) {
          console.info('[Logger] ℹ️ Elasticsearch not responding, using console fallback');
        }
      }, 2000);
    } catch (error) {
      console.warn('[Logger] Connection test failed:', error);
    }
  }

  /**
   * Initialize logger (for compatibility with existing code).
   */
  initialize(_dsn?: string, _release?: string): void {
    console.info('[Logger] 🔧 Pino + Elasticsearch logger initialized');
  }

  /**
   * Set user context for subsequent logs.
   */
  setUserContext(user: { id?: string; email?: string; username?: string }): void {
    this.logger = this.logger.child({
      user: sanitizeLogData({
        id: user.id,
        email: user.email,
        username: user.username,
      }),
    });
  }

  /**
   * Clear user context.
   */
  clearUserContext(): void {
    // Create new logger instance without user context
    this.setupLogger();
  }

  /**
   * Set additional context for subsequent logs.
   */
  setContext(key: string, context: Record<string, unknown>): void {
    this.logger = this.logger.child({
      [key]: sanitizeLogData(context),
    });
  }

  /**
   * Add breadcrumb for debugging context.
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
    this.logger.debug({
      breadcrumb: {
        message,
        category,
        data: data ? sanitizeLogData(data) : undefined,
        timestamp: new Date().toISOString(),
      },
    }, `Breadcrumb: ${message}`);
  }

  /**
   * Log debug message (development only).
   */
  debug(message: string, options?: { context?: LogContext; metadata?: Record<string, unknown> }): void {
    const logData = {
      ...sanitizeLogData(options?.context),
      ...sanitizeLogData(options?.metadata),
    };
    
    this.logger.debug(logData, message);
  }

  /**
   * Log info message.
   */
  info(message: string, options?: { context?: LogContext; metadata?: Record<string, unknown> }): void {
    const logData = {
      ...sanitizeLogData(options?.context),
      ...sanitizeLogData(options?.metadata),
    };
    
    this.logger.info(logData, message);
  }

  /**
   * Log warning message.
   */
  warn(message: string, options?: { context?: LogContext; metadata?: Record<string, unknown>; error?: Error }): void {
    const logData = {
      ...sanitizeLogData(options?.context),
      ...sanitizeLogData(options?.metadata),
      ...(options?.error && { 
        error: {
          name: options.error.name,
          message: options.error.message,
          stack: options.error.stack,
        }
      }),
    };
    
    this.logger.warn(logData, message);
  }

  /**
   * Log error message.
   */
  error(message: string, options?: { context?: LogContext; metadata?: Record<string, unknown>; error?: Error }): void {
    const logData = {
      ...sanitizeLogData(options?.context),
      ...sanitizeLogData(options?.metadata),
      ...(options?.error && { 
        error: {
          name: options.error.name,
          message: options.error.message,
          stack: options.error.stack,
        }
      }),
    };
    
    this.logger.error(logData, message);
  }

  /**
   * Log fatal error (critical system failure).
   */
  fatal(message: string, options?: { context?: LogContext; metadata?: Record<string, unknown>; error?: Error }): void {
    const logData = {
      ...sanitizeLogData(options?.context),
      ...sanitizeLogData(options?.metadata),
      ...(options?.error && { 
        error: {
          name: options.error.name,
          message: options.error.message,
          stack: options.error.stack,
        }
      }),
    };
    
    this.logger.fatal(logData, message);
  }

  /**
   * Capture exception with context (compatibility method).
   */
  captureException(error: Error, context?: LogContext, metadata?: Record<string, unknown>): void {
    this.error('Exception captured', {
      context,
      metadata,
      error,
    });
  }

  /**
   * Start a new transaction for performance monitoring (no-op for Pino).
   */
  startTransaction(_name: string, _op: string): null {
    return null;
  }

  /**
   * Get current connection status.
   */
  getStatus(): { elasticsearch: boolean; console: boolean } {
    return {
      elasticsearch: this.isElasticConnected,
      console: true,
    };
  }

  /**
   * Manual flush to Elasticsearch (useful for testing).
   */
  async flush(): Promise<void> {
    if (this.elasticTransport && this.elasticTransport.flush) {
      try {
        await this.elasticTransport.flush();
      } catch (error) {
        console.warn('[Logger] Failed to flush to Elasticsearch:', error);
      }
    }
  }
}

// Export singleton instance
export const logger = new PinoLogger();

export { logger }
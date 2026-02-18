/**
 * Structured logging with Winston
 * Provides consistent logging across tests
 */

import winston, { Logger } from 'winston';
import path from 'path';
import fs from 'fs';

const logsDir = 'logs';

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Logger factory
 * Creates and manages Winston logger instances
 */
export class LoggerFactory {
  private static loggers: Map<string, Logger> = new Map();

  /**
   * Create or get logger for a specific context
   */
  public static getLogger(context: string): Logger {
    if (this.loggers.has(context)) {
      return this.loggers.get(context)!;
    }

    const logger = winston.createLogger({
      defaultMeta: { context },
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.metadata(),
        winston.format.json(),
      ),
      transports: [
        // Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp, context }) => {
              return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
            }),
          ),
        }),
        // File transport for errors
        new winston.transports.File({
          filename: path.join(logsDir, 'error.log'),
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        // File transport for all logs
        new winston.transports.File({
          filename: path.join(logsDir, 'combined.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 10,
        }),
      ],
    });

    this.loggers.set(context, logger);
    return logger;
  }

  /**
   * Get or create logger for current test
   */
  public static getTestLogger(): Logger {
    const testName = expect.getState().currentTestName || 'unknown-test';
    return this.getLogger(testName);
  }
}

/**
 * Helper logger functions for consistent usage
 */
export const createLogger = (context: string) => {
  const logger = LoggerFactory.getLogger(context);

  return {
    debug: (message: string, data?: Record<string, unknown>) => {
      logger.debug(message, data);
    },
    info: (message: string, data?: Record<string, unknown>) => {
      logger.info(message, data);
    },
    warn: (message: string, data?: Record<string, unknown>) => {
      logger.warn(message, data);
    },
    error: (message: string, error?: Error | Record<string, unknown>) => {
      if (error instanceof Error) {
        logger.error(message, { stack: error.stack, message: error.message });
      } else {
        logger.error(message, error);
      }
    },
  };
};

// Export default logger
export const logger = createLogger('test-framework');

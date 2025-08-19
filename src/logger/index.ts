import winston, { Logger as WinstonLogger, format } from 'winston';
import TransportStream from 'winston-transport';
import { Config } from '../types';

// 导出Winston兼容的Logger类型
export type Logger = WinstonLogger;

/**
 * Initializes the logging system with configuration
 * @param config - Application configuration object
 * @returns Configured Winston logger instance
 */
export function initializeLogger(config: Config): Logger {
  // Base structured log format for file outputs
  const baseFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    format.label({ label: 'playwright-runner' }),
    format.errors({ stack: true }),
    format.json()
  );

  // Human-readable format for console output
  const consoleFormat = format.combine(
    format.colorize(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, label, message, ...meta }) => {
      const metaStr = Object.keys(meta).length 
        ? ` ${JSON.stringify(meta)}` 
        : '';
      return `[${timestamp}] [${label}] ${level}: ${message}${metaStr}`;
    })
  );

  // Determine log level from config or default to 'info'
  const logLevel = config.logger?.level || 'info';

  // Initialize transport array with correct type
  const transports: TransportStream[] = [
    // Console transport is always enabled
    new winston.transports.Console({
      format: consoleFormat,
      level: logLevel
    })
  ];

  // Add file transport if path is configured
  if (config.logger?.filePath) {
    transports.push(
      new winston.transports.File({
        filename: config.logger.filePath,
        format: baseFormat,
        level: logLevel,
        maxsize: config.logger.maxSize || 10 * 1024 * 1024, // 10MB
        maxFiles: config.logger.maxFiles || 5,
        tailable: true
      })
    );
  }

  // Create logger instance
  const logger: Logger = winston.createLogger({
    level: logLevel,
    defaultMeta: { service: 'playwright-runner' },
    format: baseFormat,
    transports: transports
  });

  // Log initialization in development mode
  if (config.environment === 'development') {
    logger.debug('Logger initialized', {
      level: logLevel,
      transports: transports.map(t => t.constructor.name),
      environment: config.environment
    });
  }

  return logger;
}

// Default logger instance storage
let defaultLogger: Logger | undefined;

/**
 * Gets the default logger instance
 * @throws Error if logger hasn't been initialized
 * @returns Initialized logger instance
 */
export function getLogger(): Logger {
  if (!defaultLogger) {
    throw new Error('Logger not initialized. Call initializeLogger() first.');
  }
  return defaultLogger;
}

// Proxy for convenient logger usage
export const logger: Logger = new Proxy({} as Logger, {
  get(_target, prop: keyof Logger) {
    return getLogger()[prop];
  }
});

// Set default logger when initialized
export function setDefaultLogger(logger: Logger): void {
  defaultLogger = logger;
}

import winston, { Logger } from 'winston';
import { CONFIG } from '../config';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
);

// Create logger instance
const logger: Logger = winston.createLogger({
  level: CONFIG.logLevel,
  format: logFormat,
  defaultMeta: { service: 'playwright-runner' },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
});

// Create job logger with context for specific tasks
export const createJobLogger = (jobId: string) => {
  return logger.child({ jobId });
};

export default logger;

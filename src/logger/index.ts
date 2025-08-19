import winston, { Logger } from 'winston';
import { CONFIG } from '../config';

// 定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
);

// 创建日志实例
const logger: Logger = winston.createLogger({
  level: CONFIG.logLevel,
  format: logFormat,
  defaultMeta: { service: 'playwright-runner' },
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
});

// 为特定任务创建带上下文的日志
export const createJobLogger = (jobId: string) => {
  return logger.child({ jobId });
};

export default logger;

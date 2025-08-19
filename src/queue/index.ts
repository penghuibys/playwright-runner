// 确保导入路径和类型定义正确匹配
import { Config } from '../types/index';  // 显式指定index.ts以确保正确导入
import { Logger, logger } from '../logger/index';  // 导入实际的Logger类型和实例

/**
 * Initializes the Redis connection and job queue
 * @param config - Application configuration
 * @param logger - Logger instance
 * @returns Object containing queue and redis connection
 */
export function initializeQueue(config: Config, logger: Logger) {
  // 确保引入所需依赖
  const { Queue } = require('bullmq');  // 替代import以避免潜在的循环依赖
  const IORedis = require('ioredis');

  // Create Redis connection
  const redis = new IORedis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    db: config.redis.db,
    maxRetriesPerRequest: null,
  });

  // Handle Redis connection events
  redis.on('connect', () => {
    logger.info('Connected to Redis');
  });

  redis.on('error', (error: Error) => {
    logger.error('Redis connection error', { error: error.message });
  });

  // Create job queue
  const jobQueue = new Queue(config.queue.name, {
    connection: redis,
    defaultJobOptions: {
      attempts: config.queue.defaultAttempts,
      removeOnComplete: config.queue.removeOnComplete,
      removeOnFail: config.queue.removeOnFail,
    },
  });

  /**
   * Gets current queue status and metrics
   */
  const getQueueStatus = async () => {
    try {
      const metrics = await jobQueue.getMetrics();
      const pendingJobs = await jobQueue.getWaitingCount();
      const activeJobs = await jobQueue.getActiveCount();

      return {
        isConnected: redis.status === 'ready',
        metrics,
        jobCounts: {
          pending: pendingJobs,
          active: activeJobs
        }
      };
    } catch (error) {
      logger.error('Failed to retrieve queue status', {
        error: error instanceof Error ? error.message : String(error)
      });
      return {
        isConnected: false,
        error: 'Failed to retrieve queue status'
      };
    }
  };

  return {
    jobQueue,
    redis,
    getQueueStatus
  };
}

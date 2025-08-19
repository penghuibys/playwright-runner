import { Queue, Worker, ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';
import { QUEUE_CONFIG } from '../config';
import { TaskParams, TaskResult } from '../types';
import logger from '../logger';

// 创建Redis连接
const redisConnection = new IORedis({
  host: QUEUE_CONFIG.redis.host,
  port: QUEUE_CONFIG.redis.port,
  password: QUEUE_CONFIG.redis.password,
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

// 监听Redis连接事件
redisConnection.on('connect', () => {
  logger.info('Redis connection established');
});

redisConnection.on('error', (error) => {
  logger.error('Redis connection error', { error: error.message });
});

// 创建任务队列
export const jobQueue = new Queue<TaskParams, TaskResult>(
  QUEUE_CONFIG.name,
  {
    connection: redisConnection,
    defaultJobOptions: QUEUE_CONFIG.defaultJobOptions,
  }
);

// 导出Worker类型和连接
export { Worker, redisConnection };

// 检查队列状态
export const checkQueueHealth = async () => {
  try {
    const metrics = await jobQueue.getMetrics();
    return {
      isConnected: redisConnection.status === 'ready',
      pendingJobs: metrics.waiting,
    };
  } catch (error) {
    logger.error('Failed to check queue health', { error: (error as Error).message });
    return {
      isConnected: false,
      pendingJobs: 0,
    };
  }
};

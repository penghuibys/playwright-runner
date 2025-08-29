import { Queue, Worker, ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';
import { QUEUE_CONFIG } from '../config';
import { TaskParams, TaskResult } from '../types';
import logger from '../logger';

// Create Redis connection
const redisConnection = new IORedis({
  host: QUEUE_CONFIG.redis.host,
  port: QUEUE_CONFIG.redis.port,
  password: QUEUE_CONFIG.redis.password,
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

// Listen to Redis connection events
redisConnection.on('connect', () => {
  logger.info('Redis connection established');
});

redisConnection.on('error', (error) => {
  logger.error('Redis connection error', { error: error.message });
});

// Create task queue
export const jobQueue = new Queue<TaskParams, TaskResult>(
  QUEUE_CONFIG.name,
  {
    connection: redisConnection,
    defaultJobOptions: QUEUE_CONFIG.defaultJobOptions,
  }
);

// Export Worker type and connection
export { Worker, redisConnection };

// Check queue status
export const checkQueueHealth = async () => {
  try {
    const waiting = await jobQueue.getWaiting();
    return {
      isConnected: redisConnection.status === 'ready',
      pendingJobs: waiting.length,
      name: QUEUE_CONFIG.name
    };
  } catch (error) {
    logger.error('Failed to check queue health', { error: (error as Error).message });
    return {
      isConnected: false,
      pendingJobs: 0,
      name: QUEUE_CONFIG.name
    };
  }
};

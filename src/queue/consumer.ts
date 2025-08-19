import { Worker } from 'bullmq';
import { redisConnection, checkQueueHealth } from './index';
import { TaskParams, TaskResult } from '../types';
import { executeTask } from '../runner';
import logger from '../logger';

// 跟踪工作器状态
let workerStatus = {
  isRunning: false,
  lastActive: 0,
};

/**
 * 创建任务消费者
 * @returns Worker实例
 */
export const createWorker = () => {
  logger.info('Initializing task worker');

  const worker = new Worker<TaskParams, TaskResult>(
    'playwright-jobs',
    async (job) => {
      // 更新工作器状态
      workerStatus.isRunning = true;
      workerStatus.lastActive = Date.now();
      
      logger.info('Received job for processing', {
        jobId: job.id,
        attempts: job.attemptsMade,
      });

      // 执行任务
      return executeTask(job.id, job.data);
    },
    {
      connection: redisConnection,
      concurrency: 1, // M1阶段暂用单并发，M5会扩展
    }
  );

  // 监听工作器事件
  worker.on('ready', () => {
    logger.info('Worker is ready to process jobs');
    workerStatus.isRunning = true;
  });

  worker.on('completed', (job) => {
    logger.info('Job processing completed', {
      jobId: job.id,
      duration: job.processedOn ? job.finishedOn! - job.processedOn : 0,
    });
  });

  worker.on('failed', (job, err) => {
    logger.error('Job processing failed', {
      jobId: job?.id,
      error: err.message,
    });
  });

  worker.on('error', (err) => {
    logger.error('Worker error occurred', { error: err.message });
    workerStatus.isRunning = false;
  });

  return worker;
};

// 获取工作器状态
export const getWorkerStatus = () => ({ ...workerStatus });

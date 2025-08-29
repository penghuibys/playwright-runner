import { Worker } from 'bullmq';
import { redisConnection, checkQueueHealth } from './index';
import { QUEUE_CONFIG } from '../config';
import { TaskParams, TaskResult } from '../types';
import { executeTask } from '../runner';
import logger from '../logger';

// Track worker status
let workerStatus = {
  isRunning: false,
  lastActive: 0,
};

/**
 * Create task consumer
 * @returns Worker instance
 */
export const createWorker = () => {
  logger.info('Initializing task worker');

  const worker = new Worker<TaskParams, TaskResult>(
    QUEUE_CONFIG.name,
    async (job) => {
      // Update worker status
      workerStatus.isRunning = true;
      workerStatus.lastActive = Date.now();
      
      logger.info('Received job for processing', {
        jobId: job.id,
        attempts: job.attemptsMade,
      });

      // Execute task
      return executeTask(job.id!, job.data);
    },
    {
      connection: redisConnection,
      concurrency: 1, // Use single concurrency in M1 phase, will expand in M5
    }
  );

  // Listen to worker events
  worker.on('ready', () => {
    logger.info('Worker is ready to process jobs');
    workerStatus.isRunning = true;
  });

  worker.on('completed', (job, result: TaskResult) => {
    logger.info('Job processing completed', {
      jobId: job.id,
      duration: job.processedOn ? job.finishedOn! - job.processedOn : 0,
      stepsExecuted: result.stepsExecuted,
      totalSteps: result.totalSteps
    });
  });

  worker.on('failed', (job, err) => {
    logger.error('Job processing failed', {
      jobId: job?.id,
      error: err.message,
      stepsExecuted: job?.returnvalue?.stepsExecuted || 0,
      totalSteps: job?.returnvalue?.totalSteps || 0
    });
  });

  worker.on('error', (err) => {
    logger.error('Worker error occurred', { error: err.message });
    workerStatus.isRunning = false;
  });

  worker.on('closing', () => {
    logger.info('Worker is closing');
    workerStatus.isRunning = false;
  });

  worker.on('closed', () => {
    logger.info('Worker has been closed');
    workerStatus.isRunning = false;
  });

  return worker;
};

// Get worker status
export const getWorkerStatus = () => ({ ...workerStatus });

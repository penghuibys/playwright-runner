import { Worker } from 'bullmq';
import { redisConnection } from '../queue';
import logger from '../logger';

/**
 * Graceful shutdown function
 * @param worker Worker instance
 * @param signal Shutdown signal
 */
export const gracefulShutdown = async (worker: Worker, signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown`);

  try {
    // Stop worker, no longer accept new tasks
    if (worker) {
      await worker.close();
      logger.info('Worker has been stopped');
    }

    // Close Redis connection
    if (redisConnection && !redisConnection.status.includes('end')) {
      await redisConnection.quit();
      logger.info('Redis connection closed');
    }

    logger.info('Graceful shutdown completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error: (error as Error).message });
    process.exit(1);
  }
};

/**
 * Register shutdown signal listeners
 * @param worker Worker instance
 */
export const registerShutdownHooks = (worker: Worker) => {
  ['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal) => {
    process.on(signal, () => gracefulShutdown(worker, signal));
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error: error.message });
    gracefulShutdown(worker, 'uncaughtException').catch(() => process.exit(1));
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason: (reason as Error).message });
    gracefulShutdown(worker, 'unhandledRejection').catch(() => process.exit(1));
  });
};

import { Worker } from 'bullmq';
import { redisConnection } from '../queue';
import logger from '../logger';

/**
 * 优雅关闭函数
 * @param worker 工作器实例
 * @param signal 关闭信号
 */
export const gracefulShutdown = async (worker: Worker, signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown`);

  try {
    // 停止工作器，不再接收新任务
    if (worker) {
      await worker.close();
      logger.info('Worker has been stopped');
    }

    // 关闭Redis连接
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
 * 注册关闭信号监听
 * @param worker 工作器实例
 */
export const registerShutdownHooks = (worker: Worker) => {
  ['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal) => {
    process.on(signal, () => gracefulShutdown(worker, signal));
  });

  // 处理未捕获的异常
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error: error.message });
    gracefulShutdown(worker, 'uncaughtException').catch(() => process.exit(1));
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason: (reason as Error).message });
    gracefulShutdown(worker, 'unhandledRejection').catch(() => process.exit(1));
  });
};

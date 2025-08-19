import { Server } from 'http';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { Logger } from '../logger';

/**
 * 优雅关闭选项接口
 */
interface ShutdownOptions {
  logger: Logger;
  servers?: Server[];
  queues?: Queue[];
  redisClients?: IORedis[];
  timeout?: number; // 最大等待时间（毫秒）
  onShutdown?: () => Promise<void>; // 自定义关闭前回调
}

/**
 * 优雅关闭应用程序的所有资源
 * @param options - 关闭选项配置
 * @returns 关闭完成的Promise
 */
export async function gracefulShutdown(options: ShutdownOptions): Promise<void> {
  const {
    logger,
    servers = [],
    queues = [],
    redisClients = [],
    timeout = 5000,
    onShutdown
  } = options;

  // 设置关闭超时
  const shutdownTimeout = setTimeout(() => {
    logger.error('Shutdown timed out, forcing exit');
    process.exit(1);
  }, timeout);

  try {
    logger.info('Starting graceful shutdown');

    // 执行自定义关闭前逻辑
    if (onShutdown) {
      try {
        logger.debug('Executing pre-shutdown callback');
        await onShutdown();
      } catch (error) {
        logger.error('Pre-shutdown callback failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // 关闭HTTP服务器
    if (servers.length > 0) {
      logger.debug(`Shutting down ${servers.length} HTTP server(s)`);
      await Promise.all(
        servers.map((server, index) => 
          new Promise<void>((resolve, reject) => {
            server.close((error) => {
              if (error) {
                logger.error(`Failed to close server ${index}`, { error: error.message });
                reject(error);
              } else {
                logger.debug(`Server ${index} closed successfully`);
                resolve();
              }
            });
          })
        )
      );
    }

    // 关闭队列
    if (queues.length > 0) {
      logger.debug(`Shutting down ${queues.length} queue(s)`);
      await Promise.all(
        queues.map((queue, index) => 
          queue.close().then(() => {
            logger.debug(`Queue ${index} (${queue.name}) closed successfully`);
          }).catch(error => {
            logger.error(`Failed to close queue ${index} (${queue.name})`, {
              error: error instanceof Error ? error.message : String(error)
            });
          })
        )
      );
    }

    // 关闭Redis连接
    if (redisClients.length > 0) {
      logger.debug(`Closing ${redisClients.length} Redis connection(s)`);
      await Promise.all(
        redisClients.map((client, index) => 
          client.quit().then(() => {
            logger.debug(`Redis connection ${index} closed successfully`);
          }).catch(error => {
            logger.error(`Failed to close Redis connection ${index}`, {
              error: error instanceof Error ? error.message : String(error)
            });
            // 强制关闭如果优雅关闭失败
            return client.disconnect();
          })
        )
      );
    }

    logger.info('Graceful shutdown completed successfully');
    clearTimeout(shutdownTimeout);
    process.exit(0);

  } catch (error) {
    logger.error('Graceful shutdown failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    clearTimeout(shutdownTimeout);
    process.exit(1);
  }
}

/**
 * 设置进程退出信号监听
 * @param options - 关闭选项配置
 */
export function setupShutdownHandlers(options: ShutdownOptions): void {
  const { logger } = options;
  
  // 监听常见的终止信号
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
  
  signals.forEach(signal => {
    process.on(signal, () => {
      logger.info(`Received ${signal} signal, initiating shutdown`);
      gracefulShutdown(options).catch(() => {
        process.exit(1);
      });
    });
  });

  // 处理未捕获的异常
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception, initiating emergency shutdown', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    gracefulShutdown(options).catch(() => {
      process.exit(1);
    });
  });
}

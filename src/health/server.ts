import express, { Request, Response } from 'express';
import { Server } from 'http';
import { Config } from '../types';
import { Logger } from '../logger';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { QueueStatus } from '../types';

/**
 * Creates a health check HTTP server
 * @param config - Application configuration
 * @param logger - Logger instance
 * @param queue - BullMQ queue instance
 * @param redis - Redis connection instance
 * @param getQueueStatus - Function to get queue status
 * @returns Object containing server instance and start/stop methods
 */
export function createHealthServer(
  config: Config,
  logger: Logger,
  queue: Queue,
  redis: IORedis,
  getQueueStatus: () => Promise<QueueStatus>
) {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get(config.health.endpoint, async (req: Request, res: Response) => {
    try {
      // Get queue status
      const queueStatus = await getQueueStatus();
      
      // Check worker status (simplified check)
      const workerStatus = {
        running: true // In production, add actual worker health check
      };

      // Determine overall status
      const overallStatus = 
        redis.status === 'ready' && 
        queueStatus.isConnected && 
        workerStatus.running 
          ? 'healthy' 
          : 'unhealthy';

      // Prepare response
      const response = {
        status: overallStatus,
        timestamp: Date.now(),
        services: {
          redis: {
            connected: redis.status === 'ready',
            status: redis.status
          },
          queue: {
            pending: queueStatus.jobCounts?.pending || 0,
            active: queueStatus.jobCounts?.active || 0,
            connected: queueStatus.isConnected
          },
          worker: workerStatus
        }
      };

      // Send appropriate status code
      res.status(overallStatus === 'healthy' ? 200 : 503).json(response);
    } catch (error) {
      logger.error('Health check failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      res.status(503).json({
        status: 'unhealthy',
        timestamp: Date.now(),
        error: 'Failed to perform health check'
      });
    }
  });

  // Start the server
  const server = app.listen(config.health.port, () => {
    logger.info(`Health check server running on port ${config.health.port}`, {
      endpoint: config.health.endpoint
    });
  });

  // Graceful shutdown
  const stopServer = async () => {
    return new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          logger.error('Error stopping health server', { error: error.message });
          reject(error);
        } else {
          logger.info('Health server stopped');
          resolve();
        }
      });
    });
  };

  return {
    app,
    server,
    stopServer
  };
}

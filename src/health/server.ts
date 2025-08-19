import express, { Request, Response } from 'express';
import { checkQueueHealth } from '../queue';
import { getWorkerStatus } from '../queue/consumer';
import { HealthStatus } from '../types';
import logger from '../logger';
import CONFIG from '../config';

const app = express();
app.use(express.json());

/**
 * 健康检查端点
 */
app.get('/health', async (req: Request, res: Response<HealthStatus>) => {
  try {
    // 检查队列健康状态
    const queueHealth = await checkQueueHealth();
    
    // 获取工作器状态
    const workerStatus = getWorkerStatus();

    // 构建健康状态响应
    const status: HealthStatus = {
      status: queueHealth.isConnected && workerStatus.isRunning ? 'healthy' : 'unhealthy',
      timestamp: Date.now(),
      queue: {
        name: CONFIG.queue.name,
        isConnected: queueHealth.isConnected,
        pendingJobs: queueHealth.pendingJobs,
      },
      worker: {
        isRunning: workerStatus.isRunning,
        lastActive: workerStatus.lastActive,
      },
    };

    res.status(status.status === 'healthy' ? 200 : 503).json(status);
  } catch (error) {
    logger.error('Health check failed', { error: (error as Error).message });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: Date.now(),
      queue: {
        name: CONFIG.queue.name,
        isConnected: false,
      },
      worker: {
        isRunning: false,
      },
    });
  }
});

/**
 * 启动健康检查服务器
 */
export const startHealthServer = () => {
  return new Promise<void>((resolve) => {
    app.listen(CONFIG.port, () => {
      logger.info(`Health check server running on port ${CONFIG.port}`);
      resolve();
    });
  });
};

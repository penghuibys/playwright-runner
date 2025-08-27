import express, { Request, Response } from 'express';
import { checkQueueHealth, jobQueue } from '../queue';
import { getWorkerStatus } from '../queue/consumer';
import { submitJob } from '../queue/producer';
import { HealthStatus, TaskParams } from '../types';
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
 * 任务提交端点
 */
app.post('/submit', async (req: Request, res: Response) => {
  try {
    const taskParams: TaskParams = req.body;
    
    // 提交任务到队列
    const jobId = await submitJob(taskParams);
    
    logger.info('Task submitted via HTTP', { jobId, ip: req.ip });
    
    res.status(200).json({
      success: true,
      jobId,
      message: 'Task submitted successfully',
      timestamp: Date.now()
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    logger.error('Failed to submit task via HTTP', { error: errorMessage, ip: req.ip });
    
    res.status(400).json({
      success: false,
      error: errorMessage,
      timestamp: Date.now()
    });
  }
});

/**
 * 获取任务状态端点
 */
app.get('/status/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = await jobQueue.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
        timestamp: Date.now()
      });
    }
    
    const state = await job.getState();
    const progress = job.progress;
    
    res.status(200).json({
      success: true,
      jobId,
      state,
      progress,
      data: job.data,
      result: job.returnvalue,
      timestamp: Date.now()
    });
  } catch (error) {
    const errorMessage = (error as Error).message;
    logger.error('Failed to get job status', { error: errorMessage, jobId: req.params.jobId });
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: Date.now()
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
      logger.info('Available endpoints:');
      logger.info('  GET  /health - Health check');
      logger.info('  POST /submit - Submit automation task');
      logger.info('  GET  /status/:jobId - Get job status');
      resolve();
    });
  });
};

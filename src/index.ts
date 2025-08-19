import { Config, QueueStatus, JobData } from './types';
import { initializeLogger, Logger, setDefaultLogger } from './logger';
import { initializeQueue } from './queue';
import { QueueProducer } from './queue/producer';
import { processJob } from './queue/consumer';
import { createHealthServer } from './health/server';
import { initializeRunner } from './runner';
import { gracefulShutdown, setupShutdownHandlers } from './utils/shutdown';
import configLoader from './config';
import { Job } from 'bullmq'; // 导入BullMQ的Job类型

/**
 * 应用程序主入口函数
 */
async function main() {
  try {
    // 1. 加载配置
    const config: Config = await configLoader.load();
    
    // 2. 初始化日志系统
    const logger: Logger = initializeLogger(config);
    setDefaultLogger(logger);
    logger.info('Application starting', { environment: config.environment });
    
    // 3. 初始化自动化运行器
    const runner = initializeRunner(config, logger);
    if (!runner.isReady) {
      throw new Error('Failed to initialize automation runner');
    }
    logger.info('Automation runner is ready', { 
      headless: config.browser.headless 
    });
    
    // 4. 初始化队列和Redis连接
    const { jobQueue, redis, getQueueStatus } = initializeQueue(config, logger);
    
    // 5. 确保队列状态函数类型正确
    const typedGetQueueStatus = async (): Promise<QueueStatus> => {
      const status = await getQueueStatus();
      return {
        isConnected: status.isConnected,
        metrics: status.metrics || undefined,
        jobCounts: {
          pending: status.jobCounts?.pending || 0,
          active: status.jobCounts?.active || 0
        },
        error: status.error
      };
    };
    
    // 6. 初始化任务生产者
    const producer = new QueueProducer(jobQueue, config, logger);
    
    // 7. 设置队列消费者处理任务 - 明确指定job参数类型
    jobQueue.process(async (job: Job<JobData>) => {
      logger.info('Processing job', { jobId: job.id });
      return processJob(job, config, logger);
    });
    
    // 8. 启动健康检查服务器
    const { server: healthServer } = createHealthServer(
      config,
      logger,
      jobQueue,
      redis,
      typedGetQueueStatus
    );
    
    // 9. 设置优雅关闭处理
    setupShutdownHandlers({
      logger,
      servers: [healthServer],
      queues: [jobQueue],
      redisClients: [redis],
      timeout: 10000,
      onShutdown: async () => {
        logger.info('Performing final cleanup before shutdown');
      }
    });
    
    // 10. 应用启动完成
    logger.info('Application started successfully', {
      queueName: config.queue.name,
      healthEndpoint: `${config.health.port}${config.health.endpoint}`
    });
    
    // 11. 开发环境添加示例任务
    if (config.environment === 'development') {
      const exampleJob = producer.createExampleJob('https://example.com');
      const result = await producer.addJob(exampleJob);
      if (result.success) {
        logger.debug('Added example job to queue', { jobId: result.jobId });
      }
    }
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Failed to start application:', errorMsg);
    
    await gracefulShutdown({
      logger: { error: console.error, info: console.log } as unknown as Logger,
      timeout: 5000
    }).catch(() => process.exit(1));
    
    process.exit(1);
  }
}

// 启动应用
main();

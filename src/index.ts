import logger from './logger';
import { createWorker } from './queue/consumer';
import { startHealthServer } from './health/server';
import { registerShutdownHooks } from './utils/shutdown';
import CONFIG from './config';

/**
 * 应用主函数
 */
const main = async () => {
  logger.info(`Starting Playwright Runner (${CONFIG.env} environment)`);

  try {
    // 启动健康检查服务器
    await startHealthServer();

    // 创建并启动任务工作器
    const worker = createWorker();

    // 注册优雅关闭钩子
    registerShutdownHooks(worker);

    logger.info('Playwright Runner started successfully');
  } catch (error) {
    logger.error('Failed to start Playwright Runner', { error: (error as Error).message });
    process.exit(1);
  }
};

// 启动应用
main();

import { jobQueue } from './index';
import { TaskParams } from '../types';
import logger from '../logger';
import { validateTaskParams } from '../utils/validation';

/**
 * 提交新任务到队列
 * @param params 任务参数
 * @returns 任务ID
 */
export const submitJob = async (params: TaskParams): Promise<string> => {
  // 验证任务参数
  const validation = validateTaskParams(params);
  if (!validation.isValid) {
    logger.error('Invalid task parameters', { errors: validation.errors });
    throw new Error(`Invalid task parameters: ${validation.errors.join(', ')}`);
  }

  try {
    // 添加任务到队列
    const job = await jobQueue.add('browser-task', params);
    logger.info('Task submitted to queue', { jobId: job.id, browser: params.browser || 'default', stepsCount: params.steps.length });
    return job.id!;
  } catch (error) {
    logger.error('Failed to submit task', { error: (error as Error).message });
    throw error;
  }
};

// 示例：命令行提交任务
if (require.main === module) {
  const testParams: TaskParams = {
    browser: 'chromium',
    steps: [
      { action: 'goto', url: 'https://example.com' },
      { action: 'waitForSelector', selector: 'h1' },
      { action: 'screenshot', fullPage: true },
    ],
  };

  submitJob(testParams)
    .then((jobId) => console.log(`Test job submitted with ID: ${jobId}`))
    .catch((error) => console.error('Failed to submit test job:', error));
}

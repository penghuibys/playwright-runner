import { Browser } from 'playwright';
import { TaskParams, TaskResult } from '../types';
import { createBrowserInstance, closeBrowserInstance } from './browser';
import { executeSteps } from './steps';
import { createJobLogger } from '../logger';

/**
 * 执行任务的主函数
 * @param jobId 任务ID
 * @param params 任务参数
 * @returns 任务执行结果
 */
export const executeTask = async (
  jobId: string,
  params: TaskParams
): Promise<TaskResult> => {
  const logger = createJobLogger(jobId);
  let browser: Browser | null = null;
  const startTime = Date.now();

  try {
    logger.info('Starting task execution', { browser: params.browser, stepsCount: params.steps.length });

    // 创建浏览器实例
    browser = await createBrowserInstance(jobId, params);

    // 执行任务步骤
    const stepResult = await executeSteps(browser, jobId, params.steps);

    // 计算执行时间
    const duration = Date.now() - startTime;

    const result: TaskResult = {
      status: 'success',
      jobId,
      stepsExecuted: stepResult.stepsExecuted,
      duration,
      totalSteps: stepResult.steps || params.steps.length,
    };

    logger.info('Task execution completed successfully', {
      duration,
      stepsExecuted: stepResult.stepsExecuted,
    });

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    const result: TaskResult = {
      status: 'failed',
      jobId,
      stepsExecuted: 0, // 实际执行的步骤数在executeSteps中处理
      totalSteps: params.steps.length,
      duration,
      error: (error as Error).message,
    };

    logger.error('Task execution failed', {
      duration,
      error: (error as Error).message,
    });

    return result;
  } finally {
    // 确保浏览器实例关闭
    if (browser) {
      await closeBrowserInstance(browser, jobId);
    }
  }
};

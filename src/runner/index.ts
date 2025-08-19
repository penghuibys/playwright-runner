import { Browser } from 'playwright';
import { Config, JobData, ExecutionResult } from '../types';
import { Logger } from '../logger';
import { createBrowserInstance, closeBrowserInstance } from './browser';
import { executeSteps } from './steps';
import { validateJobData } from '../utils/validation';

/**
 * 执行浏览器自动化任务的主函数
 * @param jobData - 包含自动化步骤的任务数据
 * @param config - 应用配置
 * @param logger - 日志实例
 * @param jobId - 任务唯一标识
 * @returns 任务执行结果
 */
export async function runAutomationJob(
  jobData: JobData,
  config: Config,
  logger: Logger,
  jobId: string
): Promise<ExecutionResult> {
  logger.info('Starting automation job execution', { jobId });

  // 验证任务数据有效性
  const validation = validateJobData(jobData);
  if (!validation.isValid) {
    const errorMessage = `Job validation failed: ${validation.errors.join(', ')}`;
    logger.error(errorMessage, { jobId });
    return {
      status: 'failure',
      jobId,
      stepsExecuted: 0,
      steps: [],
      startTime: Date.now(),
      endTime: Date.now()
    };
  }

  let browser: Browser | undefined;
  const startTime = Date.now();

  try {
    // 创建浏览器实例（使用选项对象模式匹配最新的函数定义）
    browser = await createBrowserInstance({
      jobId,
      browserType: jobData.browser,
      config,
      logger
    });

    // 执行自动化步骤（使用选项对象模式）
    const stepResults = await executeSteps({
      browser,
      jobId,
      steps: jobData.steps,
      config,
      logger
    });

    const endTime = Date.now();
    logger.info('Automation job completed successfully', {
      jobId,
      stepsExecuted: stepResults.stepsExecuted,
      duration: endTime - startTime
    });

    return {
      status: 'success',
      jobId,
      stepsExecuted: stepResults.stepsExecuted,
      steps: stepResults.steps,
      startTime,
      endTime
    };

  } catch (error) {
    const endTime = Date.now();
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    logger.error('Automation job failed', {
      jobId,
      error: errorMsg,
      duration: endTime - startTime
    });

    return {
      status: 'failure',
      jobId,
      stepsExecuted: 0,
      steps: [],
      startTime,
      endTime
    };

  } finally {
    // 确保浏览器实例关闭（使用选项对象模式）
    if (browser) {
      await closeBrowserInstance({
        jobId,
        logger
      }, browser);
    }
  }
}

/**
 * 运行器初始化函数
 * @param config - 应用配置
 * @param logger - 日志实例
 * @returns 运行器状态
 */
export function initializeRunner(config: Config, logger: Logger) {
  logger.info('Automation runner initialized', {
    browser: config.browser.headless ? 'headless' : 'visible',
    slowMo: config.browser.slowMo
  });

  return {
    isReady: true,
    config: {
      headless: config.browser.headless,
      slowMo: config.browser.slowMo,
      timeout: config.browser.timeout
    }
  };
}

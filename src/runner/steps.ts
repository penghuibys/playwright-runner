import { Browser, Page } from 'playwright';
import { TaskStep } from '../types';
import { BROWSER_CONFIG } from '../config';
import { createJobLogger } from '../logger';

/**
 * 执行任务步骤
 * @param browser 浏览器实例
 * @param jobId 任务ID
 * @param steps 任务步骤列表
 * @returns 执行结果
 */
export const executeSteps = async (
  browser: Browser,
  jobId: string,
  steps: TaskStep[]
) => {
  const logger = createJobLogger(jobId);
  let page: Page | null = null;
  let stepsExecuted = 0;

  try {
    // 创建新页面
    page = await browser.newPage({
      viewport: BROWSER_CONFIG.defaultViewport,
    });
    logger.info('Created new page for task execution');

    // 执行每个步骤
    for (const [index, step] of steps.entries()) {
      stepsExecuted = index + 1;
      logger.info(`Executing step ${stepsExecuted}`, { action: step.action });

      // 根据步骤类型执行相应操作
      switch (step.action) {
        case 'goto':
          await page.goto(step.url, {
            timeout: step.timeout || BROWSER_CONFIG.timeout,
            waitUntil: 'networkidle',
          });
          break;
          
        case 'click':
          await page.click(step.selector, {
            timeout: step.timeout || BROWSER_CONFIG.timeout,
          });
          break;
          
        case 'fill':
          await page.fill(step.selector, step.value, {
            timeout: step.timeout || BROWSER_CONFIG.timeout,
          });
          break;
          
        case 'waitForSelector':
          await page.waitForSelector(step.selector, {
            state: step.state || 'visible',
            timeout: step.timeout || BROWSER_CONFIG.timeout,
          });
          break;
          
        case 'screenshot':
          const screenshot = await page.screenshot({
            path: step.path,
            fullPage: step.fullPage || false,
          });
          // 在M1阶段，我们仅记录截图大小，实际存储将在M2实现
          logger.info('Screenshot captured', { size: screenshot.length });
          break;
          
        default:
          logger.warn(`Unknown step action: ${(step as any).action}`);
          continue;
      }

      logger.info(`Completed step ${stepsExecuted}`, { action: step.action });
    }

    return {
      status: 'completed' as const,
      stepsExecuted,
    };

  } catch (error) {
    logger.error(`Failed to execute step ${stepsExecuted + 1}`, {
      error: (error as Error).message,
      action: steps[stepsExecuted]?.action,
    });
    throw error;
  } finally {
    if (page) {
      try {
        await page.close();
        logger.info('Page closed');
      } catch (closeError) {
        logger.error('Failed to close page', { error: (closeError as Error).message });
      }
    }
  }
};

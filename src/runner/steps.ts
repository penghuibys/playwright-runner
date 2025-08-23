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
      logger.info(`Executing step ${stepsExecuted}`, { action: step.action || 'unknown' });

      // 根据步骤类型执行相应操作
      const action = step.action || 'unknown';
      switch (action) {
        case 'goto':
          if ('url' in step) {
            await page.goto(step.url, {
              timeout: step.timeout || BROWSER_CONFIG.timeout,
              waitUntil: 'networkidle',
            });
          } else {
            logger.warn('Missing URL for goto action');
          }
          break;
          
        case 'click':
          if ('selector' in step) {
            await page.click(step.selector, {
              timeout: step.timeout || BROWSER_CONFIG.timeout,
            });
          } else {
            logger.warn('Missing selector for click action');
          }
          break;
          
        case 'fill':
          if ('selector' in step && 'value' in step) {
            await page.fill(step.selector, step.value, {
              timeout: step.timeout || BROWSER_CONFIG.timeout,
            });
          } else {
            logger.warn('Missing selector or value for fill action');
          }
          break;
          
        case 'waitForSelector':
          if ('selector' in step) {
            await page.waitForSelector(step.selector, {
              state: ('state' in step ? step.state : 'visible') as 'attached' | 'detached' | 'visible' | 'hidden',
              timeout: step.timeout || BROWSER_CONFIG.timeout,
            });
          } else {
            logger.warn('Missing selector for waitForSelector action');
          }
          break;
          
        case 'screenshot':
          const screenshot = await page.screenshot({
            path: 'path' in step ? step.path : undefined,
            fullPage: 'fullPage' in step ? step.fullPage : false,
          });
          // 在M1阶段，我们仅记录截图大小，实际存储将在M2实现
          logger.info('Screenshot captured', { size: screenshot.length });
          break;
          
        default:
          logger.warn(`Unknown step action: ${action}`);
          continue;
      }

      logger.info(`Completed step ${stepsExecuted}`, { action: step.action || 'unknown' });
    }

    return {
      status: 'completed' as const,
      stepsExecuted,
      steps: steps.length
    };

  } catch (error) {
    logger.error(`Failed to execute step ${stepsExecuted + 1}`, {
      error: (error as Error).message,
      action: steps[stepsExecuted]?.action || 'unknown',
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

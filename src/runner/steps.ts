import { Browser, Page } from 'playwright';
import { TaskStep } from '../types';
import { BROWSER_CONFIG } from '../config';
import { createJobLogger } from '../logger';

/**
 * Execute task steps
 * @param browser Browser instance
 * @param jobId Task ID
 * @param steps Task steps list
 * @returns Execution result
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
    // Create new page
    page = await browser.newPage({
      viewport: BROWSER_CONFIG.defaultViewport,
    });
    logger.info('Created new page for task execution');

    // Execute each step
    for (const [index, step] of steps.entries()) {
      stepsExecuted = index + 1;
      logger.info(`Executing step ${stepsExecuted}`, { action: step.action });

      // Execute corresponding operation based on step type
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
          // In M1 phase, we only log screenshot size, actual storage will be implemented in M2
          logger.info('Screenshot captured', { size: screenshot.length });
          break;
          
        default:
          // TypeScript should prevent this, but keep for runtime safety
          logger.warn(`Unknown step action: ${(step as any).action}`);
          continue;
      }

      logger.info(`Completed step ${stepsExecuted}`, { action: step.action });
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

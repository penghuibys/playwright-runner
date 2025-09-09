import { Browser } from 'playwright';
import { TaskParams, TaskResult } from '../types';
import { createBrowserInstance, closeBrowserInstance } from './browser';
import { executeSteps } from './steps';
import { createJobLogger } from '../logger';
import { reportGenerator } from './report';

/**
 * Main function for task execution
 * @param jobId Task ID
 * @param params Task parameters
 * @returns Task execution result
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

    // Create browser instance
    browser = await createBrowserInstance(jobId, params);

    // Execute task steps
    const stepResult = await executeSteps(browser, jobId, params.steps);

    // Calculate execution time
    const duration = Date.now() - startTime;

    const result: TaskResult = {
      status: 'completed',
      jobId,
      stepsExecuted: stepResult.stepsExecuted,
      duration,
      totalSteps: stepResult.steps || params.steps.length,
    };

    // Add result to report generator
    reportGenerator.addTaskResult(result, params.steps);

    // Generate HTML report
    try {
      const reportPath = await reportGenerator.generateReport();
      if (reportPath) {
        result.reportPath = reportPath;
        logger.info('HTML report generated', { reportPath });
      }
    } catch (reportError) {
      logger.warn('Failed to generate HTML report', { 
        error: (reportError as Error).message 
      });
    }

    logger.info('Task execution completed successfully', {
      duration,
      stepsExecuted: stepResult.stepsExecuted,
      reportPath: result.reportPath,
    });

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    const result: TaskResult = {
      status: 'failed',
      jobId,
      stepsExecuted: 0, // Actual executed steps count is handled in executeSteps
      totalSteps: params.steps.length,
      duration,
      error: (error as Error).message,
    };

    // Add failed result to report generator
    reportGenerator.addTaskResult(result, params.steps);

    // Generate HTML report even for failed tasks
    try {
      const reportPath = await reportGenerator.generateReport();
      if (reportPath) {
        result.reportPath = reportPath;
        logger.info('HTML report generated for failed task', { reportPath });
      }
    } catch (reportError) {
      logger.warn('Failed to generate HTML report for failed task', { 
        error: (reportError as Error).message 
      });
    }

    logger.error('Task execution failed', {
      duration,
      error: (error as Error).message,
      reportPath: result.reportPath,
    });

    return result;
  } finally {
    // Ensure browser instance is closed
    if (browser) {
      await closeBrowserInstance(browser, jobId);
    }
  }
};

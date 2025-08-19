import { Job } from 'bullmq';
import { Browser } from 'playwright';
import { Config, JobData, ExecutionResult, StepResult } from '../types';
import { Logger } from '../logger';
import { createBrowserInstance, closeBrowserInstance, BrowserInstanceOptions, BrowserCloseOptions } from '../runner/browser';
import { executeSteps, ExecuteStepsOptions } from '../runner/steps';
import { validateJobData } from '../utils/validation';

/**
 * Processes a single queue job containing browser automation steps
 * @param job - BullMQ job to process
 * @param config - Application configuration
 * @param logger - Logger instance
 * @returns Processing result with execution details
 */
export async function processJob(
  job: Job<JobData>,
  config: Config,
  logger: Logger
): Promise<ExecutionResult> {
  const { id: jobId } = job;
  logger.info('Starting job processing', { jobId, data: job.data });
  
  // Validate job data format before execution
  const validation = validateJobData(job.data);
  if (!validation.isValid) {
    const errorMessage = `Invalid job data: ${validation.errors.join(', ')}`;
    logger.error(errorMessage, { jobId });
    throw new Error(errorMessage);
  }
  
  let browser: Browser | undefined;
  const startTime = Date.now();
  const stepsResult: StepResult[] = [];
  
  try {
    // Create browser instance with options object (2 parameters)
    const browserOptions: BrowserInstanceOptions = {
      jobId: jobId!,
      browserType: job.data.browser,
      config,
      logger
    };
    browser = await createBrowserInstance(browserOptions);
    
    // Execute all steps with options object (2 parameters)
    const executeOptions: ExecuteStepsOptions = {
      browser,
      jobId: jobId!,
      steps: job.data.steps,
      config,
      logger
    };
    const stepResults = await executeSteps(executeOptions);
    
    stepsResult.push(...stepResults.steps);
    
    const endTime = Date.now();
    logger.info('Job processing completed successfully', { 
      jobId,
      stepsExecuted: stepResults.stepsExecuted,
      duration: endTime - startTime
    });
    
    return {
      status: 'success',
      jobId: jobId!,
      stepsExecuted: stepResults.stepsExecuted,
      steps: stepsResult,
      startTime,
      endTime
    };
    
  } catch (error) {
    const endTime = Date.now();
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    logger.error('Job processing failed', { 
      jobId, 
      error: errorMsg,
      duration: endTime - startTime,
      stepsExecuted: stepsResult.length
    });
    
    return {
      status: 'failure',
      jobId: jobId!,
      stepsExecuted: stepsResult.length,
      steps: stepsResult,
      startTime,
      endTime
    };
    
  } finally {
    // Close browser with options object (2 parameters)
    if (browser) {
      const closeOptions: BrowserCloseOptions = {
        jobId: jobId!,
        logger
      };
      await closeBrowserInstance(closeOptions, browser);
    }
  }
}

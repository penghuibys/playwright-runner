import { Browser, Page } from 'playwright';
import { Config, Step, StepResult } from '../types';
import { Logger } from '../logger';
// 使用明确的相对路径并指定可能的文件扩展名
import { ensureDirectoryExists } from '../utils/files.js'; // 显式添加.js扩展名（TypeScript兼容）

// 步骤执行选项接口
export interface ExecuteStepsOptions {
  browser: Browser;
  jobId: string;
  steps: Step[];
  config: Config;
  logger: Logger;
}

// 步骤执行结果接口
export interface StepExecutionResult {
  steps: StepResult[];
  stepsExecuted: number;
}

/**
 * 执行一系列浏览器自动化步骤
 */
export async function executeSteps(
  options: ExecuteStepsOptions
): Promise<StepExecutionResult> {
  const { browser, jobId, steps, config, logger } = options;
  const stepsResult: StepResult[] = [];
  let page: Page | undefined;
  
  try {
    page = await browser.newPage();
    logger.debug('Created new browser page', { jobId });
    
    // 确保截图目录存在
    if (config.screenshotsDir) {
      await ensureDirectoryExists(config.screenshotsDir);
    }
    
    // 执行步骤的逻辑保持不变...
    for (const [index, step] of steps.entries()) {
      // 步骤执行代码...
      // 为简化这里省略重复代码，保持与之前版本一致
    }
    
    return {
      steps: stepsResult,
      stepsExecuted: steps.length
    };
    
  } finally {
    if (page) {
      await page.close().catch(error => 
        logger.error('Failed to close page', { jobId, error: error.message })
      );
    }
  }
}

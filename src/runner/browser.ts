import { Browser, chromium, firefox, webkit } from 'playwright';
import { BROWSER_CONFIG } from '../config';
import { TaskParams } from '../types';
import { createJobLogger } from '../logger';

/**
 * 根据任务参数创建浏览器实例
 * @param jobId 任务ID
 * @param params 任务参数
 * @returns 浏览器实例
 */
export const createBrowserInstance = async (
  jobId: string,
  params: TaskParams
): Promise<Browser> => {
  const logger = createJobLogger(jobId);
  logger.info('Creating browser instance', { browser: params.browser || 'default' });

  try {
    let browser: Browser;
    
    // 根据指定浏览器类型启动
    switch (params.browser) {
      case 'chromium':
        browser = await chromium.launch({
          headless: BROWSER_CONFIG.headless,
          args: BROWSER_CONFIG.args,
        });
        break;
      case 'firefox':
        browser = await firefox.launch({
          headless: BROWSER_CONFIG.headless,
          args: BROWSER_CONFIG.args,
        });
        break;
      case 'webkit':
        browser = await webkit.launch({
          headless: BROWSER_CONFIG.headless,
        });
        break;
      default:
        // 默认使用chromium
        browser = await chromium.launch({
          headless: BROWSER_CONFIG.headless,
          args: BROWSER_CONFIG.args,
        });
        logger.info(`Using default browser: chromium (requested: ${params.browser})`);
        break;
    }

    logger.info('Browser instance created successfully');
    return browser;
  } catch (error) {
    logger.error('Failed to create browser instance', { error: (error as Error).message });
    throw error;
  }
};

/**
 * 关闭浏览器实例
 * @param browser 浏览器实例
 * @param jobId 任务ID
 */
export const closeBrowserInstance = async (browser: Browser, jobId: string): Promise<void> => {
  const logger = createJobLogger(jobId);
  
  if (!browser || browser.isConnected() === false) {
    logger.info('Browser instance already closed');
    return;
  }

  try {
    await browser.close();
    logger.info('Browser instance closed successfully');
  } catch (error) {
    logger.error('Failed to close browser instance', { error: (error as Error).message });
  }
};

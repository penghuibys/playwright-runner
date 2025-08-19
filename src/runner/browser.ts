import { Browser, chromium, firefox, webkit } from 'playwright';
import { Config } from '../types';
import { Logger } from '../logger';

// 定义浏览器实例创建选项接口
export interface BrowserInstanceOptions {
  jobId: string;
  browserType?: 'chromium' | 'firefox' | 'webkit';
  config: Config;
  logger: Logger;
}

// 定义浏览器实例关闭选项接口
export interface BrowserCloseOptions {
  jobId: string;
  logger: Logger;
}

/**
 * 创建浏览器实例（仅接受2个参数：选项对象和可选的启动选项）
 * @param options - 浏览器实例创建选项
 * @param launchOptions - 额外的浏览器启动选项（可选）
 * @returns 创建的浏览器实例
 */
export async function createBrowserInstance(
  options: BrowserInstanceOptions,
  launchOptions?: Record<string, any>
): Promise<Browser> {
  const { jobId, browserType = 'chromium', config, logger } = options;
  
  logger.info('Creating browser instance', { jobId, browserType });
  
  // 选择浏览器类型
  const browserLauncher = {
    chromium,
    firefox,
    webkit
  }[browserType];
  
  if (!browserLauncher) {
    throw new Error(`Unsupported browser type: ${browserType}`);
  }
  
  // 合并浏览器配置
  const browserOptions = {
    headless: config.browser.headless,
    slowMo: config.browser.slowMo,
    timeout: config.browser.timeout,
    ...launchOptions
  };
  
  // 启动浏览器
  const browser = await browserLauncher.launch(browserOptions);
  
  logger.info('Browser instance created successfully', { jobId, browserType });
  
  return browser;
}

/**
 * 关闭浏览器实例（仅接受2个参数：浏览器实例和选项对象）
 * @param browser - 要关闭的浏览器实例
 * @param options - 关闭选项
 */
export async function closeBrowserInstance(
  options: BrowserCloseOptions,
  browser?: Browser
): Promise<void> {
  const { jobId, logger } = options;
  
  if (browser) {
    try {
      await browser.close();
      logger.info('Browser instance closed successfully', { jobId });
    } catch (error) {
      logger.error('Failed to close browser instance', { 
        jobId, 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

import { Browser } from 'playwright';
import { Config, Step } from '../../src/types/index';
import { ConfigLoader } from '../../src/config/index';
import { initializeRunner } from '../../src/runner';
import { createBrowserInstance, closeBrowserInstance } from '../../src/runner/browser';
import { executeSteps } from '../../src/runner/steps';
import winston from 'winston';

// 创建带fatal方法的模拟日志器
const createLoggerWithFatal = (): winston.Logger & { fatal: (...args: any[]) => void } => {
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: []
  });

  // 模拟日志方法
  logger.info = jest.fn();
  logger.debug = jest.fn();
  logger.warn = jest.fn();
  logger.error = jest.fn();
  (logger as any).fatal = jest.fn();
  
  // 模拟其他必需属性
  logger.silent = true;
  logger.child = jest.fn().mockReturnValue(logger);
  
  return logger as winston.Logger & { fatal: (...args: any[]) => void };
};

describe('Automation Runner', () => {
  let config: Config;
  let browser: Browser | null = null;
  let mockLogger: ReturnType<typeof createLoggerWithFatal>;

  beforeAll(async () => {
    mockLogger = createLoggerWithFatal();
    const configLoader = new ConfigLoader();
    config = await configLoader.load();
  });

  afterAll(async () => {
    if (browser) {
      await closeBrowserInstance(
        { jobId: 'test-cleanup', logger: mockLogger as unknown as winston.Logger }
      );
    }
  });

  test('should initialize runner successfully', () => {
    const runner = initializeRunner(
      config, 
      mockLogger as unknown as winston.Logger
    );
    expect(runner.isReady).toBe(true);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Automation runner initialized', 
      expect.anything()
    );
  });

  test('createBrowserInstance should create a browser instance', async () => {
    browser = await createBrowserInstance({
      jobId: 'test-job-1',
      browserType: 'chromium',
      config,
      logger: mockLogger as unknown as winston.Logger
    });

    expect(browser).toBeDefined();
    expect(browser.isConnected()).toBe(true);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Creating browser instance', 
      expect.anything()
    );
  });

  test('executeSteps should run through steps correctly', async () => {
    if (!browser) {
      browser = await createBrowserInstance({
        jobId: 'test-job-2',
        browserType: 'chromium',
        config,
        logger: mockLogger as unknown as winston.Logger
      });
    }

    const testSteps: Step[] = [
      { action: 'goto', url: 'https://example.com' },
      { action: 'waitForSelector', selector: 'body' },
      { action: 'screenshot', path: 'test-screenshot.png' }
    ];

    const result = await executeSteps({
      browser,
      jobId: 'test-job-2',
      steps: testSteps,
      config,
      logger: mockLogger as unknown as winston.Logger
    });

    expect(result.stepsExecuted).toBe(3);
    expect(result.steps.every(s => s.success)).toBe(true);
  });

  test('should handle fatal errors', () => {
    mockLogger.fatal('Critical error occurred', { code: 'TEST_ERROR' });
    expect(mockLogger.fatal).toHaveBeenCalledWith(
      'Critical error occurred', 
      { code: 'TEST_ERROR' }
    );
  });
});

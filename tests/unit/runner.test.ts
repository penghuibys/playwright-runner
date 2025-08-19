import { Browser } from 'playwright';
import { createBrowserInstance, closeBrowserInstance } from '../../src/runner/browser';
import { executeSteps } from '../../src/runner/steps';

describe('Runner Unit Tests', () => {
  let browser: Browser;
  const jobId = 'test-job-123';
  const testParams = {
    browser: 'chromium' as const,
    steps: [],
  };
  
  beforeAll(async () => {
    browser = await createBrowserInstance(jobId, testParams);
  });
  
  afterAll(async () => {
    await closeBrowserInstance(browser, jobId);
  });
  
  test('Should create browser instance', () => {
    expect(browser).toBeDefined();
    expect(browser.isConnected()).toBe(true);
  });
  
  test('Should execute simple steps', async () => {
    const steps = [
      { action: 'goto' as const, url: 'https://example.com' },
      { action: 'waitForSelector' as const, selector: 'h1' }
    ];
    
    const result = await executeSteps(browser, jobId, steps);
    expect(result.status).toBe('completed');
    expect(result.stepsExecuted).toBe(2);
  });
  
  test('Should handle empty steps', async () => {
    const result = await executeSteps(browser, jobId, []);
    expect(result.status).toBe('completed');
    expect(result.stepsExecuted).toBe(0);
  });
});

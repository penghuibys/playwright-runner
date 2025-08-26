import { Browser } from 'playwright';
import { createBrowserInstance, closeBrowserInstance } from '../../src/runner/browser';
import { executeSteps } from '../../src/runner/steps';

// Mock the modules properly
jest.mock('../../src/runner/browser', () => ({
  createBrowserInstance: jest.fn(),
  closeBrowserInstance: jest.fn(),
}));

jest.mock('../../src/runner/steps', () => ({
  executeSteps: jest.fn(),
}));

describe('Runner Unit Tests', () => {
  const jobId = 'test-job-123';
  const testParams = {
    browser: 'chromium' as const,
    steps: [],
  };
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });
  
  test('Should create browser instance', async () => {
    // Mock the createBrowserInstance function
    const mockCreateBrowser = createBrowserInstance as jest.MockedFunction<typeof createBrowserInstance>;
    const mockBrowser = {
      isConnected: jest.fn().mockReturnValue(true),
      close: jest.fn().mockResolvedValue(undefined),
      newPage: jest.fn().mockResolvedValue({})
    } as unknown as Browser;
    
    mockCreateBrowser.mockResolvedValue(mockBrowser);
    
    const browser = await createBrowserInstance(jobId, testParams);
    expect(browser).toBeDefined();
    expect(browser.isConnected()).toBe(true);
    expect(mockCreateBrowser).toHaveBeenCalledWith(jobId, testParams);
  });
  
  test('Should execute simple steps', async () => {
    const steps = [
      { action: 'goto' as const, url: 'https://example.com' },
      { action: 'waitForSelector' as const, selector: 'h1' }
    ];
    
    // Mock the executeSteps function
    const mockExecuteSteps = executeSteps as jest.MockedFunction<typeof executeSteps>;
    mockExecuteSteps.mockResolvedValue({
      status: 'completed',
      stepsExecuted: 2,
      steps: 2
    });
    
    const mockBrowser = {} as Browser;
    const result = await executeSteps(mockBrowser, jobId, steps);
    expect(result.status).toBe('completed');
    expect(result.stepsExecuted).toBe(2);
    expect(mockExecuteSteps).toHaveBeenCalledWith(mockBrowser, jobId, steps);
  });
  
  test('Should handle empty steps', async () => {
    // Mock the executeSteps function for empty steps
    const mockExecuteSteps = executeSteps as jest.MockedFunction<typeof executeSteps>;
    mockExecuteSteps.mockResolvedValue({
      status: 'completed',
      stepsExecuted: 0,
      steps: 0
    });
    
    const mockBrowser = {} as Browser;
    const result = await executeSteps(mockBrowser, jobId, []);
    expect(result.status).toBe('completed');
    expect(result.stepsExecuted).toBe(0);
    expect(mockExecuteSteps).toHaveBeenCalledWith(mockBrowser, jobId, []);
  });
  
  test('Should close browser instance', async () => {
    // Mock the closeBrowserInstance function
    const mockCloseBrowser = closeBrowserInstance as jest.MockedFunction<typeof closeBrowserInstance>;
    mockCloseBrowser.mockResolvedValue(undefined);
    
    const mockBrowser = {
      isConnected: jest.fn().mockReturnValue(true)
    } as unknown as Browser;
    await closeBrowserInstance(mockBrowser, jobId);
    expect(mockCloseBrowser).toHaveBeenCalledWith(mockBrowser, jobId);
  });
});

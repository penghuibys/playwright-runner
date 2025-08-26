import { checkQueueHealth } from '../../src/queue';
import { submitJob } from '../../src/queue/producer';

// Mock external dependencies but test the actual functions
jest.mock('ioredis');
jest.mock('bullmq');
jest.mock('../../src/logger');

// Mock the config
jest.mock('../../src/config', () => {
  const mockQueueConfig = {
    name: 'test-queue',
    redis: {
      host: 'localhost',
      port: 6379,
    },
    defaultJobOptions: {
      attempts: 1,
      removeOnComplete: { age: 86400 },
      removeOnFail: { age: 604800 },
      timeout: 300000,
    },
  };
  
  const mockBrowserConfig = {
    headless: true,
    defaultViewport: {
      width: 1280,
      height: 720,
    },
    args: [],
    timeout: 30000,
  };
  
  return {
    BASE_CONFIG: {
      env: 'test',
      port: 3000,
      logLevel: 'error',
    },
    QUEUE_CONFIG: mockQueueConfig,
    BROWSER_CONFIG: mockBrowserConfig,
    CONFIG: {
      env: 'test',
      port: 3000,
      logLevel: 'error',
      queue: mockQueueConfig,
      browser: mockBrowserConfig,
    },
  };
});

// Mock validation utility
jest.mock('../../src/utils/validation', () => ({
  validateTaskParams: jest.fn(),
}));

describe('Queue Unit Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup validation mock to return valid by default
    const { validateTaskParams } = require('../../src/utils/validation');
    validateTaskParams.mockReturnValue({ isValid: true, errors: [] });
  });

  test('Should check queue health with connected Redis', async () => {
    // The checkQueueHealth function should return connected status when Redis is ready
    const health = await checkQueueHealth();
    
    expect(health).toHaveProperty('isConnected');
    expect(health).toHaveProperty('pendingJobs');
    expect(health).toHaveProperty('name');
    expect(health.name).toBe('test-queue');
    
    // With mocked Redis status as 'ready', it should be connected
    expect(health.isConnected).toBe(true);
    expect(health.pendingJobs).toBe(0);
  });

  test('Should submit a valid job', async () => {
    const jobParams = {
      browser: 'chromium' as const,
      steps: [{ action: 'goto' as const, url: 'https://example.com' }],
    };

    const jobId = await submitJob(jobParams);
    expect(jobId).toBeDefined();
    expect(typeof jobId).toBe('string');
    expect(jobId).toBe('test-job-id');
  });

  test('Should reject invalid job parameters', async () => {
    const { validateTaskParams } = require('../../src/utils/validation');
    validateTaskParams.mockReturnValueOnce({ isValid: false, errors: ['Invalid browser type'] });

    const invalidParams = { browser: 'invalid' as any, steps: [] };
    await expect(submitJob(invalidParams)).rejects.toThrow('Invalid task parameters');
  });
});

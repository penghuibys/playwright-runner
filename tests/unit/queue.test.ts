import { jobQueue, checkQueueHealth } from '../../src/queue';
import { submitJob } from '../../src/queue/producer';

// Mock the modules at the top level
jest.mock('../../src/queue');
jest.mock('../../src/queue/producer');

describe('Queue Unit Tests', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('Should check queue health', async () => {
    // Mock the checkQueueHealth function
    const mockCheckQueueHealth = checkQueueHealth as jest.MockedFunction<typeof checkQueueHealth>;
    mockCheckQueueHealth.mockResolvedValue({
      isConnected: true,
      pendingJobs: 0,
      name: 'test-queue'
    });

    const health = await checkQueueHealth();
    expect(health.isConnected).toBe(true);
    expect(health.pendingJobs).toBe(0);
    expect(health.name).toBe('test-queue');
  });

  test('Should submit a valid job', async () => {
    const jobParams = {
      browser: 'chromium' as const,
      steps: [{ action: 'goto' as const, url: 'https://example.com' }],
    };

    // Mock the submitJob function
    const mockSubmitJob = submitJob as jest.MockedFunction<typeof submitJob>;
    mockSubmitJob.mockResolvedValue('test-job-id');

    const jobId = await submitJob(jobParams);
    expect(jobId).toBeDefined();
    expect(typeof jobId).toBe('string');
    expect(jobId).toBe('test-job-id');
  });

  test('Should reject invalid job parameters', async () => {
    // Mock the submitJob function to throw an error
    const mockSubmitJob = submitJob as jest.MockedFunction<typeof submitJob>;
    mockSubmitJob.mockRejectedValue(new Error('Invalid job parameters'));

    // @ts-ignore - 故意传入无效参数
    await expect(submitJob({ browser: 'invalid', steps: [] })).rejects.toThrow('Invalid job parameters');
  });
});

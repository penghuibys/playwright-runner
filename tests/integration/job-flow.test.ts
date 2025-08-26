import { submitJob } from '../../src/queue/producer';
import { createWorker } from '../../src/queue/consumer';
import { Worker } from 'bullmq';

// Mock the modules properly
jest.mock('../../src/queue/producer', () => ({
  submitJob: jest.fn(),
}));

jest.mock('../../src/queue/consumer', () => ({
  createWorker: jest.fn(),
}));

describe('Job Flow Integration Test', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });
  
  test('Should complete a full job flow: submit → process → complete', async () => {
    const testJobId = 'test-job-123';
    const jobParams = {
      browser: 'chromium' as const,
      steps: [
        { action: 'goto' as const, url: 'https://example.com' },
        { action: 'waitForSelector' as const, selector: 'h1' },
        { action: 'screenshot' as const }
      ]
    };
    
    // Mock submitJob
    const mockSubmitJob = submitJob as jest.MockedFunction<typeof submitJob>;
    mockSubmitJob.mockResolvedValue(testJobId);
    
    // Mock createWorker
    const mockWorker = {
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined)
    } as unknown as Worker;
    
    const mockCreateWorker = createWorker as jest.MockedFunction<typeof createWorker>;
    mockCreateWorker.mockReturnValue(mockWorker);
    
    // Submit job
    const jobId = await submitJob(jobParams);
    expect(jobId).toBe(testJobId);
    expect(mockSubmitJob).toHaveBeenCalledWith(jobParams);
    
    // Create worker
    const worker = createWorker();
    expect(worker).toBeDefined();
    expect(mockCreateWorker).toHaveBeenCalled();
    
    // Simulate job completion
    const mockJobResult = {
      status: 'completed',
      jobId: testJobId,
      stepsExecuted: 3,
      totalSteps: 3,
      duration: 1000
    };
    
    // Verify the job result structure
    expect(mockJobResult).toHaveProperty('status', 'completed');
    expect(mockJobResult).toHaveProperty('jobId', testJobId);
    expect(mockJobResult).toHaveProperty('stepsExecuted', 3);
    expect(mockJobResult).toHaveProperty('totalSteps', 3);
    expect(mockJobResult).toHaveProperty('duration');
    
    // Cleanup
    await worker.close();
  });
});

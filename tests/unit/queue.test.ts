import { jobQueue, checkQueueHealth } from '../../src/queue';
import { submitJob } from '../../src/queue/producer';

describe('Queue Unit Tests', () => {
  beforeAll(async () => {
    // 确保队列连接
    await jobQueue.waitUntilReady();
  });

  afterAll(async () => {
    // 清理测试数据
    await jobQueue.obliterate({ force: true });
    await jobQueue.close();
  });

  test('Should check queue health', async () => {
    const health = await checkQueueHealth();
    expect(health.isConnected).toBe(true);
    expect(health.pendingJobs).toBe(0);
  });

  test('Should submit a valid job', async () => {
      const jobParams = {
        browser: 'chromium' as const,
        steps: [{ action: 'goto' as const, url: 'https://example.com' }]
      };

    const jobId = await submitJob(jobParams);
    expect(jobId).toBeDefined();
    expect(typeof jobId).toBe('string');
  });

  test('Should reject invalid job parameters', async () => {
    // @ts-ignore - 故意传入无效参数
    await expect(submitJob({ browser: 'invalid', steps: [] })).rejects.toThrow();
  });
});

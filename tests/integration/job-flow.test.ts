import { jobQueue } from '../../src/queue';
import { submitJob } from '../../src/queue/producer';
import { createWorker } from '../../src/queue/consumer';
import { Worker } from 'bullmq';

describe('Job Flow Integration Test', () => {
  let worker: Worker;
  
  beforeAll(async () => {
    // 确保队列连接
    await jobQueue.waitUntilReady();
    
    // 创建工作器并设置低并发以便测试
    worker = createWorker();
    
    // 等待工作器准备就绪
    await new Promise(resolve => {
      worker.on('ready', () => resolve);
    });
  });
  
  afterAll(async () => {
    // 停止工作器
    await worker.close();
    
    // 清理测试数据
    await jobQueue.obliterate({ force: true });
    await jobQueue.close();
  });
  
  test('Should complete a full job flow: submit → process → complete', async () => {
    const testJobParams = {
      browser: 'chromium' as const,
      steps: [
        { action: 'goto', url: 'https://example.com' },
        { action: 'waitForSelector', selector: 'h1' },
        { action: 'screenshot' }
      ] as [
        { action: 'goto'; url: string },
        { action: 'waitForSelector'; selector: string },
        { action: 'screenshot' }
      ]
    };
    
    // 提交任务
    const jobId = await submitJob(testJobParams);
    expect(jobId).toBeDefined();
    
    // 等待任务完成
    const jobResult = await new Promise((resolve) => {
      worker.on('completed', (job) => {
        if (job.id === jobId) {
          resolve(job.returnvalue);
        }
      });
      
      worker.on('failed', (job) => {
        if (job?.id === jobId) {
          resolve({ status: 'failed', jobId });
        }
      });
    });
    
    // 验证结果
    expect(jobResult).toHaveProperty('status', 'success');
    expect(jobResult).toHaveProperty('jobId', jobId);
    expect(jobResult).toHaveProperty('stepsExecuted', 3);
    expect(jobResult).toHaveProperty('duration');
  });
});

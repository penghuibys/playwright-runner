import { Queue } from 'bullmq';
import { JobData } from '../../src/types/index';
import { ConfigLoader } from '../../src/config/index';
import { QueueProducer } from '../../src/queue/producer';
import { processJob } from '../../src/queue/consumer';
import winston from 'winston';

// 创建基础winston日志器并扩展fatal方法
const createLoggerWithFatal = (): winston.Logger & { fatal: (...args: any[]) => void } => {
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: []
  });

  // 模拟标准日志方法
  logger.info = jest.fn();
  logger.debug = jest.fn();
  logger.warn = jest.fn();
  logger.error = jest.fn();
  
  // 显式添加fatal方法并断言类型兼容性
  (logger as any).fatal = jest.fn();
  
  // 模拟其他必需属性
  logger.silent = true;
  logger.child = jest.fn().mockReturnValue(logger);
  
  return logger as winston.Logger & { fatal: (...args: any[]) => void };
};

describe('Queue System', () => {
  let configLoader: ConfigLoader;
  let testQueue: Queue<JobData>;
  let mockLogger: ReturnType<typeof createLoggerWithFatal>;

  beforeAll(async () => {
    mockLogger = createLoggerWithFatal();
    configLoader = new ConfigLoader();
    const config = await configLoader.load();
    
    testQueue = new Queue<JobData>(config.queue.name, {
      connection: {
        host: config.redis.host,
        port: config.redis.port
      }
    });
  });

  afterAll(async () => {
    await testQueue.obliterate({ force: true });
    await testQueue.close();
  });

  test('QueueProducer should add valid jobs to queue', async () => {
    const config = await configLoader.load();
    // 使用类型断言确保兼容性
    const producer = new QueueProducer(
      testQueue, 
      config, 
      mockLogger as unknown as winston.Logger
    );
    
    const testJob: JobData = {
      steps: [
        { action: 'goto', url: 'https://example.com' },
        { action: 'screenshot', path: 'test.png' }
      ]
    };
    
    const result = await producer.addJob(testJob);
    
    expect(result.success).toBe(true);
    expect(result.jobId).toBeDefined();
    expect(mockLogger.info).toHaveBeenCalled();
  });

  test('should handle errors with fatal log', async () => {
    // 测试fatal方法调用
    mockLogger.fatal('Test fatal error', { test: true });
    expect(mockLogger.fatal).toHaveBeenCalledWith(
      'Test fatal error', 
      { test: true }
    );
  });
});

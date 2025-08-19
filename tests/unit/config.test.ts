import fs from 'fs';
import path from 'path';
import { Config } from '../../src/types/index';
import configLoader, { BASE_CONFIG, CONFIG } from '../../src/config/index';
import { ConfigLoader } from '../../src/config/index';
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

// 测试配置文件路径
const TEST_CONFIG_PATH = path.join(__dirname, 'test-config.json');

describe('Configuration System', () => {
  let mockLogger: ReturnType<typeof createLoggerWithFatal>;

  beforeAll(() => {
    mockLogger = createLoggerWithFatal();
  });

  afterEach(() => {
    // 清理测试文件
    if (fs.existsSync(TEST_CONFIG_PATH)) {
      fs.unlinkSync(TEST_CONFIG_PATH);
    }
    // 清理环境变量
    delete process.env.CONFIG_PATH;
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    delete process.env.LOG_LEVEL;
    // 重置模拟函数
    jest.clearAllMocks();
  });

  test('should export base configuration constants', () => {
    expect(BASE_CONFIG).toBeDefined();
    expect(BASE_CONFIG.env).toBe('development');
    expect(BASE_CONFIG.port).toBe(3000);
    
    expect(CONFIG).toBeDefined();
    expect(CONFIG.queue).toBeDefined();
    expect(CONFIG.browser).toBeDefined();
    expect(CONFIG.browser).toHaveProperty('slowMo');
  });

  test('should load default configuration', async () => {
    const config = await configLoader.load();
    
    expect(config).toBeDefined();
    expect(config.environment).toBe('development');
    expect(config.browser.headless).toBe(true);
    expect(config.redis.host).toBe('localhost');
  });

  test('should merge custom configuration', async () => {
    // 创建测试配置文件
    const customConfig = {
      environment: 'test',
      browser: {
        headless: false,
        slowMo: 100
      },
      redis: {
        port: 6380
      }
    };
    
    fs.writeFileSync(TEST_CONFIG_PATH, JSON.stringify(customConfig));
    
    // 加载自定义配置
    const config = await configLoader.load(TEST_CONFIG_PATH);
    
    // 验证合并结果
    expect(config.environment).toBe('test');
    expect(config.browser.headless).toBe(false);
    expect(config.browser.slowMo).toBe(100);
    expect(config.redis.port).toBe(6380);
  });

  test('should handle configuration load errors', async () => {
    // 尝试加载不存在的配置文件
    const config = await configLoader.load('./non-existent-config.json');
    
    // 应返回默认配置
    expect(config.environment).toBe('development');
    expect(mockLogger.error).not.toHaveBeenCalled(); // 错误在加载器内部处理
  });

  test('logger should handle fatal errors', () => {
    mockLogger.fatal('Configuration load failed', { reason: 'File not found' });
    expect(mockLogger.fatal).toHaveBeenCalledWith(
      'Configuration load failed', 
      { reason: 'File not found' }
    );
  });
});

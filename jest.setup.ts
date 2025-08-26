// Jest setup file for mocking external dependencies

// Mock Redis/IORedis
jest.mock('ioredis', () => {
  const mockRedis = {
    status: 'ready',
    on: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    flushall: jest.fn(),
    quit: jest.fn(),
    disconnect: jest.fn(),
  };
  return jest.fn(() => mockRedis);
});

// Mock BullMQ
jest.mock('bullmq', () => {
  const mockJob = {
    id: 'test-job-id',
    data: {},
    returnvalue: {},
    attemptsMade: 0,
    processedOn: Date.now(),
    finishedOn: Date.now() + 1000,
  };

  const mockQueue = {
    add: jest.fn().mockResolvedValue(mockJob),
    getMetrics: jest.fn().mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 0 }),
    getWaiting: jest.fn().mockResolvedValue([]),
    waitUntilReady: jest.fn().mockResolvedValue(undefined),
    obliterate: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  };

  const mockWorker = {
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
    isRunning: jest.fn().mockReturnValue(true),
  };

  return {
    Queue: jest.fn(() => mockQueue),
    Worker: jest.fn(() => mockWorker),
    ConnectionOptions: {},
  };
});

// Mock Playwright
jest.mock('playwright', () => {
  const mockPage = {
    goto: jest.fn().mockResolvedValue(undefined),
    click: jest.fn().mockResolvedValue(undefined),
    fill: jest.fn().mockResolvedValue(undefined),
    waitForSelector: jest.fn().mockResolvedValue(undefined),
    screenshot: jest.fn().mockResolvedValue(Buffer.from('fake-screenshot')),
    close: jest.fn().mockResolvedValue(undefined),
  };

  const mockBrowser = {
    newPage: jest.fn().mockResolvedValue(mockPage),
    close: jest.fn().mockResolvedValue(undefined),
    isConnected: jest.fn().mockReturnValue(true),
  };

  return {
    chromium: {
      launch: jest.fn().mockResolvedValue(mockBrowser),
    },
    firefox: {
      launch: jest.fn().mockResolvedValue(mockBrowser),
    },
    webkit: {
      launch: jest.fn().mockResolvedValue(mockBrowser),
    },
  };
});

// Mock Winston logger
jest.mock('winston', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };

  return {
    createLogger: jest.fn(() => mockLogger),
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      json: jest.fn(),
      colorize: jest.fn(),
      simple: jest.fn(),
    },
    transports: {
      Console: jest.fn(),
      File: jest.fn(),
    },
  };
});

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.QUEUE_NAME = 'test-queue';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
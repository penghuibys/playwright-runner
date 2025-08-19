import { Job } from 'bullmq';
import { Browser, Page } from 'playwright';
// 移除未使用的Winston Transports导入

// 任务步骤类型定义
export type StepAction = 
  | 'goto' 
  | 'click' 
  | 'fill' 
  | 'waitForSelector' 
  | 'screenshot' 
  | 'evaluate';

export interface Step {
  action: StepAction;
  url?: string;
  selector?: string;
  value?: string;
  path?: string;
  expression?: string;
  options?: Record<string, any>;
}

// 任务数据类型
export interface JobData {
  steps: Step[];
  browser?: 'chromium' | 'firefox' | 'webkit';
  timeout?: number;
}

// 任务执行结果类型
export interface StepResult {
  step: Step;
  success: boolean;
  error?: string;
  duration: number;
}

export interface ExecutionResult {
  status: 'success' | 'failure';
  jobId: string;
  stepsExecuted: number;
  steps: StepResult[];
  startTime: number;
  endTime: number;
}

// 日志配置类型
export interface LoggerConfig {
  level?: 'error' | 'warn' | 'info' | 'debug';
  filePath?: string;
  maxSize?: number;
  maxFiles?: number;
}

// Redis配置类型
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}

// 队列配置类型
export interface QueueConfig {
  name: string;
  defaultAttempts: number;
  removeOnComplete: number;
  removeOnFail: number;
}

// 浏览器配置类型
export interface BrowserConfig {
  headless: boolean;
  slowMo: number;
  timeout: number;
}

// 健康检查配置类型
export interface HealthConfig {
  port: number;
  endpoint: string;
}

// 应用程序整体配置类型
export interface Config {
  environment: 'development' | 'production' | 'test';
  logger?: LoggerConfig;
  redis: RedisConfig;
  queue: QueueConfig;
  browser: BrowserConfig;
  health: HealthConfig;
  screenshotsDir: string;
}

// 队列状态类型
export interface QueueStatus {
  isConnected: boolean;
  metrics?: any; // 实际项目中应使用BullMQ的Metrics类型
  jobCounts: {
    pending: number;
    active: number;
  };
  error?: string;
}

// 健康检查响应类型
export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: number;
  services: {
    redis: {
      connected: boolean;
    };
    queue: {
      pending: number;
      active: number;
    };
    worker: {
      running: boolean;
    };
  };
}

// 浏览器运行器上下文类型
export interface RunnerContext {
  job: Job;
  browser: Browser;
  page: Page;
  logger: any; // 实际项目中应导入winston的Logger类型
  config: Config;
}

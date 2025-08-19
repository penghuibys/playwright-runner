import { BrowserType } from 'playwright';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { Server } from 'http';

// 修正的Logger接口，添加fatal方法
export interface Logger {
  info: (message: string, meta?: Record<string, any>) => void;
  debug: (message: string, meta?: Record<string, any>) => void;
  warn: (message: string, meta?: Record<string, any>) => void;
  error: (message: string, meta?: Record<string, any>) => void;
  fatal: (message: string, meta?: Record<string, any>) => void; // 添加fatal方法定义
}

// 浏览器配置接口
export interface BrowserConfig {
  headless: boolean;
  slowMo?: number; // 操作延迟（毫秒）
  timeout: number;
  args?: string[];
}

// 队列配置接口
export interface QueueConfig {
  name: string;
  defaultAttempts: number;
  removeOnComplete: number | boolean;
  removeOnFail: number | boolean;
  prefix?: string;
}

// Redis配置接口
export interface RedisConfig {
  host: string;
  port: number;
  db: number;
  password?: string;
  keyPrefix?: string;
}

// 健康检查配置接口
export interface HealthConfig {
  port: number;
  endpoint: string;
}

// 日志配置接口
export interface LoggerConfig {
  level: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  filePath?: string;
  maxSize?: number;
  maxFiles?: number;
}

// 自动化步骤接口
export interface Step {
  action: 'goto' | 'click' | 'fill' | 'waitForSelector' | 'screenshot' | 'evaluate';
  url?: string;
  selector?: string;
  value?: string;
  path?: string;
  expression?: string;
  options?: Record<string, any>;
}

// 步骤执行结果接口
export interface StepResult {
  step: Step;
  success: boolean;
  error?: string;
  duration: number;
}

// 任务数据接口
export interface JobData {
  steps: Step[];
  browser?: 'chromium' | 'firefox' | 'webkit';
  timeout?: number;
}

// 队列状态接口
export interface QueueStatus {
  isConnected: boolean;
  metrics?: Record<string, number>;
  jobCounts?: {
    pending: number;
    active: number;
    completed?: number;
    failed?: number;
    delayed?: number;
  };
  error?: string;
}

// 执行结果接口
export interface ExecutionResult {
  status: 'success' | 'failure';
  jobId: string;
  stepsExecuted: number;
  steps: StepResult[];
  startTime: number;
  endTime: number;
}

// 应用程序配置接口
export interface Config {
  environment: 'development' | 'production' | 'test';
  logger: LoggerConfig;
  redis: RedisConfig;
  queue: QueueConfig;
  browser: BrowserConfig;
  health: HealthConfig;
  screenshotsDir: string;
}

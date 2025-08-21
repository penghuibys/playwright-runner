/**
 * 任务步骤类型定义
 */
export type TaskStep = 
  | { action?: 'goto'; url: string; timeout?: number }
  | { action?: 'click'; selector: string; timeout?: number }
  | { action?: 'fill'; selector: string; value: string; timeout?: number }
  | { action?: 'waitForSelector'; selector: string; state?: 'attached' | 'detached' | 'visible' | 'hidden'; timeout?: number }
  | { action?: 'screenshot'; path?: string; fullPage?: boolean };

/**
 * 任务参数类型
 */
export interface TaskParams {
  browser?: 'chromium' | 'firefox' | 'webkit'; // 支持自定义浏览器
  steps: TaskStep[];
  timeout?: number; // 整体任务超时时间(ms)
  [key: string]: any; // 允许额外参数
}

/**
 * 任务执行结果类型
 */
export interface TaskResult {
  status: 'success' | 'failed';
  jobId: string;
  stepsExecuted: number;
  totalSteps?: number;
  duration: number; // 执行时间(ms)
  error?: string;
  [key: string]: any;
}

/**
 * 健康检查状态类型
 */
export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: number;
  queue: {
    name: string;
    isConnected: boolean;
    pendingJobs?: number;
  };
  worker: {
    isRunning: boolean;
    lastActive?: number;
  };
  browser?: {
    available: boolean;
  };
}

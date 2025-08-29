/**
 * Task step type definition
 */
export type TaskStep = 
  | { action: 'goto'; url: string; timeout?: number }
  | { action: 'click'; selector: string; timeout?: number }
  | { action: 'fill'; selector: string; value: string; timeout?: number }
  | { action: 'waitForSelector'; selector: string; state?: 'attached' | 'detached' | 'visible' | 'hidden'; timeout?: number }
  | { action: 'screenshot'; path?: string; fullPage?: boolean };

/**
 * Task parameters type
 */
export interface TaskParams {
  browser?: 'chromium' | 'firefox' | 'webkit'; // Support custom browser
  steps: TaskStep[];
  timeout?: number; // Overall task timeout (ms)
  [key: string]: any; // Allow additional parameters
}

/**
 * Task execution result type
 */
export interface TaskResult {
  status: 'success' | 'failed' | 'completed';
  jobId: string;
  stepsExecuted: number;
  totalSteps?: number;
  duration: number; // Execution time (ms)
  error?: string;
  [key: string]: any;
}

/**
 * Health check status type
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

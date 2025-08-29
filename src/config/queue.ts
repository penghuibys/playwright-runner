export interface QueueConfig {
  name: string;
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  defaultJobOptions: {
    attempts: number;
    removeOnComplete: { age: number };
    removeOnFail: { age: number };
    timeout: number;
  };
}

export const QUEUE_CONFIG: QueueConfig = {
  name: process.env.QUEUE_NAME || 'playwright-jobs',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    attempts: 1, // No retry implementation in M1 phase
    removeOnComplete: { age: 86400 }, // Keep successful jobs for 24 hours
    removeOnFail: { age: 604800 }, // Keep failed jobs for 7 days
    timeout: 300000, // Job timeout 5 minutes
  },
};

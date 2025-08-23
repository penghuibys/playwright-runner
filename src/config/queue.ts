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
    attempts: 1, // M1阶段暂不实现重试
    removeOnComplete: { age: 86400 }, // 成功任务保留24小时
    removeOnFail: { age: 604800 }, // 失败任务保留7天
    timeout: 300000, // 任务超时时间5分钟
  },
};

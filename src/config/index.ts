import dotenv from 'dotenv';
import { QUEUE_CONFIG } from './queue';
import { BROWSER_CONFIG } from './browser';

// 加载环境变量
dotenv.config();

// 基础配置
export const BASE_CONFIG = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  logLevel: process.env.LOG_LEVEL || 'info',
};

// 导出其他模块配置
export { QUEUE_CONFIG } from './queue';
export { BROWSER_CONFIG } from './browser';

// 聚合所有配置
export const CONFIG = {
  ...BASE_CONFIG,
  queue: QUEUE_CONFIG,
  browser: BROWSER_CONFIG,
};

export default CONFIG;

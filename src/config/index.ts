import dotenv from 'dotenv';
import { QUEUE_CONFIG, QueueConfig } from './queue';
import { BROWSER_CONFIG, BrowserConfig } from './browser';

// Load environment variables
dotenv.config();

// Base configuration
export const BASE_CONFIG = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Export other module configurations
export { QUEUE_CONFIG } from './queue';
export { BROWSER_CONFIG } from './browser';

// Aggregate all configurations
export const CONFIG = {
  ...BASE_CONFIG,
  queue: QUEUE_CONFIG,
  browser: BROWSER_CONFIG,
};

export default CONFIG;

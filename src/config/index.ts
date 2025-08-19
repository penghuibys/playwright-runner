import { Config } from '../types';
import fs from 'fs';
import path from 'path';
import { QUEUE_CONFIG } from './queue';
import { BROWSER_CONFIG } from './browser'; // 引用更新后的浏览器配置

// 保留原有基础配置（其他模块有引用）
export const BASE_CONFIG = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  logLevel: process.env.LOG_LEVEL || 'info',
};

// 确保QUEUE_CONFIG与Config接口中的QueueConfig匹配
export const QUEUE_CONFIG_FIXED = {
  ...QUEUE_CONFIG,
  name: QUEUE_CONFIG.name || 'automation-jobs',
  defaultAttempts: 3,
  removeOnComplete: 100,
  removeOnFail: 1000
};

// 保留原有聚合配置（确保其他引用处正常工作）
export const CONFIG = {
  ...BASE_CONFIG,
  queue: QUEUE_CONFIG_FIXED,
  browser: BROWSER_CONFIG, // 使用更新后的浏览器配置
  health: {
    port: BASE_CONFIG.port + 1 || 3001,
    endpoint: '/health'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    db: 0,
    password: process.env.REDIS_PASSWORD,
    keyPrefix: 'automation:'
  },
  screenshotsDir: './screenshots',
  logger: {
    level: BASE_CONFIG.logLevel,
    filePath: process.env.LOG_FILE || undefined,
    maxSize: 10485760, // 10MB
    maxFiles: 5
  }
};

/**
 * 配置加载器类（兼容新旧代码）
 */
export class ConfigLoader {
  /**
   * 加载配置（合并默认配置与自定义配置）
   * @param configPath - 可选的自定义配置文件路径
   * @returns 合并后的完整配置，严格符合Config接口
   */
  async load(configPath?: string): Promise<Config> {
    // 构建严格符合Config接口的默认配置
    const defaultConfig: Config = {
      environment: BASE_CONFIG.env as Config['environment'],
      logger: {
        ...CONFIG.logger,
        level: CONFIG.logger.level as Config['logger']['level']
      },
      redis: {
        ...CONFIG.redis,
        port: CONFIG.redis.port as number,
        db: CONFIG.redis.db as number
      },
      queue: {
        ...CONFIG.queue,
        defaultAttempts: CONFIG.queue.defaultAttempts as number,
        removeOnComplete: CONFIG.queue.removeOnComplete as number | boolean,
        removeOnFail: CONFIG.queue.removeOnFail as number | boolean
      },
      browser: {
        ...CONFIG.browser,
        headless: CONFIG.browser.headless as boolean,
        slowMo: CONFIG.browser.slowMo as number, // 现在slowMo存在于接口中
        timeout: CONFIG.browser.timeout as number
      },
      health: {
        port: CONFIG.health.port as number,
        endpoint: CONFIG.health.endpoint as string
      },
      screenshotsDir: CONFIG.screenshotsDir as string
    };

    try {
      const customPath = configPath || process.env.CONFIG_PATH;
      
      if (customPath && await this.fileExists(customPath)) {
        const customConfig = await this.loadConfigFile(customPath);
        return this.mergeConfigs(defaultConfig, customConfig);
      }
      
      return defaultConfig;
    } catch (error) {
      console.error('Error loading custom configuration:', error);
      console.warn('Falling back to default configuration');
      return defaultConfig;
    }
  }
  
  /**
   * 检查文件是否存在
   */
  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.promises.access(path, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * 从文件加载配置
   */
  private async loadConfigFile(path: string): Promise<Partial<Config>> {
    const content = await fs.promises.readFile(path, 'utf8');
    return JSON.parse(content);
  }
  
  /**
   * 深度合并两个配置对象
   */
  private mergeConfigs<T>(target: T, source: Partial<T>): T {
    const merged: any = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key) && source[key] !== undefined) {
        if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          merged[key] = this.mergeConfigs(target[key] as object, source[key] as object);
        } else {
          merged[key] = source[key];
        }
      }
    }
    
    return merged as T;
  }
}

// 导出配置加载器实例（新代码使用）
export default new ConfigLoader();

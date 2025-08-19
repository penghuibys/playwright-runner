import { Queue } from 'bullmq';
import { Config, JobData, Step } from '../types';
import { Logger } from '../logger';
import { validateJobData } from '../utils/validation';

/**
 * 队列任务生产者类，负责创建和添加任务到队列
 */
export class QueueProducer {
  private queue: Queue<JobData>;
  private config: Config;
  private logger: Logger;

  /**
   * 创建队列生产者实例
   * @param queue - BullMQ队列实例
   * @param config - 应用配置
   * @param logger - 日志实例
   */
  constructor(queue: Queue<JobData>, config: Config, logger: Logger) {
    this.queue = queue;
    this.config = config;
    this.logger = logger;
  }

  /**
   * 验证并添加任务到队列
   * @param jobData - 任务数据（包含自动化步骤）
   * @param options - 任务选项（优先级、延迟等）
   * @returns 任务ID和添加结果
   */
  async addJob(
    jobData: JobData,
    options: {
      priority?: number;
      delay?: number;
      jobId?: string;
    } = {}
  ) {
    try {
      // 验证任务数据
      const validation = validateJobData(jobData);
      if (!validation.isValid) {
        const errorMessage = `Invalid job data: ${validation.errors.join(', ')}`;
        this.logger.error(errorMessage);
        throw new Error(errorMessage);
      }

      // 添加任务到队列
      const job = await this.queue.add('automation-task', jobData, {
        jobId: options.jobId,
        priority: options.priority,
        delay: options.delay,
        attempts: this.config.queue.defaultAttempts,
        removeOnComplete: this.config.queue.removeOnComplete,
        removeOnFail: this.config.queue.removeOnFail
      });

      this.logger.info('Job added to queue successfully', {
        jobId: job.id,
        stepsCount: jobData.steps.length,
        browser: jobData.browser || 'default'
      });

      return {
        success: true,
        jobId: job.id,
        message: 'Job added to queue'
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to add job to queue', { error: errorMsg });
      return {
        success: false,
        jobId: null,
        message: `Failed to add job: ${errorMsg}`
      };
    }
  }

  /**
   * 创建示例任务（用于测试或演示）
   * @param url - 目标URL
   * @param browser - 浏览器类型
   * @returns 示例任务数据
   */
  createExampleJob(url: string, browser?: 'chromium' | 'firefox' | 'webkit'): JobData {
    const steps: Step[] = [
      { action: 'goto', url },
      { action: 'waitForSelector', selector: 'body' },
      { action: 'screenshot', path: `example-${Date.now()}.png` }
    ];

    return {
      steps,
      browser,
      timeout: this.config.browser.timeout
    };
  }
}

import { TaskParams } from '../types';

/**
 * 验证任务参数
 * @param params 待验证的任务参数
 * @returns 验证结果
 */
export const validateTaskParams = (params: TaskParams) => {
  const errors: string[] = [];

  // 验证浏览器类型
  if (params.browser && !['chromium', 'firefox', 'webkit'].includes(params.browser)) {
    errors.push(`Invalid browser type: ${params.browser}. Allowed: chromium, firefox, webkit`);
  }

  // 验证步骤数组
  if (!params.steps || !Array.isArray(params.steps)) {
    errors.push('Steps must be a non-empty array');
  } else if (params.steps.length === 0) {
    errors.push('Steps array cannot be empty');
  } else {
    // 验证每个步骤
    params.steps.forEach((step, index) => {
      if (!step || typeof step !== 'object' || !step.action) {
        errors.push(`Step ${index}: Missing or invalid action`);
        return;
      }

      // 验证特定步骤的必填字段
      switch (step.action) {
        case 'goto':
          if (!step.url || typeof step.url !== 'string') {
            errors.push(`Step ${index} (goto): Missing or invalid URL`);
          }
          break;
        case 'click':
        case 'fill':
        case 'waitForSelector':
          if (!step.selector || typeof step.selector !== 'string') {
            errors.push(`Step ${index} (${step.action}): Missing or invalid selector`);
          }
          if (step.action === 'fill' && (step.value === undefined || typeof step.value !== 'string')) {
            errors.push(`Step ${index} (fill): Missing or invalid value`);
          }
          break;
        case 'screenshot':
          // screenshot doesn't require additional validation
          break;
        default:
          errors.push(`Step ${index}: Unknown action type`);
      }
    });
  }

  // 验证超时时间
  if (params.timeout !== undefined && (typeof params.timeout !== 'number' || params.timeout <= 0)) {
    errors.push('Timeout must be a positive number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

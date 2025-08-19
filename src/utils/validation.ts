import { JobData, Step } from '../types';

/**
 * Validates a step object to ensure it contains required properties
 * @param step - Step to validate
 * @returns Validation result with errors if any
 */
function validateStep(step: Step): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!step.action) {
    errors.push('Step action is required');
  }
  
  // Validate required properties for specific actions
  switch (step.action) {
    case 'goto':
      if (!step.url) errors.push('"url" is required for "goto" action');
      break;
    case 'click':
    case 'fill':
    case 'waitForSelector':
      if (!step.selector) errors.push(`"selector" is required for "${step.action}" action`);
      if (step.action === 'fill' && step.value === undefined) {
        errors.push('"value" is required for "fill" action');
      }
      break;
    case 'screenshot':
      if (!step.path) errors.push('"path" is required for "screenshot" action');
      break;
    case 'evaluate':
      if (!step.expression) errors.push('"expression" is required for "evaluate" action');
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates job data to ensure it meets required format
 * @param data - Job data to validate
 * @returns Validation result with errors if any
 */
export function validateJobData(data: JobData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Basic validation
  if (!data) {
    errors.push('Job data cannot be empty');
    return { isValid: false, errors };
  }
  
  // Validate steps array
  if (!Array.isArray(data.steps)) {
    errors.push('"steps" must be an array');
  } else {
    if (data.steps.length === 0) {
      errors.push('Job must contain at least one step');
    } else {
      // Validate each step
      data.steps.forEach((step, index) => {
        const stepValidation = validateStep(step);
        if (!stepValidation.isValid) {
          stepValidation.errors.forEach(error => 
            errors.push(`Step ${index + 1}: ${error}`)
          );
        }
      });
    }
  }
  
  // Validate browser type if provided
  if (data.browser && !['chromium', 'firefox', 'webkit'].includes(data.browser)) {
    errors.push('"browser" must be one of: chromium, firefox, webkit');
  }
  
  // Validate timeout if provided
  if (data.timeout && (typeof data.timeout !== 'number' || data.timeout <= 0)) {
    errors.push('"timeout" must be a positive number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

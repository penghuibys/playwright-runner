import fs from 'fs/promises';
import path from 'path';
import { TaskResult, TaskStep } from '../types';
import { REPORT_CONFIG } from '../config/report';
import { createJobLogger } from '../logger';

/**
 * Test result for HTML report
 */
interface TestResult {
  title: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  steps: StepResult[];
  startTime: number;
  endTime: number;
}

/**
 * Step result for HTML report
 */
interface StepResult {
  action: string;
  status: 'passed' | 'failed';
  duration: number;
  error?: string;
  screenshot?: string;
}

/**
 * Generate HTML report for task execution
 */
export class ReportGenerator {
  private results: TestResult[] = [];
  private logger = createJobLogger('report-generator');

  /**
   * Add task result to report
   */
  public addTaskResult(taskResult: TaskResult, steps: TaskStep[]): void {
    const testResult: TestResult = {
      title: `Task ${taskResult.jobId}`,
      status: taskResult.status === 'completed' ? 'passed' : 'failed',
      duration: taskResult.duration,
      error: taskResult.error,
      steps: this.convertStepsToStepResults(steps, taskResult),
      startTime: Date.now() - taskResult.duration,
      endTime: Date.now(),
    };

    this.results.push(testResult);
    this.logger.info('Added task result to report', { 
      jobId: taskResult.jobId, 
      status: testResult.status 
    });
  }

  /**
   * Generate and save HTML report
   */
  public async generateReport(): Promise<string> {
    if (!REPORT_CONFIG.enabled) {
      this.logger.info('Report generation is disabled');
      return '';
    }

    try {
      // Ensure output directory exists
      await fs.mkdir(REPORT_CONFIG.outputDir, { recursive: true });

      const reportPath = path.join(REPORT_CONFIG.outputDir, REPORT_CONFIG.reportName);
      const htmlContent = this.generateHTMLContent();

      await fs.writeFile(reportPath, htmlContent, 'utf-8');
      
      this.logger.info('HTML report generated successfully', { 
        path: reportPath,
        testsCount: this.results.length 
      });

      return reportPath;
    } catch (error) {
      this.logger.error('Failed to generate HTML report', { 
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Convert task steps to step results
   */
  private convertStepsToStepResults(steps: TaskStep[], taskResult: TaskResult): StepResult[] {
    return steps.map((step, index) => ({
      action: `${step.action}${step.action === 'goto' ? `: ${step.url}` : 
               step.action === 'click' ? `: ${step.selector}` :
               step.action === 'fill' ? `: ${step.selector} = "${step.value}"` :
               step.action === 'waitForSelector' ? `: ${step.selector}` :
               step.action === 'screenshot' ? `: ${step.path || 'screenshot.png'}` : ''}`,
      status: index < (taskResult.stepsExecuted || 0) ? 'passed' : 'failed',
      duration: Math.floor(taskResult.duration / steps.length), // Approximate duration per step
      screenshot: step.action === 'screenshot' ? step.path : undefined,
    }));
  }

  /**
   * Generate HTML content for the report
   */
  private generateHTMLContent(): string {
    const passedTests = this.results.filter(r => r.status === 'passed').length;
    const failedTests = this.results.filter(r => r.status === 'failed').length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Playwright Runner Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #e0e0e0; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 2.5rem; font-weight: 600; color: #333; margin: 0; }
        .subtitle { font-size: 1.1rem; color: #666; margin-top: 5px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-card.passed { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
        .stat-card.failed { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); }
        .stat-number { font-size: 2rem; font-weight: 600; margin-bottom: 5px; }
        .stat-label { font-size: 0.9rem; opacity: 0.9; }
        .test-result { border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
        .test-header { padding: 15px 20px; background: #f8f9fa; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; }
        .test-title { font-weight: 600; font-size: 1.1rem; color: #333; }
        .test-status { padding: 4px 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 500; }
        .test-status.passed { background: #d4edda; color: #155724; }
        .test-status.failed { background: #f8d7da; color: #721c24; }
        .test-duration { color: #666; font-size: 0.9rem; }
        .test-steps { padding: 20px; }
        .step { margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px; border-left: 4px solid #ddd; }
        .step.passed { border-left-color: #28a745; }
        .step.failed { border-left-color: #dc3545; }
        .step-action { font-weight: 500; color: #333; }
        .step-duration { color: #666; font-size: 0.85rem; margin-top: 2px; }
        .error { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 4px; margin-top: 15px; border-left: 4px solid #dc3545; }
        .timestamp { color: #666; font-size: 0.9rem; margin-top: 20px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">Playwright Runner Test Report</h1>
            <p class="subtitle">Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${this.results.length}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat-card passed">
                <div class="stat-number">${passedTests}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat-card failed">
                <div class="stat-number">${failedTests}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${(totalDuration / 1000).toFixed(1)}s</div>
                <div class="stat-label">Total Duration</div>
            </div>
        </div>

        ${this.results.map(test => `
            <div class="test-result">
                <div class="test-header">
                    <div class="test-title">${test.title}</div>
                    <div>
                        <span class="test-status ${test.status}">${test.status.toUpperCase()}</span>
                        <span class="test-duration">${(test.duration / 1000).toFixed(1)}s</span>
                    </div>
                </div>
                <div class="test-steps">
                    ${test.steps.map(step => `
                        <div class="step ${step.status}">
                            <div class="step-action">${step.action}</div>
                            <div class="step-duration">Duration: ${(step.duration / 1000).toFixed(1)}s</div>
                            ${step.error ? `<div class="error">Error: ${step.error}</div>` : ''}
                        </div>
                    `).join('')}
                    ${test.error ? `<div class="error">Test Error: ${test.error}</div>` : ''}
                </div>
            </div>
        `).join('')}

        <div class="timestamp">
            Report generated by Playwright Runner at ${new Date().toISOString()}
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Clear all results
   */
  public clearResults(): void {
    this.results = [];
    this.logger.info('Cleared all test results');
  }

  /**
   * Get current results count
   */
  public getResultsCount(): number {
    return this.results.length;
  }
}

// Export singleton instance
export const reportGenerator = new ReportGenerator();
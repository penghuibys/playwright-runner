#!/usr/bin/env node

/**
 * Test script to demonstrate HTML report generation
 */

import { executeTask } from './src/runner';
import { TaskParams } from './src/types';

async function testHTMLReportGeneration() {
  console.log('🚀 Testing HTML Report Generation...\n');

  // Test successful task
  const successTaskParams: TaskParams = {
    browser: 'chromium',
    steps: [
      { action: 'goto', url: 'https://example.com' },
      { action: 'waitForSelector', selector: 'h1' },
      { action: 'screenshot', path: 'example-screenshot.png' }
    ],
    timeout: 30000
  };

  try {
    console.log('📋 Executing successful task...');
    const successResult = await executeTask('test-success-001', successTaskParams);
    console.log('✅ Success task completed:', {
      status: successResult.status,
      duration: `${(successResult.duration / 1000).toFixed(2)}s`,
      stepsExecuted: successResult.stepsExecuted,
      reportPath: successResult.reportPath
    });
  } catch (error) {
    console.error('❌ Success task failed:', (error as Error).message);
  }

  // Test failed task
  const failTaskParams: TaskParams = {
    browser: 'chromium',
    steps: [
      { action: 'goto', url: 'https://invalid-url-that-does-not-exist.com' },
      { action: 'waitForSelector', selector: 'h1' },
    ],
    timeout: 5000
  };

  try {
    console.log('\n📋 Executing failed task...');
    const failResult = await executeTask('test-fail-001', failTaskParams);
    console.log('⚠️ Fail task result:', {
      status: failResult.status,
      duration: `${(failResult.duration / 1000).toFixed(2)}s`,
      error: failResult.error,
      reportPath: failResult.reportPath
    });
  } catch (error) {
    console.error('❌ Fail task execution error:', (error as Error).message);
  }

  console.log('\n🎉 HTML Report Generation Test Complete!');
  console.log('📄 Check the "playwright-report" directory for generated HTML reports.');
}

// Run the test
testHTMLReportGeneration().catch(console.error);
#!/usr/bin/env node

/**
 * Utility script to open the latest HTML report
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const REPORT_DIR = path.join(__dirname, '..', 'playwright-report');
const REPORT_FILE = path.join(REPORT_DIR, 'index.html');

function openReport() {
  // Check if report exists
  if (!fs.existsSync(REPORT_FILE)) {
    console.log('❌ No HTML report found!');
    console.log('💡 Run "npm run test:report" to generate a report first.');
    process.exit(1);
  }

  // Get report stats
  const stats = fs.statSync(REPORT_FILE);
  const reportSize = (stats.size / 1024).toFixed(1);
  const lastModified = stats.mtime.toLocaleString();

  console.log('📄 Opening HTML Report...');
  console.log(`📁 Location: ${REPORT_FILE}`);
  console.log(`📊 Size: ${reportSize} KB`);
  console.log(`🕒 Last Modified: ${lastModified}`);

  // Determine the appropriate command based on platform
  let openCommand;
  switch (process.platform) {
    case 'darwin':
      openCommand = 'open';
      break;
    case 'win32':
      openCommand = 'start';
      break;
    default:
      openCommand = 'xdg-open';
  }

  // Open the report
  exec(`${openCommand} "${REPORT_FILE}"`, (error) => {
    if (error) {
      console.error('❌ Failed to open report:', error.message);
      console.log('💡 You can manually open:', REPORT_FILE);
    } else {
      console.log('✅ Report opened in your default browser!');
    }
  });
}

openReport();

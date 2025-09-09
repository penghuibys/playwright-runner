import path from 'path';

/**
 * Report configuration interface
 */
export interface ReportConfig {
  enabled: boolean;
  outputDir: string;
  reportName: string;
  open: boolean;
  host?: string;
  port?: number;
}

/**
 * Default report configuration
 */
export const REPORT_CONFIG: ReportConfig = {
  enabled: process.env.REPORT_ENABLED === 'true' || true, // Default to enabled
  outputDir: process.env.REPORT_OUTPUT_DIR || path.join(process.cwd(), 'playwright-report'),
  reportName: process.env.REPORT_NAME || 'index.html',
  open: process.env.REPORT_OPEN === 'true' || false,
  host: process.env.REPORT_HOST || 'localhost',
  port: parseInt(process.env.REPORT_PORT || '9323', 10),
};

export default REPORT_CONFIG;

import logger from './logger';
import { createWorker } from './queue/consumer';
import { startHealthServer } from './health/server';
import { registerShutdownHooks } from './utils/shutdown';
import CONFIG from './config';

/**
 * Application main function
 */
const main = async () => {
  logger.info(`Starting Playwright Runner (${CONFIG.env} environment)`);

  try {
    // Start health check server
    await startHealthServer();

    // Create and start task worker
    const worker = createWorker();

    // Register graceful shutdown hooks
    registerShutdownHooks(worker);

    logger.info('Playwright Runner started successfully');
  } catch (error) {
    logger.error('Failed to start Playwright Runner', { error: (error as Error).message });
    process.exit(1);
  }
};

// Start the application
main();

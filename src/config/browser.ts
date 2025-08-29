export interface BrowserConfig {
  headless: boolean;
  defaultViewport: {
    width: number;
    height: number;
  };
  args: string[];
  timeout: number;
}

export const BROWSER_CONFIG: BrowserConfig = {
  headless: process.env.BROWSER_HEADLESS !== 'false',
  defaultViewport: {
    width: 1280,
    height: 720,
  },
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-setuid-sandbox',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
  ],
  timeout: 30000, // Default step timeout 30 seconds
};

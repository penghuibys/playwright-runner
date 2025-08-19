export interface BrowserConfig {
  headless: boolean;
  defaultViewport: {
    width: number;
    height: number;
  };
  args: string[];
  timeout: number;
}

// export const BROWSER_CONFIG: BrowserConfig = {
//   headless: process.env.BROWSER_HEADLESS !== 'false',
//   defaultViewport: {
//     width: 1280,
//     height: 720,
//   },
//   args: [
//     '--no-sandbox',
//     '--disable-dev-shm-usage',
//     '--disable-gpu',
//     '--disable-setuid-sandbox',
//     '--disable-accelerated-2d-canvas',
//     '--no-first-run',
//     '--no-zygote',
//   ],
//   timeout: 30000, // 默认步骤超时时间30秒
// };

/**
 * 浏览器配置
 * 与BrowserConfig接口保持一致，包含slowMo属性
 */
export const BROWSER_CONFIG = {
  // 是否以无头模式运行浏览器
  headless: process.env.BROWSER_HEADLESS !== 'false',
  
  // 浏览器操作超时时间（毫秒）
  timeout: parseInt(process.env.BROWSER_TIMEOUT || '30000', 10),
  
  // 操作之间的延迟（毫秒），用于调试
  slowMo: process.env.BROWSER_SLOWMO ? parseInt(process.env.BROWSER_SLOWMO, 10) : 0,
  
  // 可选：指定浏览器可执行文件路径
  executablePath: process.env.BROWSER_PATH,
  
  // 浏览器启动参数
  args: process.env.BROWSER_ARGS 
    ? process.env.BROWSER_ARGS.split(',').map(arg => arg.trim())
    : []
};

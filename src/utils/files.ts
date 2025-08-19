// 明确导出所有工具函数
export const ensureDirectoryExists = async (directoryPath: string): Promise<void> => {
  const fs = await import('fs').then(m => m.promises);
  try {
    await fs.mkdir(directoryPath, { recursive: true });
  } catch (error) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw new Error(`Failed to create directory: ${error.message}`);
    }
  }
};

export const resolvePath = (basePath: string, ...relativePaths: string[]): string => {
  const path = require('path');
  return path.resolve(basePath, ...relativePaths);
};

export const fileExists = async (filePath: string): Promise<boolean> => {
  const fs = await import('fs').then(m => m.promises);
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

// 添加默认导出以兼容不同导入方式
export default {
  ensureDirectoryExists,
  resolvePath,
  fileExists
};

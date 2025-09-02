import { randomBytes } from 'crypto';
import { extname, basename, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

/**
 * Ensure target directory exists
 * @param dirPath Directory path to create
 */
const ensureDirectoryExists = (dirPath: string): void => {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Generate a unique filename with random characters
 * @param originalName Optional original filename
 * @param extension Optional file extension (default: .png)
 * @returns Unique filename with timestamp and random characters
 */
export const generateUniqueFilename = (originalName?: string, extension: string = '.png'): string => {
  // Generate timestamp (YYYYMMDD-HHMMSS format)
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '-')
    .split('.')[0]; // Remove milliseconds and timezone

  // Generate random characters (8 characters)
  const randomStr = randomBytes(4).toString('hex');

  // Extract base name if original name is provided
  let baseName = 'screenshot';
  if (originalName) {
    const nameWithoutExt = basename(originalName, extname(originalName));
    if (nameWithoutExt) {
      baseName = nameWithoutExt;
    }
  }

  // Ensure extension starts with dot
  const ext = extension.startsWith('.') ? extension : `.${extension}`;

  return `${baseName}-${timestamp}-${randomStr}${ext}`;
};

/**
 * Check if a filename appears to be a fixed/static name that should be made unique
 * @param filename The filename to check
 * @returns True if the filename should be made unique
 */
export const shouldMakeUnique = (filename?: string): boolean => {
  if (!filename) return true;
  
  // List of common fixed names that should be made unique
  const fixedNames = [
    'screenshot.png',
    'example-screenshot.png', 
    'test-screenshot.png',
    'my-screenshot.png',
    'test.png',
    'image.png',
    'capture.png'
  ];
  
  const baseName = basename(filename).toLowerCase();
  return fixedNames.includes(baseName);
};

/**
 * Generate a unique screenshot path in target directory
 * @param originalPath Optional original path
 * @returns Unique screenshot path in target/ directory
 */
export const generateScreenshotPath = (originalPath?: string): string => {
  // Ensure target directory exists
  const targetDir = 'target';
  ensureDirectoryExists(targetDir);
  
  let filename: string;
  
  if (!originalPath || shouldMakeUnique(originalPath)) {
    // Generate completely new unique filename
    const extension = originalPath ? extname(originalPath) || '.png' : '.png';
    const baseName = originalPath ? basename(originalPath, extname(originalPath)) : 'screenshot';
    filename = generateUniqueFilename(baseName, extension);
  } else {
    // Use original filename but still place in target directory
    filename = basename(originalPath);
  }
  
  return join(targetDir, filename);
};
import { randomBytes } from 'crypto';
import { extname, basename } from 'path';

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
    'test.png',
    'image.png',
    'capture.png'
  ];
  
  const baseName = basename(filename).toLowerCase();
  return fixedNames.includes(baseName);
};

/**
 * Generate a unique screenshot path
 * @param originalPath Optional original path
 * @returns Unique screenshot path
 */
export const generateScreenshotPath = (originalPath?: string): string => {
  if (!originalPath || shouldMakeUnique(originalPath)) {
    // Generate completely new unique filename
    const extension = originalPath ? extname(originalPath) || '.png' : '.png';
    const baseName = originalPath ? basename(originalPath, extname(originalPath)) : 'screenshot';
    return generateUniqueFilename(baseName, extension);
  }
  
  // Use original path as-is if it doesn't appear to be a fixed name
  return originalPath;
};
import { createAppError } from './error-handler';

/**
 * 文件验证工具
 * 提供文件格式、大小等验证功能
 */

// 支持的图片格式
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
];

// 最大文件大小 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 最小文件大小 (1KB)
const MIN_FILE_SIZE = 1024;

/**
 * 验证文件类型
 */
export function validateFileType(file: File): { isValid: boolean; error?: any } {
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: createAppError(
        'INVALID_FILE_FORMAT',
        `不支持的文件格式: ${file.type}。支持的格式: ${SUPPORTED_IMAGE_TYPES.join(', ')}`
      ),
    };
  }
  return { isValid: true };
}

/**
 * 验证文件大小
 */
export function validateFileSize(file: File): { isValid: boolean; error?: any } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: createAppError(
        'FILE_TOO_LARGE',
        `文件过大: ${(file.size / (1024 * 1024)).toFixed(2)}MB。最大允许: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      ),
    };
  }
  
  if (file.size < MIN_FILE_SIZE) {
    return {
      isValid: false,
      error: createAppError(
        'INVALID_FILE_FORMAT',
        `文件过小: ${file.size}字节。最小要求: ${MIN_FILE_SIZE}字节`
      ),
    };
  }
  
  return { isValid: true };
}

/**
 * 验证文件名
 */
export function validateFileName(file: File): { isValid: boolean; error?: any } {
  // 检查文件名长度
  if (file.name.length > 255) {
    return {
      isValid: false,
      error: createAppError(
        'INVALID_FILE_FORMAT',
        '文件名过长，请使用较短的文件名'
      ),
    };
  }
  
  // 检查非法字符
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(file.name)) {
    return {
      isValid: false,
      error: createAppError(
        'INVALID_FILE_FORMAT',
        '文件名包含非法字符，请重命名文件'
      ),
    };
  }
  
  return { isValid: true };
}

/**
 * 综合文件验证
 */
export function validateFile(file: File): { isValid: boolean; errors: any[] } {
  const errors: any[] = [];
  
  // 验证文件类型
  const typeValidation = validateFileType(file);
  if (!typeValidation.isValid && typeValidation.error) {
    errors.push(typeValidation.error);
  }
  
  // 验证文件大小
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.isValid && sizeValidation.error) {
    errors.push(sizeValidation.error);
  }
  
  // 验证文件名
  const nameValidation = validateFileName(file);
  if (!nameValidation.isValid && nameValidation.error) {
    errors.push(nameValidation.error);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 批量验证文件
 */
export function validateFiles(files: File[]): {
  validFiles: File[];
  invalidFiles: Array<{ file: File; errors: any[] }>;
  totalErrors: any[];
} {
  const validFiles: File[] = [];
  const invalidFiles: Array<{ file: File; errors: any[] }> = [];
  const totalErrors: any[] = [];
  
  files.forEach(file => {
    const validation = validateFile(file);
    if (validation.isValid) {
      validFiles.push(file);
    } else {
      invalidFiles.push({ file, errors: validation.errors });
      totalErrors.push(...validation.errors);
    }
  });
  
  return {
    validFiles,
    invalidFiles,
    totalErrors,
  };
}

/**
 * 检查文件是否可读
 */
export async function checkFileReadability(file: File): Promise<{ isReadable: boolean; error?: any }> {
  try {
    // 尝试读取文件的前几个字节
    const slice = file.slice(0, 1024);
    await slice.arrayBuffer();
    return { isReadable: true };
  } catch (error) {
    return {
      isReadable: false,
      error: createAppError(
        'FILE_READ_ERROR',
        `无法读取文件 ${file.name}: ${error instanceof Error ? error.message : '未知错误'}`
      ),
    };
  }
}

/**
 * 检查是否为图片文件（通过文件头）
 */
export async function checkImageFileHeader(file: File): Promise<{ isImage: boolean; error?: any }> {
  try {
    const buffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // 检查常见图片格式的文件头
    const signatures = {
      jpeg: [0xFF, 0xD8, 0xFF],
      png: [0x89, 0x50, 0x4E, 0x47],
      gif: [0x47, 0x49, 0x46],
      bmp: [0x42, 0x4D],
      webp: [0x52, 0x49, 0x46, 0x46], // RIFF
      tiff: [0x49, 0x49, 0x2A, 0x00], // II*\0 (little endian)
    };
    
    for (const [, signature] of Object.entries(signatures)) {
      if (signature.every((byte, index) => bytes[index] === byte)) {
        return { isImage: true };
      }
    }
    
    // 特殊检查TIFF大端格式
    if (bytes[0] === 0x4D && bytes[1] === 0x4D && bytes[2] === 0x00 && bytes[3] === 0x2A) {
      return { isImage: true };
    }
    
    return {
      isImage: false,
      error: createAppError(
        'INVALID_FILE_FORMAT',
        `文件 ${file.name} 不是有效的图片文件`
      ),
    };
  } catch (error) {
    return {
      isImage: false,
      error: createAppError(
        'FILE_READ_ERROR',
        `无法验证文件 ${file.name} 的格式: ${error instanceof Error ? error.message : '未知错误'}`
      ),
    };
  }
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot === -1 ? '' : fileName.slice(lastDot + 1).toLowerCase();
}

/**
 * 生成安全的文件名
 */
export function generateSafeFileName(originalName: string, suffix?: string): string {
  const extension = getFileExtension(originalName);
  const baseName = originalName.slice(0, originalName.lastIndexOf('.'));
  
  // 移除非法字符
  const safeName = baseName.replace(/[<>:"/\\|?*]/g, '_');
  
  // 添加后缀
  const finalName = suffix ? `${safeName}_${suffix}` : safeName;
  
  return extension ? `${finalName}.${extension}` : finalName;
}
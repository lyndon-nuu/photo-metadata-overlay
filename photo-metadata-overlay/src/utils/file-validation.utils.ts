import { SUPPORTED_IMAGE_FORMATS, SUPPORTED_FILE_EXTENSIONS } from '../constants/design-tokens';
import { FileError, ErrorCode } from '../types';

/**
 * 文件验证结果
 */
export interface FileValidationResult {
  isValid: boolean;
  errors: FileError[];
  warnings: string[];
}

/**
 * 文件验证选项
 */
export interface FileValidationOptions {
  maxFileSize?: number; // 最大文件大小（字节）
  minFileSize?: number; // 最小文件大小（字节）
  allowedExtensions?: string[]; // 允许的文件扩展名
  allowedMimeTypes?: string[]; // 允许的MIME类型
  checkImageDimensions?: boolean; // 是否检查图片尺寸
  minWidth?: number; // 最小宽度
  minHeight?: number; // 最小高度
  maxWidth?: number; // 最大宽度
  maxHeight?: number; // 最大高度
}

/**
 * 默认验证选项
 */
const DEFAULT_VALIDATION_OPTIONS: Required<FileValidationOptions> = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  minFileSize: 1024, // 1KB
  allowedExtensions: SUPPORTED_FILE_EXTENSIONS,
  allowedMimeTypes: SUPPORTED_IMAGE_FORMATS,
  checkImageDimensions: false,
  minWidth: 1,
  minHeight: 1,
  maxWidth: 10000,
  maxHeight: 10000,
};

/**
 * 验证单个文件
 * @param file 要验证的文件
 * @param options 验证选项
 * @returns Promise<FileValidationResult> 验证结果
 */
export async function validateFile(
  file: File,
  options: FileValidationOptions = {}
): Promise<FileValidationResult> {
  const opts = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
  const errors: FileError[] = [];
  const warnings: string[] = [];

  // 检查文件大小
  if (file.size > opts.maxFileSize) {
    errors.push(createFileError(
      'FILE_READ_ERROR',
      `文件过大: ${formatFileSize(file.size)} > ${formatFileSize(opts.maxFileSize)}`,
      file
    ));
  }

  if (file.size < opts.minFileSize) {
    errors.push(createFileError(
      'FILE_READ_ERROR',
      `文件过小: ${formatFileSize(file.size)} < ${formatFileSize(opts.minFileSize)}`,
      file
    ));
  }

  // 检查文件扩展名
  const extension = getFileExtension(file.name);
  if (!opts.allowedExtensions.includes(extension)) {
    errors.push(createFileError(
      'UNSUPPORTED_FORMAT',
      `不支持的文件扩展名: ${extension}`,
      file
    ));
  }

  // 检查MIME类型
  if (!opts.allowedMimeTypes.includes(file.type)) {
    errors.push(createFileError(
      'UNSUPPORTED_FORMAT',
      `不支持的文件类型: ${file.type}`,
      file
    ));
  }

  // 检查文件名安全性
  if (!isValidFileName(file.name)) {
    errors.push(createFileError(
      'INVALID_FILE_FORMAT',
      `文件名包含不安全字符: ${file.name}`,
      file
    ));
  }

  // 检查图片尺寸（如果启用）
  if (opts.checkImageDimensions && errors.length === 0) {
    try {
      const dimensions = await getImageDimensions(file);
      
      if (dimensions.width < opts.minWidth || dimensions.height < opts.minHeight) {
        errors.push(createFileError(
          'INVALID_FILE_FORMAT',
          `图片尺寸过小: ${dimensions.width}×${dimensions.height} < ${opts.minWidth}×${opts.minHeight}`,
          file
        ));
      }

      if (dimensions.width > opts.maxWidth || dimensions.height > opts.maxHeight) {
        errors.push(createFileError(
          'INVALID_FILE_FORMAT',
          `图片尺寸过大: ${dimensions.width}×${dimensions.height} > ${opts.maxWidth}×${opts.maxHeight}`,
          file
        ));
      }

      // 添加尺寸警告
      if (dimensions.width > 4000 || dimensions.height > 4000) {
        warnings.push(`高分辨率图片可能处理较慢: ${dimensions.width}×${dimensions.height}`);
      }
    } catch (error) {
      errors.push(createFileError(
        'IMAGE_PROCESSING_ERROR',
        `无法读取图片尺寸: ${error instanceof Error ? error.message : '未知错误'}`,
        file
      ));
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 批量验证文件
 * @param files 要验证的文件列表
 * @param options 验证选项
 * @returns Promise<{ valid: File[], invalid: File[], errors: FileError[], warnings: string[] }> 验证结果
 */
export async function validateFiles(
  files: File[],
  options: FileValidationOptions = {}
): Promise<{
  valid: File[];
  invalid: File[];
  errors: FileError[];
  warnings: string[];
}> {
  const valid: File[] = [];
  const invalid: File[] = [];
  const allErrors: FileError[] = [];
  const allWarnings: string[] = [];

  for (const file of files) {
    const result = await validateFile(file, options);
    
    if (result.isValid) {
      valid.push(file);
    } else {
      invalid.push(file);
    }
    
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  return {
    valid,
    invalid,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * 检查文件是否为图片
 * @param file 文件对象
 * @returns boolean 是否为图片
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') && SUPPORTED_IMAGE_FORMATS.includes(
    file.type as (typeof SUPPORTED_IMAGE_FORMATS)[number]
  );
}

/**
 * 检查文件名是否安全
 * @param fileName 文件名
 * @returns boolean 是否安全
 */
export function isValidFileName(fileName: string): boolean {
  // 检查文件名长度
  if (fileName.length === 0 || fileName.length > 255) {
    return false;
  }

  // 检查危险字符
  const dangerousChars = /[<>:"|?*\x00-\x1f]/;
  if (dangerousChars.test(fileName)) {
    return false;
  }

  // 检查Windows保留名称
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
  if (reservedNames.test(fileName)) {
    return false;
  }

  // 检查是否以点或空格结尾
  if (fileName.endsWith('.') || fileName.endsWith(' ')) {
    return false;
  }

  return true;
}

/**
 * 获取文件扩展名
 * @param fileName 文件名
 * @returns string 扩展名（小写，包含点）
 */
function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot !== -1 ? fileName.substring(lastDot).toLowerCase() : '';
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns string 格式化后的大小
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 获取图片尺寸
 * @param file 图片文件
 * @returns Promise<{width: number, height: number}> 图片尺寸
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * 创建文件错误对象
 * @param code 错误代码
 * @param message 错误消息
 * @param file 文件对象
 * @returns FileError 文件错误
 */
function createFileError(code: ErrorCode, message: string, file: File): FileError {
  return {
    code,
    message,
    timestamp: new Date(),
    severity: getSeverityForErrorCode(code),
    fileName: file.name,
    filePath: file.name,
    fileSize: file.size,
  };
}

/**
 * 根据错误代码获取严重程度
 * @param code 错误代码
 * @returns 严重程度
 */
function getSeverityForErrorCode(code: ErrorCode): FileError['severity'] {
  switch (code) {
    case 'MEMORY_ERROR':
    case 'CANVAS_ERROR':
      return 'critical';
    case 'FILE_NOT_FOUND':
    case 'ACCESS_DENIED':
    case 'EXPORT_ERROR':
      return 'high';
    case 'EXIF_READ_ERROR':
    case 'IMAGE_PROCESSING_ERROR':
    case 'TIMEOUT_ERROR':
      return 'medium';
    case 'FONT_LOAD_ERROR':
    case 'LOGO_LOAD_ERROR':
    case 'UNSUPPORTED_FORMAT':
    case 'INVALID_FILE_FORMAT':
    case 'FILE_READ_ERROR':
      return 'low';
    default:
      return 'medium';
  }
}

/**
 * 检查文件是否可能损坏
 * @param file 文件对象
 * @returns Promise<boolean> 是否可能损坏
 */
export async function isFileCorrupted(file: File): Promise<boolean> {
  try {
    // 尝试读取文件头部
    const header = file.slice(0, 512);
    const buffer = await header.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // 检查常见图片格式的文件头
    if (file.type === 'image/jpeg') {
      // JPEG文件应该以 FF D8 开头
      return !(bytes[0] === 0xFF && bytes[1] === 0xD8);
    }

    if (file.type === 'image/png') {
      // PNG文件应该以 89 50 4E 47 开头
      return !(bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47);
    }

    // 对于其他格式，暂时返回false
    return false;
  } catch (error) {
    // 如果无法读取文件，认为可能损坏
    return true;
  }
}

/**
 * 获取文件的详细信息
 * @param file 文件对象
 * @returns Promise<FileInfo> 文件信息
 */
export async function getFileInfo(file: File): Promise<{
  name: string;
  size: number;
  type: string;
  lastModified: Date;
  extension: string;
  isImage: boolean;
  dimensions?: { width: number; height: number };
  isCorrupted: boolean;
}> {
  const extension = getFileExtension(file.name);
  const isImage = isImageFile(file);
  const isCorrupted = await isFileCorrupted(file);
  
  let dimensions: { width: number; height: number } | undefined;
  
  if (isImage && !isCorrupted) {
    try {
      dimensions = await getImageDimensions(file);
    } catch (error) {
      // 如果无法获取尺寸，不设置dimensions
    }
  }

  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified),
    extension,
    isImage,
    dimensions,
    isCorrupted,
  };
}
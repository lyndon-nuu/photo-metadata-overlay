import { PhotoMetadata } from '../types';
import { exifService } from '../services/exif.service';
import { SUPPORTED_IMAGE_FORMATS } from '../constants/design-tokens';

/**
 * 文件处理工具函数
 */

/**
 * 从File对象创建PhotoMetadata
 * @param file 文件对象
 * @returns Promise<PhotoMetadata> 照片元数据
 */
export async function createPhotoMetadata(file: File): Promise<PhotoMetadata> {
  // 基础文件信息
  const photoMetadata: PhotoMetadata = {
    fileName: file.name,
    filePath: file.name, // 在浏览器环境中，我们只能获取文件名
    fileSize: file.size,
    dimensions: { width: 0, height: 0 },
    createdAt: new Date(file.lastModified),
    modifiedAt: new Date(file.lastModified),
    mimeType: file.type,
  };

  try {
    // 获取图像尺寸
    const dimensions = await getImageDimensions(file);
    photoMetadata.dimensions = dimensions;

    // 提取EXIF数据
    if (exifService.isSupported(file.type)) {
      const exifData = await exifService.extractMetadata(file);
      photoMetadata.exif = exifData;
    }

    // 生成文件哈希（用于重复检测）
    const hash = await generateFileHash(file);
    photoMetadata.hash = hash;
  } catch (error) {
    console.warn('Failed to extract complete metadata:', error);
    // 即使部分信息提取失败，也返回基础信息
  }

  return photoMetadata;
}

/**
 * 获取图像尺寸
 * @param file 图像文件
 * @returns Promise<{width: number, height: number}> 图像尺寸
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
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
 * 生成文件哈希值（用于重复检测）
 * @param file 文件对象
 * @returns Promise<string> 文件哈希值
 */
export async function generateFileHash(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return hashHex;
  } catch (error) {
    console.warn('Failed to generate file hash:', error);
    // 如果哈希生成失败，使用文件名和大小作为简单标识
    return `${file.name}_${file.size}_${file.lastModified}`;
  }
}

/**
 * 验证文件是否为支持的图像格式
 * @param file 文件对象
 * @returns boolean 是否支持
 */
export function isValidImageFile(file: File): boolean {
  return SUPPORTED_IMAGE_FORMATS.includes(
    file.type as (typeof SUPPORTED_IMAGE_FORMATS)[number]
  );
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns string 格式化的文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 获取文件扩展名
 * @param fileName 文件名
 * @returns string 文件扩展名
 */
export function getFileExtension(fileName: string): string {
  return fileName.slice(((fileName.lastIndexOf('.') - 1) >>> 0) + 2);
}

/**
 * 批量处理文件，创建PhotoMetadata数组
 * @param files 文件数组
 * @param onProgress 进度回调函数
 * @returns Promise<PhotoMetadata[]> 照片元数据数组
 */
export async function processFiles(
  files: File[],
  onProgress?: (progress: number, current: number, total: number) => void
): Promise<PhotoMetadata[]> {
  const results: PhotoMetadata[] = [];
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      // 只处理支持的图像文件
      if (isValidImageFile(file)) {
        const metadata = await createPhotoMetadata(file);
        results.push(metadata);
      } else {
        console.warn(`Skipping unsupported file: ${file.name}`);
      }
    } catch (error) {
      console.error(`Failed to process file ${file.name}:`, error);
      // 继续处理其他文件
    }

    // 更新进度
    if (onProgress) {
      const progress = ((i + 1) / total) * 100;
      onProgress(progress, i + 1, total);
    }
  }

  return results;
}

/**
 * 检查是否为重复文件
 * @param newFile 新文件的元数据
 * @param existingFiles 已存在的文件元数据数组
 * @returns PhotoMetadata | null 如果是重复文件，返回重复的文件元数据，否则返回null
 */
export function findDuplicateFile(
  newFile: PhotoMetadata,
  existingFiles: PhotoMetadata[]
): PhotoMetadata | null {
  return (
    existingFiles.find(
      existing =>
        existing.hash === newFile.hash ||
        (existing.fileName === newFile.fileName &&
          existing.fileSize === newFile.fileSize)
    ) || null
  );
}

/**
 * 过滤重复文件
 * @param files 文件元数据数组
 * @returns PhotoMetadata[] 去重后的文件数组
 */
export function removeDuplicateFiles(files: PhotoMetadata[]): PhotoMetadata[] {
  const seen = new Set<string>();
  return files.filter(file => {
    const key = file.hash || `${file.fileName}_${file.fileSize}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

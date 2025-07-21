import { PhotoMetadata, FileError } from '../types';
import { exifService } from '../services/exif.service';
import { createAppError } from './data-models.utils';

/**
 * 将File对象转换为PhotoMetadata
 * @param file 文件对象
 * @returns Promise<PhotoMetadata> 照片元数据
 */
export async function fileToPhotoMetadata(file: File): Promise<PhotoMetadata> {
  try {
    // 验证文件
    if (!exifService.validateImageFile(file)) {
      throw createAppError('INVALID_FILE_FORMAT', `Invalid image file: ${file.name}`, undefined, file.name);
    }

    // 获取图片尺寸
    const dimensions = await getImageDimensions(file);
    
    // 提取EXIF数据
    const exif = await exifService.extractMetadata(file);
    
    // 生成文件哈希（用于重复检测）
    const hash = await generateFileHash(file);

    const photoMetadata: PhotoMetadata = {
      fileName: file.name,
      filePath: file.name, // 在浏览器环境中，我们只能获取文件名
      fileSize: file.size,
      dimensions,
      exif,
      createdAt: new Date(file.lastModified),
      modifiedAt: new Date(file.lastModified),
      mimeType: file.type,
      hash,
    };

    return photoMetadata;
  } catch (error) {
    console.error('Error converting file to PhotoMetadata:', error);
    throw error instanceof Error ? error : createAppError('UNKNOWN_ERROR', 'Failed to process file', undefined, file.name);
  }
}

/**
 * 批量处理文件转换为PhotoMetadata
 * @param files 文件数组
 * @param onProgress 进度回调
 * @returns Promise<{ success: PhotoMetadata[], errors: FileError[] }> 处理结果
 */
export async function batchFileToPhotoMetadata(
  files: File[],
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<{ success: PhotoMetadata[], errors: FileError[] }> {
  const success: PhotoMetadata[] = [];
  const errors: FileError[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      onProgress?.(i + 1, files.length, file.name);
      
      const metadata = await fileToPhotoMetadata(file);
      success.push(metadata);
    } catch (error) {
      const fileError: FileError = {
        code: error instanceof Error && 'code' in error ? (error as any).code : 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        severity: 'medium',
        fileName: file.name,
        filePath: file.name,
        fileSize: file.size,
      };
      errors.push(fileError);
    }
  }

  return { success, errors };
}

/**
 * 获取图片尺寸
 * @param file 图片文件
 * @returns Promise<{width: number, height: number}> 图片尺寸
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
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
      reject(createAppError('IMAGE_PROCESSING_ERROR', 'Failed to load image dimensions', undefined, file.name));
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
    // 读取文件的前1KB用于生成简单哈希
    const chunk = file.slice(0, 1024);
    const buffer = await chunk.arrayBuffer();
    
    // 使用Web Crypto API生成SHA-256哈希
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // 结合文件大小和修改时间创建更唯一的标识
    return `${hashHex}-${file.size}-${file.lastModified}`;
  } catch (error) {
    // 如果哈希生成失败，使用文件信息作为备用标识
    return `${file.name}-${file.size}-${file.lastModified}`;
  }
}

/**
 * 检查文件是否重复
 * @param newFiles 新文件列表
 * @param existingFiles 已存在的文件列表
 * @returns { duplicates: PhotoMetadata[], unique: File[] } 重复和唯一文件
 */
export async function checkDuplicateFiles(
  newFiles: File[],
  existingFiles: PhotoMetadata[]
): Promise<{ duplicates: PhotoMetadata[], unique: File[] }> {
  const duplicates: PhotoMetadata[] = [];
  const unique: File[] = [];
  const existingHashes = new Set(existingFiles.map(f => f.hash).filter(Boolean));

  for (const file of newFiles) {
    try {
      const hash = await generateFileHash(file);
      
      if (existingHashes.has(hash)) {
        // 找到重复文件
        const duplicate = existingFiles.find(f => f.hash === hash);
        if (duplicate) {
          duplicates.push(duplicate);
        }
      } else {
        unique.push(file);
      }
    } catch (error) {
      // 如果哈希生成失败，假设文件是唯一的
      unique.push(file);
    }
  }

  return { duplicates, unique };
}

/**
 * 过滤支持的图片文件
 * @param files 文件列表
 * @returns { supported: File[], unsupported: File[] } 支持和不支持的文件
 */
export function filterSupportedFiles(files: File[]): { supported: File[], unsupported: File[] } {
  const supported: File[] = [];
  const unsupported: File[] = [];

  files.forEach(file => {
    if (exifService.isSupported(file.type) && exifService.validateImageFile(file)) {
      supported.push(file);
    } else {
      unsupported.push(file);
    }
  });

  return { supported, unsupported };
}

/**
 * 从文件夹中递归获取所有图片文件
 * @param files FileList 文件列表（通常来自文件夹选择）
 * @returns File[] 过滤后的图片文件数组
 */
export function extractImageFilesFromFolder(files: FileList): File[] {
  const imageFiles: File[] = [];
  
  Array.from(files).forEach(file => {
    if (exifService.isSupported(file.type)) {
      imageFiles.push(file);
    }
  });

  return imageFiles;
}

/**
 * 处理拖拽文件，支持文件夹和文件混合
 * @param dataTransfer DataTransfer对象
 * @returns Promise<File[]> 处理后的文件列表
 */
export async function processDroppedFiles(dataTransfer: DataTransfer): Promise<File[]> {
  const files: File[] = [];
  const items = Array.from(dataTransfer.items);
  
  // 检查是否有文件夹项目
  const hasDirectories = items.some(item => 
    item.kind === 'file' && item.webkitGetAsEntry?.()?.isDirectory
  );
  
  if (hasDirectories) {
    // 处理文件夹结构
    for (const item of items) {
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          const entryFiles = await processEntry(entry);
          files.push(...entryFiles);
        }
      }
    }
  } else {
    // 处理普通文件
    files.push(...Array.from(dataTransfer.files));
  }
  
  return files;
}

/**
 * 递归处理文件系统条目
 * @param entry FileSystemEntry
 * @returns Promise<File[]> 文件列表
 */
async function processEntry(entry: FileSystemEntry): Promise<File[]> {
  const files: File[] = [];
  
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) => {
      (entry as FileSystemFileEntry).file(resolve, reject);
    });
    
    // 只添加支持的图片文件
    if (exifService.isSupported(file.type)) {
      files.push(file);
    }
  } else if (entry.isDirectory) {
    const dirReader = (entry as FileSystemDirectoryEntry).createReader();
    const entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
      dirReader.readEntries(resolve, reject);
    });
    
    // 递归处理子目录
    for (const childEntry of entries) {
      const childFiles = await processEntry(childEntry);
      files.push(...childFiles);
    }
  }
  
  return files;
}

/**
 * 格式化文件大小显示
 * @param bytes 字节数
 * @returns string 格式化后的文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 获取文件扩展名
 * @param fileName 文件名
 * @returns string 文件扩展名（小写）
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot !== -1 ? fileName.substring(lastDot).toLowerCase() : '';
}

/**
 * 生成唯一的文件名（避免重名）
 * @param originalName 原始文件名
 * @param existingNames 已存在的文件名列表
 * @returns string 唯一的文件名
 */
export function generateUniqueFileName(originalName: string, existingNames: string[]): string {
  if (!existingNames.includes(originalName)) {
    return originalName;
  }

  const extension = getFileExtension(originalName);
  const baseName = originalName.substring(0, originalName.length - extension.length);
  
  let counter = 1;
  let newName: string;
  
  do {
    newName = `${baseName} (${counter})${extension}`;
    counter++;
  } while (existingNames.includes(newName));
  
  return newName;
}

/**
 * 验证文件路径是否安全
 * @param filePath 文件路径
 * @returns boolean 是否安全
 */
export function isValidFilePath(filePath: string): boolean {
  // 检查路径是否包含危险字符
  const dangerousPatterns = [
    /\.\./,  // 父目录引用
    /[<>:"|?*]/,  // Windows不允许的字符
    /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i,  // Windows保留名称
  ];

  return !dangerousPatterns.some(pattern => pattern.test(filePath));
}

/**
 * 创建文件下载链接
 * @param blob 文件数据
 * @param fileName 文件名
 */
export function downloadFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // 清理URL对象
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * 读取文件为Base64字符串
 * @param file 文件对象
 * @returns Promise<string> Base64字符串
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as base64'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * 从Base64字符串创建File对象
 * @param base64 Base64字符串
 * @param fileName 文件名
 * @param mimeType MIME类型
 * @returns File 文件对象
 */
export function base64ToFile(base64: string, fileName: string, mimeType: string): File {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new File([byteArray], fileName, { type: mimeType });
}
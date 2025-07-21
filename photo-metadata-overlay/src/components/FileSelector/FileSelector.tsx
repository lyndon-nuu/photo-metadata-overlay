import React, { useCallback, useState, useRef } from 'react';
import { Upload, FolderOpen, Image, X, AlertCircle } from 'lucide-react';
import { FileDropzoneProps, FileSelectedEvent, PhotoMetadata } from '../../types';
import { isValidImageFile, isValidFileExtension } from '../../utils/data-models.utils';
import { validateFiles, FileValidationOptions } from '../../utils/file-validation.utils';
import { SUPPORTED_FILE_EXTENSIONS } from '../../constants/design-tokens';

interface FileSelectorProps extends Omit<FileDropzoneProps, 'onFilesSelected'> {
  onFilesSelected: (event: FileSelectedEvent) => void;
  onFilesProcessed?: (files: PhotoMetadata[]) => void;
  selectedFiles?: PhotoMetadata[];
  onFileRemove?: (filePath: string) => void;
  allowFolder?: boolean;
  showPreview?: boolean;
}

export const FileSelector: React.FC<FileSelectorProps> = ({
  onFilesSelected,

  selectedFiles = [],
  onFileRemove,
  accept = SUPPORTED_FILE_EXTENSIONS,
  multiple = true,
  maxSize = 100 * 1024 * 1024, // 100MB
  disabled = false,
  allowFolder = true,
  showPreview = true,
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // 处理文件验证
  const validateSelectedFiles = useCallback(async (files: File[]): Promise<{ valid: File[]; errors: string[] }> => {
    const validationOptions: FileValidationOptions = {
      maxFileSize: maxSize,
      checkImageDimensions: false, // 暂时不检查尺寸以提高性能
    };

    try {
      const result = await validateFiles(files, validationOptions);
      const errorMessages = result.errors.map(error => error.message);
      
      return {
        valid: result.valid,
        errors: errorMessages,
      };
    } catch (error) {
      console.error('Validation error:', error);
      // 回退到基本验证
      const valid: File[] = [];
      const errors: string[] = [];

      files.forEach(file => {
        // 检查文件类型
        if (!isValidImageFile(file)) {
          errors.push(`${file.name}: 不支持的文件格式`);
          return;
        }

        // 检查文件扩展名
        if (!isValidFileExtension(file.name)) {
          errors.push(`${file.name}: 文件扩展名不正确`);
          return;
        }

        // 检查文件大小
        if (maxSize && file.size > maxSize) {
          const sizeMB = Math.round(file.size / (1024 * 1024));
          const maxSizeMB = Math.round(maxSize / (1024 * 1024));
          errors.push(`${file.name}: 文件过大 (${sizeMB}MB > ${maxSizeMB}MB)`);
          return;
        }

        valid.push(file);
      });

      return { valid, errors };
    }
  }, [maxSize]);

  // 处理文件选择
  const handleFiles = useCallback(async (files: File[], source: FileSelectedEvent['source']) => {
    if (disabled) return;

    const { valid, errors } = await validateSelectedFiles(files);
    
    setErrors(errors);

    if (valid.length > 0) {
      onFilesSelected({
        files: valid,
        source,
      });
    }
  }, [disabled, validateSelectedFiles, onFilesSelected]);

  // 拖拽处理
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(false);
    }
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    try {
      // 使用新的processDroppedFiles函数处理拖拽文件，支持文件夹
      const { processDroppedFiles } = await import('../../utils/file.utils');
      const files = await processDroppedFiles(e.dataTransfer);
      handleFiles(files, 'drop');
    } catch (error) {
      console.error('Error processing dropped files:', error);
      // 回退到基本文件处理
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files, 'drop');
    }
  }, [disabled, handleFiles]);

  // 点击选择文件
  const handleFileClick = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  // 点击选择文件夹
  const handleFolderClick = useCallback(() => {
    if (disabled) return;
    folderInputRef.current?.click();
  }, [disabled]);

  // 文件输入变化
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFiles(files, 'click');
    }
    // 清空input值，允许重复选择同一文件
    e.target.value = '';
  }, [handleFiles]);

  // 粘贴处理
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (disabled) return;

    const items = Array.from(e.clipboardData.items);
    const files: File[] = [];

    items.forEach(item => {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    });

    if (files.length > 0) {
      handleFiles(files, 'paste');
    }
  }, [disabled, handleFiles]);

  // 移除文件
  const handleRemoveFile = useCallback((filePath: string) => {
    onFileRemove?.(filePath);
  }, [onFileRemove]);

  // 清除错误
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`file-selector ${className}`}>
      {/* 拖拽区域 */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onPaste={handlePaste}
        onClick={handleFileClick}
        tabIndex={0}
        role="button"
        aria-label="选择图片文件"
      >
        <div className="flex flex-col items-center space-y-4">
          <div className={`
            p-4 rounded-full transition-colors duration-200
            ${isDragOver 
              ? 'bg-blue-100 dark:bg-blue-800' 
              : 'bg-gray-100 dark:bg-gray-800'
            }
          `}>
            <Upload className={`
              w-8 h-8 transition-colors duration-200
              ${isDragOver 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400'
              }
            `} />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {isDragOver ? '释放文件以上传' : '选择图片文件'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              拖拽文件到此处，或点击选择文件
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              支持格式: {accept.join(', ')}
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleFileClick();
              }}
              disabled={disabled}
              className="
                inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600
                rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200
                bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-200
              "
            >
              <Image className="w-4 h-4 mr-2" />
              选择文件
            </button>

            {allowFolder && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFolderClick();
                }}
                disabled={disabled}
                className="
                  inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600
                  rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200
                  bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors duration-200
                "
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                选择文件夹
              </button>
            )}
          </div>
        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {/* 隐藏的文件夹输入 */}
        {allowFolder && (
          <input
            ref={folderInputRef}
            type="file"
            multiple
            // @ts-ignore - webkitdirectory is not in the standard types but is widely supported
            webkitdirectory=""
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />
        )}
      </div>

      {/* 错误信息 */}
      {errors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                文件处理错误
              </h4>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
              <button
                onClick={clearErrors}
                className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
              >
                清除错误
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 已选择文件列表 */}
      {showPreview && selectedFiles.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            已选择文件 ({selectedFiles.length})
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.filePath}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <Image className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {file.fileName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.fileSize)} • {file.dimensions.width}×{file.dimensions.height}
                    </p>
                  </div>
                </div>
                {onFileRemove && (
                  <button
                    onClick={() => handleRemoveFile(file.filePath)}
                    className="
                      p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400
                      transition-colors duration-200
                    "
                    aria-label={`移除 ${file.fileName}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileSelector;
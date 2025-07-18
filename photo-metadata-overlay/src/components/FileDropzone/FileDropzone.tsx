import React, { useCallback, useState } from 'react';
import { Upload, File, Image, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string[];
  multiple?: boolean;
  maxSize?: number; // in bytes
  disabled?: boolean;
  className?: string;
}

/**
 * 现代化文件拖拽区域组件
 * 支持拖拽和点击选择文件
 */
export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFilesSelected,
  accept = ['image/*'],
  multiple = true,
  maxSize = 50 * 1024 * 1024, // 50MB
  disabled = false,
  className,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 验证文件
  const validateFiles = useCallback((files: File[]): File[] => {
    const validFiles: File[] = [];
    let errorMessage = '';

    for (const file of files) {
      // 检查文件大小
      if (file.size > maxSize) {
        errorMessage = `文件 "${file.name}" 超过最大大小限制 (${Math.round(maxSize / 1024 / 1024)}MB)`;
        continue;
      }

      // 检查文件类型
      const isValidType = accept.some(acceptType => {
        if (acceptType === 'image/*') {
          return file.type.startsWith('image/');
        }
        return file.type === acceptType;
      });

      if (!isValidType) {
        errorMessage = `文件 "${file.name}" 不是支持的格式`;
        continue;
      }

      validFiles.push(file);
    }

    if (errorMessage) {
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } else {
      setError(null);
    }

    return validFiles;
  }, [accept, maxSize]);

  // 处理拖拽进入
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  // 处理拖拽离开
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  // 处理拖拽悬停
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // 处理文件放置
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const validFiles = validateFiles(files);
    
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  }, [disabled, validateFiles, onFilesSelected]);

  // 处理文件选择
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = validateFiles(files);
    
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }

    // 清空input值，允许重复选择同一文件
    e.target.value = '';
  }, [validateFiles, onFilesSelected]);

  // 点击区域触发文件选择
  const handleClick = useCallback(() => {
    if (disabled) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept.join(',');
    input.multiple = multiple;
    input.onchange = handleFileSelect;
    input.click();
  }, [disabled, accept, multiple, handleFileSelect]);

  return (
    <div className={cn("relative", className)}>
      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* 拖拽区域 */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
          isDragOver && !disabled
            ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "hover:bg-gray-50 dark:hover:bg-gray-800"
        )}
      >
        {/* 图标 */}
        <div className="flex justify-center mb-4">
          {isDragOver ? (
            <Upload className="w-12 h-12 text-blue-500" />
          ) : (
            <div className="flex space-x-2">
              <Image className="w-8 h-8 text-gray-400" />
              <File className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* 文本内容 */}
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {isDragOver ? '放置文件到这里' : '拖拽文件到这里'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            或者 <span className="text-blue-600 dark:text-blue-400 font-medium">点击选择文件</span>
          </p>
          <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
            <p>支持格式: {accept.join(', ')}</p>
            <p>最大大小: {Math.round(maxSize / 1024 / 1024)}MB</p>
            {multiple && <p>支持多文件选择</p>}
          </div>
        </div>

        {/* 装饰性元素 */}
        <div className="absolute inset-0 rounded-lg pointer-events-none">
          <div className={cn(
            "absolute inset-2 rounded border border-dashed opacity-20 transition-opacity",
            isDragOver ? "border-blue-400" : "border-gray-300"
          )} />
        </div>
      </div>
    </div>
  );
};

export default FileDropzone;
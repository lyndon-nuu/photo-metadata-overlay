import { useState, useCallback, useRef } from 'react';
import { PhotoMetadata, FileSelectedEvent, FileError } from '../types';
import { 
  batchFileToPhotoMetadata, 
  checkDuplicateFiles,
  filterSupportedFiles
} from '../utils/file.utils';

interface UseFileManagerOptions {
  maxFiles?: number;
  allowDuplicates?: boolean;
  onProgress?: (current: number, total: number, fileName: string) => void;
  onError?: (error: FileError) => void;
}

interface FileManagerState {
  selectedFiles: PhotoMetadata[];
  isProcessing: boolean;
  progress: {
    current: number;
    total: number;
    fileName: string;
  };
  errors: FileError[];
}

export function useFileManager(options: UseFileManagerOptions = {}) {
  const {
    maxFiles = 1000,
    allowDuplicates = false,
    onProgress,
    onError,
  } = options;

  const [state, setState] = useState<FileManagerState>({
    selectedFiles: [],
    isProcessing: false,
    progress: {
      current: 0,
      total: 0,
      fileName: '',
    },
    errors: [],
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // 更新进度
  const updateProgress = useCallback((current: number, total: number, fileName: string) => {
    setState(prev => ({
      ...prev,
      progress: { current, total, fileName },
    }));
    onProgress?.(current, total, fileName);
  }, [onProgress]);

  // 添加错误
  const addError = useCallback((error: FileError) => {
    setState(prev => ({
      ...prev,
      errors: [...prev.errors, error],
    }));
    onError?.(error);
  }, [onError]);

  // 处理文件选择
  const handleFilesSelected = useCallback(async (event: FileSelectedEvent) => {
    if (state.isProcessing) return;

    try {
      setState(prev => ({ ...prev, isProcessing: true, errors: [] }));

      let files = event.files;

      // 过滤支持的文件格式
      const { supported, unsupported } = filterSupportedFiles(files);
      
      // 记录不支持的文件
      unsupported.forEach(file => {
        addError({
          code: 'UNSUPPORTED_FORMAT',
          message: `不支持的文件格式: ${file.name}`,
          timestamp: new Date(),
          severity: 'low',
          fileName: file.name,
          filePath: file.name,
          fileSize: file.size,
        });
      });

      files = supported;

      // 检查文件数量限制
      if (state.selectedFiles.length + files.length > maxFiles) {
        const allowedCount = maxFiles - state.selectedFiles.length;
        files = files.slice(0, allowedCount);
        
        addError({
          code: 'UNKNOWN_ERROR',
          message: `文件数量超出限制，只能选择 ${maxFiles} 个文件`,
          timestamp: new Date(),
          severity: 'medium',
          fileName: '',
          filePath: '',
        });
      }

      if (files.length === 0) {
        setState(prev => ({ ...prev, isProcessing: false }));
        return;
      }

      // 检查重复文件
      let uniqueFiles = files;
      if (!allowDuplicates) {
        const { duplicates, unique } = await checkDuplicateFiles(files, state.selectedFiles);
        
        // 记录重复文件
        duplicates.forEach(duplicate => {
          addError({
            code: 'UNKNOWN_ERROR',
            message: `文件已存在: ${duplicate.fileName}`,
            timestamp: new Date(),
            severity: 'low',
            fileName: duplicate.fileName,
            filePath: duplicate.filePath,
            fileSize: duplicate.fileSize,
          });
        });

        uniqueFiles = unique;
      }

      if (uniqueFiles.length === 0) {
        setState(prev => ({ ...prev, isProcessing: false }));
        return;
      }

      // 创建AbortController用于取消操作
      abortControllerRef.current = new AbortController();

      // 批量处理文件
      const { success, errors } = await batchFileToPhotoMetadata(
        uniqueFiles,
        updateProgress
      );

      // 添加处理错误
      errors.forEach(addError);

      // 更新选中文件列表
      if (success.length > 0) {
        setState(prev => ({
          ...prev,
          selectedFiles: [...prev.selectedFiles, ...success],
        }));
      }

    } catch (error) {
      console.error('Error handling file selection:', error);
      addError({
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : '文件处理失败',
        timestamp: new Date(),
        severity: 'high',
        fileName: '',
        filePath: '',
      });
    } finally {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        progress: { current: 0, total: 0, fileName: '' },
      }));
      abortControllerRef.current = null;
    }
  }, [state.selectedFiles, state.isProcessing, maxFiles, allowDuplicates, updateProgress, addError]);

  // 移除文件
  const removeFile = useCallback((filePath: string) => {
    setState(prev => ({
      ...prev,
      selectedFiles: prev.selectedFiles.filter(file => file.filePath !== filePath),
    }));
  }, []);

  // 清空所有文件
  const clearFiles = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedFiles: [],
      errors: [],
    }));
  }, []);

  // 清空错误
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: [],
    }));
  }, []);

  // 取消处理
  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState(prev => ({
        ...prev,
        isProcessing: false,
        progress: { current: 0, total: 0, fileName: '' },
      }));
    }
  }, []);

  // 重新处理失败的文件
  const retryFailedFiles = useCallback(async () => {
    const failedFileNames = state.errors
      .filter(error => error.fileName)
      .map(error => error.fileName);

    if (failedFileNames.length === 0) return;

    // 这里需要重新获取失败的文件，但在浏览器环境中比较困难
    // 可以考虑让用户重新选择这些文件
    console.log('需要重新选择以下失败的文件:', failedFileNames);
  }, [state.errors]);

  // 获取文件统计信息
  const getFileStats = useCallback(() => {
    const totalSize = state.selectedFiles.reduce((sum, file) => sum + file.fileSize, 0);
    const fileTypes = new Map<string, number>();
    
    state.selectedFiles.forEach(file => {
      const ext = file.fileName.split('.').pop()?.toLowerCase() || 'unknown';
      fileTypes.set(ext, (fileTypes.get(ext) || 0) + 1);
    });

    return {
      totalFiles: state.selectedFiles.length,
      totalSize,
      fileTypes: Object.fromEntries(fileTypes),
      hasErrors: state.errors.length > 0,
      errorCount: state.errors.length,
    };
  }, [state.selectedFiles, state.errors]);

  // 导出文件列表
  const exportFileList = useCallback(() => {
    const fileList = state.selectedFiles.map(file => ({
      name: file.fileName,
      size: file.fileSize,
      dimensions: `${file.dimensions.width}×${file.dimensions.height}`,
      camera: file.exif?.make && file.exif?.model ? `${file.exif.make} ${file.exif.model}` : 'Unknown',
      createdAt: file.createdAt.toISOString(),
    }));

    const csvContent = [
      'Name,Size,Dimensions,Camera,Created At',
      ...fileList.map(file => 
        `"${file.name}",${file.size},"${file.dimensions}","${file.camera}","${file.createdAt}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'file-list.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }, [state.selectedFiles]);

  // 按条件过滤文件
  const filterFiles = useCallback((predicate: (file: PhotoMetadata) => boolean) => {
    return state.selectedFiles.filter(predicate);
  }, [state.selectedFiles]);

  // 按相机品牌分组
  const groupByCamera = useCallback(() => {
    const groups = new Map<string, PhotoMetadata[]>();
    
    state.selectedFiles.forEach(file => {
      const camera = file.exif?.make || 'Unknown';
      if (!groups.has(camera)) {
        groups.set(camera, []);
      }
      groups.get(camera)!.push(file);
    });

    return Object.fromEntries(groups);
  }, [state.selectedFiles]);

  return {
    // 状态
    selectedFiles: state.selectedFiles,
    isProcessing: state.isProcessing,
    progress: state.progress,
    errors: state.errors,

    // 操作
    handleFilesSelected,
    removeFile,
    clearFiles,
    clearErrors,
    cancelProcessing,
    retryFailedFiles,

    // 工具函数
    getFileStats,
    exportFileList,
    filterFiles,
    groupByCamera,
  };
}
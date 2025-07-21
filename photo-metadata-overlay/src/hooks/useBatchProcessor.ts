import { useState, useCallback, useRef } from 'react';
import { PhotoMetadata, OverlaySettings, FrameSettings } from '../types';
import { imageProcessingService } from '../services/image-processing.service';

export interface BatchProcessingProgress {
  current: number;
  total: number;
  currentFile: string;
  percentage: number;
  status: 'idle' | 'processing' | 'paused' | 'completed' | 'cancelled';
  estimatedTimeRemaining?: number;
}

export interface BatchProcessingResults {
  total: number;
  successful: number;
  failed: number;
  errors: BatchProcessingError[];
  processedFiles: ProcessedFile[];
  duration: number;
  averageProcessingTime: number;
}

export interface BatchProcessingError {
  fileName: string;
  error: string;
  timestamp: Date;
  fileIndex: number;
}

export interface ProcessedFile {
  original: PhotoMetadata;
  blob: Blob;
  success: boolean;
  error?: string;
  processingTime: number;
}

interface UseBatchProcessorOptions {
  onProgress?: (progress: BatchProcessingProgress) => void;
  onComplete?: (results: BatchProcessingResults) => void;
  onError?: (error: BatchProcessingError) => void;
  concurrency?: number; // 并发处理数量
  retryAttempts?: number; // 重试次数
}

export function useBatchProcessor(options: UseBatchProcessorOptions = {}) {
  const {
    onProgress,
    onComplete,
    onError,
    concurrency = 1, // 默认串行处理
    retryAttempts = 0,
  } = options;

  const [progress, setProgress] = useState<BatchProcessingProgress>({
    current: 0,
    total: 0,
    currentFile: '',
    percentage: 0,
    status: 'idle',
  });

  const [results, setResults] = useState<BatchProcessingResults | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);
  const processingTimesRef = useRef<number[]>([]);

  // 更新进度
  const updateProgress = useCallback((
    current: number,
    total: number,
    fileName: string,
    status: BatchProcessingProgress['status']
  ) => {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    
    // 计算预估剩余时间
    let estimatedTimeRemaining: number | undefined;
    if (status === 'processing' && processingTimesRef.current.length > 0 && current > 0) {
      const averageTime = processingTimesRef.current.reduce((a, b) => a + b, 0) / processingTimesRef.current.length;
      const remainingFiles = total - current;
      estimatedTimeRemaining = averageTime * remainingFiles;
    }

    const newProgress: BatchProcessingProgress = {
      current,
      total,
      currentFile: fileName,
      percentage,
      status,
      estimatedTimeRemaining,
    };
    
    setProgress(newProgress);
    onProgress?.(newProgress);
  }, [onProgress]);

  // 处理单个文件
  const processFile = useCallback(async (
    file: PhotoMetadata,
    overlaySettings: OverlaySettings,
    frameSettings: FrameSettings,
    retryCount = 0
  ): Promise<ProcessedFile> => {
    const startTime = Date.now();

    try {
      // 创建文件对象
      const response = await fetch(file.filePath);
      const blob = await response.blob();
      const fileObj = new File([blob], file.fileName, { type: file.mimeType });

      // 加载图像
      const image = await imageProcessingService.loadImage(fileObj);

      // 应用叠加
      const overlaidCanvas = await imageProcessingService.applyOverlay(image, file, overlaySettings);

      // 应用相框
      const framedCanvas = await imageProcessingService.applyFrame(overlaidCanvas, frameSettings);

      // 导出图像
      const processedBlob = await imageProcessingService.exportImage(framedCanvas, 'jpeg', 0.9);

      const processingTime = Date.now() - startTime;
      processingTimesRef.current.push(processingTime);

      return {
        original: file,
        blob: processedBlob,
        success: true,
        processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : '处理失败';

      // 重试逻辑
      if (retryCount < retryAttempts) {
        console.warn(`文件 ${file.fileName} 处理失败，正在重试 (${retryCount + 1}/${retryAttempts}):`, errorMessage);
        return processFile(file, overlaySettings, frameSettings, retryCount + 1);
      }

      return {
        original: file,
        blob: new Blob(),
        success: false,
        error: errorMessage,
        processingTime,
      };
    }
  }, [retryAttempts]);

  // 并发处理文件
  const processFilesWithConcurrency = useCallback(async (
    files: PhotoMetadata[],
    overlaySettings: OverlaySettings,
    frameSettings: FrameSettings
  ): Promise<ProcessedFile[]> => {
    const results: ProcessedFile[] = [];
    const errors: BatchProcessingError[] = [];

    // 创建处理队列
    const processQueue = async (fileIndex: number): Promise<void> => {
      if (fileIndex >= files.length) return;

      const file = files[fileIndex];
      
      // 检查是否被取消
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // 检查是否暂停
      while (isPaused && !abortControllerRef.current?.signal.aborted) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      updateProgress(fileIndex + 1, files.length, file.fileName, 'processing');

      try {
        const result = await processFile(file, overlaySettings, frameSettings);
        results[fileIndex] = result;

        if (!result.success && result.error) {
          const error: BatchProcessingError = {
            fileName: file.fileName,
            error: result.error,
            timestamp: new Date(),
            fileIndex,
          };
          errors.push(error);
          onError?.(error);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '处理失败';
        const batchError: BatchProcessingError = {
          fileName: file.fileName,
          error: errorMessage,
          timestamp: new Date(),
          fileIndex,
        };
        errors.push(batchError);
        onError?.(batchError);

        results[fileIndex] = {
          original: file,
          blob: new Blob(),
          success: false,
          error: errorMessage,
          processingTime: 0,
        };
      }
    };

    // 创建并发处理的Promise数组
    const concurrentPromises: Promise<void>[] = [];
    for (let i = 0; i < Math.min(concurrency, files.length); i++) {
      concurrentPromises.push(
        (async () => {
          for (let j = i; j < files.length; j += concurrency) {
            await processQueue(j);
          }
        })()
      );
    }

    await Promise.all(concurrentPromises);
    return results;
  }, [processFile, updateProgress, onError, isPaused, concurrency]);

  // 开始批量处理
  const startProcessing = useCallback(async (
    files: PhotoMetadata[],
    overlaySettings: OverlaySettings,
    frameSettings: FrameSettings
  ) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setIsPaused(false);
    setResults(null);
    startTimeRef.current = Date.now();
    processingTimesRef.current = [];

    // 创建AbortController用于取消操作
    abortControllerRef.current = new AbortController();

    updateProgress(0, files.length, '', 'processing');

    try {
      const processedFiles = await processFilesWithConcurrency(files, overlaySettings, frameSettings);

      const duration = Date.now() - startTimeRef.current;
      const successful = processedFiles.filter(f => f.success).length;
      const failed = processedFiles.filter(f => !f.success).length;
      const errors = processedFiles
        .filter(f => !f.success && f.error)
        .map((f, index) => ({
          fileName: f.original.fileName,
          error: f.error!,
          timestamp: new Date(),
          fileIndex: index,
        }));

      const averageProcessingTime = processingTimesRef.current.length > 0
        ? processingTimesRef.current.reduce((a, b) => a + b, 0) / processingTimesRef.current.length
        : 0;

      const finalResults: BatchProcessingResults = {
        total: files.length,
        successful,
        failed,
        errors,
        processedFiles,
        duration,
        averageProcessingTime,
      };

      setResults(finalResults);
      updateProgress(files.length, files.length, '', 'completed');
      onComplete?.(finalResults);

    } catch (error) {
      console.error('批量处理出错:', error);
      updateProgress(0, files.length, '', 'cancelled');
    } finally {
      setIsProcessing(false);
      setIsPaused(false);
      abortControllerRef.current = null;
    }
  }, [processFilesWithConcurrency, updateProgress, onComplete]);

  // 暂停处理
  const pauseProcessing = useCallback(() => {
    setIsPaused(true);
    updateProgress(progress.current, progress.total, progress.currentFile, 'paused');
  }, [progress, updateProgress]);

  // 恢复处理
  const resumeProcessing = useCallback(() => {
    setIsPaused(false);
    updateProgress(progress.current, progress.total, progress.currentFile, 'processing');
  }, [progress, updateProgress]);

  // 取消处理
  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsProcessing(false);
    setIsPaused(false);
    updateProgress(0, progress.total, '', 'cancelled');
  }, [progress.total, updateProgress]);

  // 重置状态
  const resetProcessing = useCallback(() => {
    setProgress({
      current: 0,
      total: 0,
      currentFile: '',
      percentage: 0,
      status: 'idle',
    });
    setResults(null);
    setIsProcessing(false);
    setIsPaused(false);
    processingTimesRef.current = [];
  }, []);

  return {
    // 状态
    progress,
    results,
    isProcessing,
    isPaused,

    // 操作
    startProcessing,
    pauseProcessing,
    resumeProcessing,
    cancelProcessing,
    resetProcessing,
  };
}
import React, { useState, useCallback, useRef } from 'react';
import { Play, Pause, Square, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { PhotoMetadata, OverlaySettings, FrameSettings } from '../../types';
import { imageProcessingService } from '../../services/image-processing.service';
import { cn } from '../../utils/cn';

interface BatchProcessorProps {
  files: PhotoMetadata[];
  fileMap: Map<string, File>; // 添加文件映射
  overlaySettings: OverlaySettings;
  frameSettings: FrameSettings;
  onComplete?: (results: BatchProcessingResults) => void;
  onProgress?: (progress: BatchProcessingProgress) => void;
  className?: string;
}

interface BatchProcessingProgress {
  current: number;
  total: number;
  currentFile: string;
  percentage: number;
  status: 'idle' | 'processing' | 'paused' | 'completed' | 'cancelled';
}

interface BatchProcessingResults {
  total: number;
  successful: number;
  failed: number;
  errors: BatchProcessingError[];
  processedFiles: ProcessedFile[];
  duration: number;
}

interface BatchProcessingError {
  fileName: string;
  error: string;
  timestamp: Date;
}

interface ProcessedFile {
  original: PhotoMetadata;
  blob: Blob;
  success: boolean;
  error?: string;
}

/**
 * 批量处理器组件
 * 支持批量处理多个文件，显示进度和结果统计
 */
export const BatchProcessor: React.FC<BatchProcessorProps> = ({
  files,
  fileMap,
  overlaySettings,
  frameSettings,
  onComplete,
  onProgress,
  className,
}) => {
  const [progress, setProgress] = useState<BatchProcessingProgress>({
    current: 0,
    total: files.length,
    currentFile: '',
    percentage: 0,
    status: 'idle',
  });

  const [results, setResults] = useState<BatchProcessingResults | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);

  // 更新进度
  const updateProgress = useCallback((current: number, fileName: string, status: BatchProcessingProgress['status']) => {
    const percentage = Math.round((current / files.length) * 100);
    const newProgress: BatchProcessingProgress = {
      current,
      total: files.length,
      currentFile: fileName,
      percentage,
      status,
    };
    
    setProgress(newProgress);
    onProgress?.(newProgress);
  }, [files.length, onProgress]);

  // 处理单个文件
  const processFile = useCallback(async (file: PhotoMetadata): Promise<ProcessedFile> => {
    try {
      // 从fileMap获取原始文件对象
      const fileObj = fileMap.get(file.fileName);
      if (!fileObj) {
        throw new Error(`无法找到文件: ${file.fileName}`);
      }

      // 加载图像
      const image = await imageProcessingService.loadImage(fileObj);

      // 应用叠加
      const overlaidCanvas = await imageProcessingService.applyOverlay(image, file, overlaySettings);

      // 应用相框
      const framedCanvas = await imageProcessingService.applyFrame(overlaidCanvas, frameSettings);

      // 导出图像
      const processedBlob = await imageProcessingService.exportImage(framedCanvas, 'jpeg', 0.9);

      return {
        original: file,
        blob: processedBlob,
        success: true,
      };
    } catch (error) {
      return {
        original: file,
        blob: new Blob(),
        success: false,
        error: error instanceof Error ? error.message : '处理失败',
      };
    }
  }, [overlaySettings, frameSettings]);

  // 开始批量处理
  const startProcessing = useCallback(async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setIsPaused(false);
    setResults(null);
    startTimeRef.current = Date.now();

    // 创建AbortController用于取消操作
    abortControllerRef.current = new AbortController();

    const processedFiles: ProcessedFile[] = [];
    const errors: BatchProcessingError[] = [];
    let successful = 0;
    let failed = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        // 检查是否被取消
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        // 检查是否暂停
        while (isPaused && !abortControllerRef.current?.signal.aborted) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const file = files[i];
        updateProgress(i + 1, file.fileName, 'processing');

        try {
          const result = await processFile(file);
          processedFiles.push(result);

          if (result.success) {
            successful++;
          } else {
            failed++;
            errors.push({
              fileName: file.fileName,
              error: result.error || '未知错误',
              timestamp: new Date(),
            });
          }
        } catch (error) {
          failed++;
          const errorMessage = error instanceof Error ? error.message : '处理失败';
          errors.push({
            fileName: file.fileName,
            error: errorMessage,
            timestamp: new Date(),
          });

          processedFiles.push({
            original: file,
            blob: new Blob(),
            success: false,
            error: errorMessage,
          });
        }
      }

      const duration = Date.now() - startTimeRef.current;
      const finalResults: BatchProcessingResults = {
        total: files.length,
        successful,
        failed,
        errors,
        processedFiles,
        duration,
      };

      setResults(finalResults);
      updateProgress(files.length, '', 'completed');
      onComplete?.(finalResults);

    } catch (error) {
      console.error('批量处理出错:', error);
      updateProgress(0, '', 'idle');
    } finally {
      setIsProcessing(false);
      setIsPaused(false);
      abortControllerRef.current = null;
    }
  }, [files, processFile, updateProgress, onComplete, isPaused]);

  // 暂停处理
  const pauseProcessing = useCallback(() => {
    setIsPaused(true);
    updateProgress(progress.current, progress.currentFile, 'paused');
  }, [progress.current, progress.currentFile, updateProgress]);

  // 恢复处理
  const resumeProcessing = useCallback(() => {
    setIsPaused(false);
    updateProgress(progress.current, progress.currentFile, 'processing');
  }, [progress.current, progress.currentFile, updateProgress]);

  // 取消处理
  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsProcessing(false);
    setIsPaused(false);
    updateProgress(0, '', 'cancelled');
  }, [updateProgress]);

  // 下载所有处理后的文件
  const downloadAll = useCallback(() => {
    if (!results || results.processedFiles.length === 0) return;

    results.processedFiles.forEach((file) => {
      if (file.success) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(file.blob);
        link.download = `processed_${file.original.fileName}`;
        link.click();
        URL.revokeObjectURL(link.href);
      }
    });
  }, [results]);

  // 下载单个文件
  const downloadFile = useCallback((file: ProcessedFile) => {
    if (!file.success) return;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(file.blob);
    link.download = `processed_${file.original.fileName}`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, []);

  // 格式化时间
  const formatDuration = useCallback((ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    } else if (minutes > 0) {
      return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
    } else {
      return `${seconds}s`;
    }
  }, []);

  return (
    <div className={cn("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6", className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          批量处理
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {files.length} 个文件
        </div>
      </div>

      {/* 进度条 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {progress.status === 'idle' && '准备开始'}
            {progress.status === 'processing' && `正在处理: ${progress.currentFile}`}
            {progress.status === 'paused' && '已暂停'}
            {progress.status === 'completed' && '处理完成'}
            {progress.status === 'cancelled' && '已取消'}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {progress.current} / {progress.total} ({progress.percentage}%)
          </div>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              progress.status === 'processing' && "bg-blue-600",
              progress.status === 'paused' && "bg-yellow-600",
              progress.status === 'completed' && "bg-green-600",
              progress.status === 'cancelled' && "bg-red-600",
              progress.status === 'idle' && "bg-gray-400"
            )}
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center space-x-3 mb-6">
        {!isProcessing && progress.status !== 'completed' && (
          <button
            onClick={startProcessing}
            disabled={files.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" />
            <span>开始处理</span>
          </button>
        )}

        {isProcessing && !isPaused && (
          <button
            onClick={pauseProcessing}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            <Pause className="w-4 h-4" />
            <span>暂停</span>
          </button>
        )}

        {isProcessing && isPaused && (
          <button
            onClick={resumeProcessing}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Play className="w-4 h-4" />
            <span>继续</span>
          </button>
        )}

        {isProcessing && (
          <button
            onClick={cancelProcessing}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <Square className="w-4 h-4" />
            <span>取消</span>
          </button>
        )}

        {results && results.successful > 0 && (
          <button
            onClick={downloadAll}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            <span>下载全部</span>
          </button>
        )}
      </div>

      {/* 结果摘要 */}
      {results && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            处理结果
          </h3>

          {/* 统计信息 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">处理时间</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatDuration(results.duration)}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-blue-600 dark:text-blue-400">总计</span>
              </div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {results.total}
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-600 dark:text-green-400">成功</span>
              </div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {results.successful}
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-600 dark:text-red-400">失败</span>
              </div>
              <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                {results.failed}
              </div>
            </div>
          </div>

          {/* 错误列表 */}
          {results.errors.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-red-900 dark:text-red-100 mb-3">
                处理错误 ({results.errors.length})
              </h4>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-h-40 overflow-y-auto">
                {results.errors.map((error, index) => (
                  <div key={index} className="flex items-start space-x-2 mb-2 last:mb-0">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-red-900 dark:text-red-100 truncate">
                        {error.fileName}
                      </div>
                      <div className="text-xs text-red-700 dark:text-red-300">
                        {error.error}
                      </div>
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-400 flex-shrink-0">
                      {error.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 文件列表 */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
              处理文件列表
            </h4>
            <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg max-h-60 overflow-y-auto">
              {results.processedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {file.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {file.original.fileName}
                      </div>
                      {!file.success && file.error && (
                        <div className="text-xs text-red-600 dark:text-red-400 truncate">
                          {file.error}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {file.success && (
                    <button
                      onClick={() => downloadFile(file)}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <Download className="w-3 h-3" />
                      <span>下载</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchProcessor;
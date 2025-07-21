import { useState, useCallback, useEffect } from 'react';
import { StatusType } from '../components/StatusBar';
import { AppError, globalErrorHandler } from '../utils/error-handler';

export interface AppStatus {
  type: StatusType;
  message?: string;
  progress?: number;
  timestamp: Date;
}

/**
 * 应用状态管理Hook
 * 提供全局状态管理和错误处理集成
 */
export const useAppStatus = () => {
  const [currentStatus, setCurrentStatus] = useState<AppStatus>({
    type: 'idle',
    timestamp: new Date(),
  });
  
  const [statusHistory, setStatusHistory] = useState<AppStatus[]>([]);

  // 设置状态
  const setStatus = useCallback((
    type: StatusType,
    message?: string,
    progress?: number
  ) => {
    const newStatus: AppStatus = {
      type,
      message,
      progress,
      timestamp: new Date(),
    };
    
    setCurrentStatus(newStatus);
    
    // 添加到历史记录（保留最近20条）
    setStatusHistory(prev => [newStatus, ...prev.slice(0, 19)]);
  }, []);

  // 便捷方法
  const setLoading = useCallback((message?: string, progress?: number) => {
    setStatus('loading', message, progress);
  }, [setStatus]);

  const setSuccess = useCallback((message?: string) => {
    setStatus('success', message);
  }, [setStatus]);

  const setError = useCallback((message?: string) => {
    setStatus('error', message);
  }, [setStatus]);

  const setWarning = useCallback((message?: string) => {
    setStatus('warning', message);
  }, [setStatus]);

  const setInfo = useCallback((message?: string) => {
    setStatus('info', message);
  }, [setStatus]);

  const setIdle = useCallback(() => {
    setStatus('idle');
  }, [setStatus]);

  // 清除状态
  const clearStatus = useCallback(() => {
    setIdle();
  }, [setIdle]);

  // 更新进度
  const updateProgress = useCallback((progress: number) => {
    setCurrentStatus(prev => ({
      ...prev,
      progress,
      timestamp: new Date(),
    }));
  }, []);

  // 监听全局错误
  useEffect(() => {
    const handleGlobalError = (error: AppError) => {
      setError(error.message);
    };

    globalErrorHandler.addErrorListener(handleGlobalError);

    return () => {
      globalErrorHandler.removeErrorListener(handleGlobalError);
    };
  }, [setError]);

  // 自动清除成功状态
  useEffect(() => {
    if (currentStatus.type === 'success') {
      const timer = setTimeout(() => {
        setIdle();
      }, 3000); // 3秒后自动清除成功状态

      return () => clearTimeout(timer);
    }
  }, [currentStatus.type, setIdle]);

  return {
    currentStatus,
    statusHistory,
    setStatus,
    setLoading,
    setSuccess,
    setError,
    setWarning,
    setInfo,
    setIdle,
    clearStatus,
    updateProgress,
    isLoading: currentStatus.type === 'loading',
    hasError: currentStatus.type === 'error',
    isSuccess: currentStatus.type === 'success',
  };
};
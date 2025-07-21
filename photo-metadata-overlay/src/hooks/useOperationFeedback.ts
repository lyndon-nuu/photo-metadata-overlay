import { useCallback } from 'react';
import { useAppStatus } from './useAppStatus';
import { useToast } from './useToast';
import { AppError, globalErrorHandler } from '../utils/error-handler';

/**
 * 操作反馈Hook
 * 提供统一的操作反馈管理
 */
export const useOperationFeedback = () => {
  const { setLoading, setSuccess, setError, setIdle } = useAppStatus();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  /**
   * 执行异步操作并提供反馈
   */
  const executeWithFeedback = useCallback(async <T>(
    operation: () => Promise<T>,
    options: {
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
      showToast?: boolean;
      showStatusBar?: boolean;
      onSuccess?: (result: T) => void;
      onError?: (error: AppError) => void;
    } = {}
  ): Promise<T | undefined> => {
    const {
      loadingMessage = '正在处理...',
      successMessage = '操作成功',
      errorMessage,
      showToast = true,
      showStatusBar = true,
      onSuccess,
      onError,
    } = options;

    try {
      // 显示加载状态
      if (showStatusBar) {
        setLoading(loadingMessage);
      }

      // 执行操作
      const result = await operation();

      // 显示成功状态
      if (showStatusBar) {
        setSuccess(successMessage);
      }
      
      if (showToast) {
        showSuccessToast('操作成功', successMessage);
      }

      // 调用成功回调
      onSuccess?.(result);

      return result;
    } catch (error) {
      const appError = error instanceof Error 
        ? globalErrorHandler.handleSyncError(() => { throw error; })
        : error as AppError;

      const finalErrorMessage = errorMessage || (appError as AppError)?.message || '操作失败';

      // 显示错误状态
      if (showStatusBar) {
        setError(finalErrorMessage);
      }
      
      if (showToast) {
        showErrorToast('操作失败', finalErrorMessage);
      }

      // 调用错误回调
      if (appError) {
        onError?.(appError as AppError);
      }

      return undefined;
    }
  }, [setLoading, setSuccess, setError, showSuccessToast, showErrorToast]);

  /**
   * 执行带进度的异步操作
   */
  const executeWithProgress = useCallback(async <T>(
    operation: (updateProgress: (progress: number) => void) => Promise<T>,
    options: {
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
      showToast?: boolean;
      onSuccess?: (result: T) => void;
      onError?: (error: AppError) => void;
    } = {}
  ): Promise<T | undefined> => {
    const {
      loadingMessage = '正在处理...',
      successMessage = '操作成功',
      errorMessage,
      showToast = true,
      onSuccess,
      onError,
    } = options;

    try {
      // 显示加载状态
      setLoading(loadingMessage, 0);

      // 进度更新函数
      const updateProgress = (progress: number) => {
        setLoading(loadingMessage, Math.max(0, Math.min(100, progress)));
      };

      // 执行操作
      const result = await operation(updateProgress);

      // 显示成功状态
      setSuccess(successMessage);
      
      if (showToast) {
        showSuccessToast('操作成功', successMessage);
      }

      // 调用成功回调
      onSuccess?.(result);

      return result;
    } catch (error) {
      const appError = error instanceof Error 
        ? globalErrorHandler.handleSyncError(() => { throw error; })
        : error as AppError;

      const finalErrorMessage = errorMessage || (appError as AppError)?.message || '操作失败';

      // 显示错误状态
      setError(finalErrorMessage);
      
      if (showToast) {
        showErrorToast('操作失败', finalErrorMessage);
      }

      // 调用错误回调
      if (appError) {
        onError?.(appError as AppError);
      }

      return undefined;
    }
  }, [setLoading, setSuccess, setError, showSuccessToast, showErrorToast]);

  /**
   * 显示成功反馈
   */
  const showSuccess = useCallback((
    message: string,
    options: {
      showToast?: boolean;
      showStatusBar?: boolean;
      autoHide?: boolean;
    } = {}
  ) => {
    const { showToast = true, showStatusBar = true, autoHide = true } = options;

    if (showStatusBar) {
      setSuccess(message);
      if (autoHide) {
        setTimeout(() => setIdle(), 3000);
      }
    }

    if (showToast) {
      showSuccessToast('成功', message);
    }
  }, [setSuccess, setIdle, showSuccessToast]);

  /**
   * 显示错误反馈
   */
  const showError = useCallback((
    message: string,
    options: {
      showToast?: boolean;
      showStatusBar?: boolean;
      error?: AppError;
    } = {}
  ) => {
    const { showToast = true, showStatusBar = true, error } = options;

    if (showStatusBar) {
      setError(message);
    }

    if (showToast) {
      showErrorToast('错误', message);
    }

    // 记录错误
    if (error) {
      globalErrorHandler.handleError(error);
    }
  }, [setError, showErrorToast]);

  /**
   * 清除所有反馈
   */
  const clearFeedback = useCallback(() => {
    setIdle();
  }, [setIdle]);

  return {
    executeWithFeedback,
    executeWithProgress,
    showSuccess,
    showError,
    clearFeedback,
  };
};
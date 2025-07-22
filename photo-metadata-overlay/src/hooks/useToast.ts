import { useState, useCallback } from 'react';
import { ToastData, ToastType } from '../components/UI/Toast';

/**
 * Toast管理Hook
 * 提供显示和管理Toast通知的功能
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const MAX_TOASTS = 3; // 最多同时显示3个通知

  const addToast = useCallback((
    type: ToastType,
    title: string,
    message?: string,
    options?: {
      duration?: number;
      action?: {
        label: string;
        onClick: () => void;
      };
      preventDuplicate?: boolean;
    }
  ) => {
    // 检查是否有重复的通知
    if (options?.preventDuplicate !== false) {
      const isDuplicate = toasts.some(toast => 
        toast.title === title && toast.message === message && toast.type === type
      );
      if (isDuplicate) {
        return null;
      }
    }

    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastData = {
      id,
      type,
      title,
      message,
      duration: options?.duration ?? (type === 'error' ? 0 : 3000), // 缩短默认显示时间
      action: options?.action,
    };

    setToasts(prev => {
      const newToasts = [...prev, newToast];
      // 如果超过最大数量，移除最旧的通知
      if (newToasts.length > MAX_TOASTS) {
        return newToasts.slice(-MAX_TOASTS);
      }
      return newToasts;
    });
    return id;
  }, [toasts]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // 便捷方法
  const success = useCallback((title: string, message?: string, options?: { duration?: number }) => {
    return addToast('success', title, message, options);
  }, [addToast]);

  const error = useCallback((title: string, message?: string, options?: { action?: { label: string; onClick: () => void } }) => {
    return addToast('error', title, message, { duration: 0, ...options });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string, options?: { duration?: number }) => {
    return addToast('warning', title, message, options);
  }, [addToast]);

  const info = useCallback((title: string, message?: string, options?: { duration?: number }) => {
    return addToast('info', title, message, options);
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
  };
};

export default useToast;
import { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { AppError, createAppError, globalErrorHandler } from '../../utils/error-handler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError) => void;
}

interface State {
  hasError: boolean;
  error?: AppError;
}

/**
 * React错误边界组件
 * 捕获组件树中的JavaScript错误并显示友好的错误界面
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const appError = createAppError('UNKNOWN_ERROR', error.message, error);
    return {
      hasError: true,
      error: appError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = createAppError('UNKNOWN_ERROR', error.message, error);
    
    // 记录错误详情
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 通知全局错误处理器
    globalErrorHandler.handleError(appError);
    
    // 调用自定义错误处理器
    this.props.onError?.(appError);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportError = () => {
    if (this.state.error) {
      const errorReport = {
        message: this.state.error.message,
        code: this.state.error.code,
        timestamp: this.state.error.timestamp,
        userAgent: navigator.userAgent,
        url: window.location.href,
      };
      
      // 这里可以发送错误报告到服务器
      console.log('Error Report:', errorReport);
      
      // 复制到剪贴板
      navigator.clipboard?.writeText(JSON.stringify(errorReport, null, 2));
      alert('错误信息已复制到剪贴板');
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <motion.div
            className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 500 }}
            >
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </motion.div>

            <motion.h2
              className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              出现了一个错误
            </motion.h2>

            <motion.p
              className="text-gray-600 dark:text-gray-400 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {this.state.error?.message || '应用程序遇到了意外错误，请尝试刷新页面或返回首页。'}
            </motion.p>

            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>重试</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>返回首页</span>
              </button>

              <button
                onClick={this.handleReportError}
                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
              >
                <Bug className="w-4 h-4" />
                <span>报告错误</span>
              </button>
            </motion.div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <motion.details
                className="mt-6 text-left"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                  错误详情 (开发模式)
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto max-h-32">
                  {JSON.stringify(this.state.error, null, 2)}
                </pre>
              </motion.details>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 函数式错误边界Hook
 * 用于在函数组件中处理错误
 */
export const useErrorHandler = () => {
  const handleError = (error: Error | AppError) => {
    globalErrorHandler.handleError(error);
  };

  const handleAsyncError = async <T,>(
    operation: () => Promise<T>,
    fallback?: T
  ): Promise<T | undefined> => {
    return globalErrorHandler.handleAsyncError(operation, fallback);
  };

  const handleSyncError = <T,>(
    operation: () => T,
    fallback?: T
  ): T | undefined => {
    return globalErrorHandler.handleSyncError(operation, fallback);
  };

  return {
    handleError,
    handleAsyncError,
    handleSyncError,
  };
};

export default ErrorBoundary;
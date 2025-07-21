/**
 * 全局错误处理工具
 * 提供统一的错误处理和用户友好的错误消息
 */

export interface AppError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  stack?: string;
}

export type ErrorCode = 
  | 'FILE_READ_ERROR'
  | 'FILE_WRITE_ERROR'
  | 'INVALID_FILE_FORMAT'
  | 'FILE_TOO_LARGE'
  | 'NETWORK_ERROR'
  | 'PROCESSING_ERROR'
  | 'STORAGE_ERROR'
  | 'PERMISSION_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * 错误消息映射表
 * 将技术错误代码转换为用户友好的消息
 */
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  FILE_READ_ERROR: '无法读取文件，请检查文件是否存在或已损坏',
  FILE_WRITE_ERROR: '无法保存文件，请检查磁盘空间和写入权限',
  INVALID_FILE_FORMAT: '不支持的文件格式，请选择有效的图片文件',
  FILE_TOO_LARGE: '文件过大，请选择小于10MB的图片文件',
  NETWORK_ERROR: '网络连接失败，请检查网络连接后重试',
  PROCESSING_ERROR: '图像处理失败，请重试或选择其他图片',
  STORAGE_ERROR: '存储操作失败，请检查可用空间',
  PERMISSION_ERROR: '权限不足，无法执行此操作',
  UNKNOWN_ERROR: '发生未知错误，请重试或联系技术支持',
};

/**
 * 创建应用错误对象
 */
export function createAppError(
  code: ErrorCode,
  details?: string,
  originalError?: Error
): AppError {
  return {
    code,
    message: ERROR_MESSAGES[code],
    details,
    timestamp: new Date(),
    stack: originalError?.stack,
  };
}

/**
 * 从原生错误创建应用错误
 */
export function fromNativeError(error: Error): AppError {
  // 根据错误消息或类型推断错误代码
  let code: ErrorCode = 'UNKNOWN_ERROR';
  
  if (error.message.includes('fetch') || error.message.includes('network')) {
    code = 'NETWORK_ERROR';
  } else if (error.message.includes('permission') || error.message.includes('denied')) {
    code = 'PERMISSION_ERROR';
  } else if (error.message.includes('file') && error.message.includes('read')) {
    code = 'FILE_READ_ERROR';
  } else if (error.message.includes('file') && error.message.includes('write')) {
    code = 'FILE_WRITE_ERROR';
  } else if (error.message.includes('format') || error.message.includes('invalid')) {
    code = 'INVALID_FILE_FORMAT';
  } else if (error.message.includes('size') || error.message.includes('large')) {
    code = 'FILE_TOO_LARGE';
  } else if (error.message.includes('process')) {
    code = 'PROCESSING_ERROR';
  } else if (error.message.includes('storage') || error.message.includes('quota')) {
    code = 'STORAGE_ERROR';
  }
  
  return createAppError(code, error.message, error);
}

/**
 * 错误严重程度
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * 获取错误严重程度
 */
export function getErrorSeverity(code: ErrorCode): ErrorSeverity {
  switch (code) {
    case 'INVALID_FILE_FORMAT':
    case 'FILE_TOO_LARGE':
      return ErrorSeverity.LOW;
    
    case 'FILE_READ_ERROR':
    case 'PROCESSING_ERROR':
      return ErrorSeverity.MEDIUM;
    
    case 'FILE_WRITE_ERROR':
    case 'STORAGE_ERROR':
    case 'NETWORK_ERROR':
      return ErrorSeverity.HIGH;
    
    case 'PERMISSION_ERROR':
    case 'UNKNOWN_ERROR':
      return ErrorSeverity.CRITICAL;
    
    default:
      return ErrorSeverity.MEDIUM;
  }
}

/**
 * 错误处理器类
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: Array<(error: AppError) => void> = [];
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }
  
  /**
   * 添加错误监听器
   */
  addErrorListener(listener: (error: AppError) => void): void {
    this.errorListeners.push(listener);
  }
  
  /**
   * 移除错误监听器
   */
  removeErrorListener(listener: (error: AppError) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }
  
  /**
   * 处理错误
   */
  handleError(error: Error | AppError): void {
    const appError = error instanceof Error ? fromNativeError(error) : error;
    
    // 记录错误到控制台
    console.error('Application Error:', appError);
    
    // 通知所有监听器
    this.errorListeners.forEach(listener => {
      try {
        listener(appError);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });
  }
  
  /**
   * 处理异步错误
   */
  async handleAsyncError<T>(
    operation: () => Promise<T>,
    fallback?: T
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error as Error);
      return fallback;
    }
  }
  
  /**
   * 处理同步错误
   */
  handleSyncError<T>(
    operation: () => T,
    fallback?: T
  ): T | undefined {
    try {
      return operation();
    } catch (error) {
      this.handleError(error as Error);
      return fallback;
    }
  }
}

// 全局错误处理器实例
export const globalErrorHandler = ErrorHandler.getInstance();

// 设置全局未捕获错误处理
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    globalErrorHandler.handleError(event.error);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    globalErrorHandler.handleError(new Error(event.reason));
  });
}
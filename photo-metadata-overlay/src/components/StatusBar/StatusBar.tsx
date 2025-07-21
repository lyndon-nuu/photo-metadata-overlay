import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Loader2, 
  XCircle,
  Clock
} from 'lucide-react';
import { cn } from '../../utils/cn';

export type StatusType = 'idle' | 'loading' | 'success' | 'error' | 'warning' | 'info';

export interface StatusBarProps {
  status: StatusType;
  message?: string;
  progress?: number;
  className?: string;
  showIcon?: boolean;
  showProgress?: boolean;
  onClose?: () => void;
}

/**
 * 状态栏组件
 * 显示当前操作状态和进度信息
 */
export const StatusBar: React.FC<StatusBarProps> = ({
  status,
  message,
  progress,
  className,
  showIcon = true,
  showProgress = false,
  onClose,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          textColor: 'text-blue-800 dark:text-blue-200',
          borderColor: 'border-blue-200 dark:border-blue-800',
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          textColor: 'text-green-800 dark:text-green-200',
          borderColor: 'border-green-200 dark:border-green-800',
        };
      case 'error':
        return {
          icon: <XCircle className="w-4 h-4" />,
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          textColor: 'text-red-800 dark:text-red-200',
          borderColor: 'border-red-200 dark:border-red-800',
        };
      case 'warning':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
        };
      case 'info':
        return {
          icon: <Info className="w-4 h-4" />,
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          textColor: 'text-blue-800 dark:text-blue-200',
          borderColor: 'border-blue-200 dark:border-blue-800',
        };
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          textColor: 'text-gray-800 dark:text-gray-200',
          borderColor: 'border-gray-200 dark:border-gray-800',
        };
    }
  };

  const config = getStatusConfig();

  if (status === 'idle' && !message) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          'flex items-center justify-between px-4 py-2 border rounded-md',
          config.bgColor,
          config.textColor,
          config.borderColor,
          className
        )}
        role="status"
        aria-live="polite"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center space-x-2 flex-1">
          {showIcon && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 500 }}
            >
              {config.icon}
            </motion.div>
          )}
          
          <div className="flex-1">
            {message && (
              <motion.p
                className="text-sm font-medium"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {message}
              </motion.p>
            )}
            
            {showProgress && typeof progress === 'number' && (
              <motion.div
                className="mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-white/50 dark:bg-gray-800/50 rounded-full h-1.5">
                    <motion.div
                      className="bg-current h-1.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {Math.round(progress)}%
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {onClose && (
          <motion.button
            onClick={onClose}
            className="ml-2 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <XCircle className="w-4 h-4" />
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * 迷你状态指示器
 * 用于显示简单的状态信息
 */
export interface MiniStatusProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  tooltip?: string;
}

export const MiniStatus: React.FC<MiniStatusProps> = ({
  status,
  size = 'md',
  className,
  tooltip,
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'bg-blue-500 animate-pulse';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <motion.div
      className={cn(
        'rounded-full',
        sizeClasses[size],
        getStatusColor(),
        className
      )}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500 }}
      title={tooltip}
    />
  );
};

/**
 * 状态栏容器
 * 用于在应用底部显示状态信息
 */
export interface StatusBarContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const StatusBarContainer: React.FC<StatusBarContainerProps> = ({
  children,
  className,
}) => {
  return (
    <motion.div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700',
        className
      )}
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="max-w-7xl mx-auto px-4 py-2">
        {children}
      </div>
    </motion.div>
  );
};

export default StatusBar;
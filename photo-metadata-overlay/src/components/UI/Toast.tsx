import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toast: ToastData;
  onClose: (id: string) => void;
}

/**
 * 单个Toast组件
 */
const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose(toast.id), 300);
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.duration, toast.id, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(toast.id), 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getColorClasses = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            'min-w-96 max-w-2xl w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 border',
            getColorClasses()
          )}
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95, transition: { duration: 0.2 } }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          layout
        >
          <div className="px-4 py-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {getIcon()}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {toast.title}
                  </p>
                  <motion.button
                    className="ml-4 flex-shrink-0 bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={handleClose}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <span className="sr-only">关闭</span>
                    <X className="h-4 w-4" />
                  </motion.button>
                </div>
                {toast.message && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
                    {toast.message}
                  </p>
                )}
                {toast.action && (
                  <div className="mt-2">
                    <motion.button
                      className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                      onClick={toast.action.onClick}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {toast.action.label}
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface ToastContainerProps {
  toasts: ToastData[];
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

/**
 * Toast容器组件
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
  position = 'top-right',
}) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-0 right-80';
      case 'top-left':
        return 'top-0 left-0';
      case 'bottom-right':
        return 'bottom-0 right-80';
      case 'bottom-left':
        return 'bottom-0 left-0';
      case 'top-center':
        return 'top-0 left-1/2 transform -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-0 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-0 right-80';
    }
  };

  return (
    <div
      className={cn(
        'fixed z-50 p-6 space-y-4 pointer-events-none',
        getPositionClasses()
      )}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
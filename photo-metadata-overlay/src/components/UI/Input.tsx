import React from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled';
}

/**
 * 现代化输入框组件
 * 支持标签、错误状态、图标等功能
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  className,
  type = 'text',
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const baseClasses = "block w-full rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0";
  
  const variantClasses = {
    default: cn(
      "bg-white dark:bg-gray-800",
      error
        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
    ),
    filled: cn(
      "bg-gray-50 dark:bg-gray-700 border-transparent",
      error
        ? "focus:bg-white focus:border-red-500 focus:ring-red-500"
        : "focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 focus:ring-blue-500"
    ),
  };

  const sizeClasses = leftIcon || rightIcon || isPassword ? "px-10 py-2.5" : "px-3 py-2.5";

  return (
    <div className={cn("space-y-1", className)}>
      {/* 标签 */}
      {label && (
        <label 
          htmlFor={props.id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}

      {/* 输入框容器 */}
      <div className="relative">
        {/* 左侧图标 */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400 dark:text-gray-500">
              {leftIcon}
            </div>
          </div>
        )}

        {/* 输入框 */}
        <input
          type={inputType}
          className={cn(
            baseClasses,
            variantClasses[variant],
            sizeClasses,
            leftIcon && "pl-10",
            (rightIcon || isPassword) && "pr-10"
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {/* 右侧图标或密码切换 */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {isPassword ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          ) : rightIcon ? (
            <div className="text-gray-400 dark:text-gray-500">
              {rightIcon}
            </div>
          ) : null}
        </div>
      </div>

      {/* 错误信息或帮助文本 */}
      {(error || helperText) && (
        <div className="flex items-start space-x-1">
          {error && (
            <>
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </>
          )}
          {!error && helperText && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Input;
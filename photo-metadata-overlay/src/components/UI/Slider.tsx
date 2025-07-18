import React from 'react';
import { cn } from '../../utils/cn';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  unit?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * 现代化滑块组件
 * 支持自定义范围、步长和显示格式
 */
export const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  unit = '',
  disabled = false,
  className,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue);
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      {/* 标签和值 */}
      {(label || showValue) && (
        <div className="flex justify-between items-center">
          {label && (
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </label>
          )}
          {showValue && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {value}{unit}
            </span>
          )}
        </div>
      )}

      {/* 滑块容器 */}
      <div className="relative">
        {/* 滑块轨道 */}
        <div className="relative h-2 bg-gray-200 rounded-full dark:bg-gray-700">
          {/* 已填充部分 */}
          <div
            className="absolute h-2 bg-blue-600 rounded-full transition-all duration-200"
            style={{ width: `${percentage}%` }}
          />
          
          {/* 滑块输入 */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            className={cn(
              "absolute inset-0 w-full h-2 opacity-0 cursor-pointer",
              disabled && "cursor-not-allowed"
            )}
          />
          
          {/* 滑块手柄 */}
          <div
            className={cn(
              "absolute top-1/2 w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow-sm transform -translate-y-1/2 transition-all duration-200",
              disabled ? "border-gray-400 cursor-not-allowed" : "hover:scale-110 active:scale-95"
            )}
            style={{ left: `calc(${percentage}% - 8px)` }}
          />
        </div>

        {/* 刻度标记（可选） */}
        {(max - min) <= 10 && step === 1 && (
          <div className="flex justify-between mt-1">
            {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((tick) => (
              <div
                key={tick}
                className="text-xs text-gray-400 dark:text-gray-500"
              >
                {tick}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Slider;
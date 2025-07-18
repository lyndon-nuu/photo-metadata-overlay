import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并CSS类名的工具函数
 * 结合clsx和tailwind-merge，提供更好的类名处理
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
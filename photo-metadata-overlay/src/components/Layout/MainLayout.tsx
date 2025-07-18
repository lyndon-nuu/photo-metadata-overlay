import React from 'react';
import { cn } from '../../utils/cn';

interface MainLayoutProps {
  sidebar?: React.ReactNode;
  main?: React.ReactNode;
  className?: string;
}

/**
 * 主界面布局组件
 * 实现左右分栏设计，左侧为侧边栏，右侧为主内容区域
 */
export const MainLayout: React.FC<MainLayoutProps> = ({
  sidebar,
  main,
  className,
}) => {
  return (
    <div className={cn(
      "flex h-screen bg-gray-50 dark:bg-gray-900",
      className
    )}>
      {/* 左侧边栏 */}
      {sidebar && (
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {sidebar}
          </div>
        </div>
      )}
      
      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {main}
      </div>
    </div>
  );
};

export default MainLayout;
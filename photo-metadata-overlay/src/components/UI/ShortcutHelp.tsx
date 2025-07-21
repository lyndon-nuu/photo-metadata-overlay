import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { useShortcutHelp } from '../../hooks/useKeyboardShortcuts';
import { Button } from './Button';

/**
 * 快捷键分组
 */
interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: string;
    description: string;
  }>;
}

/**
 * 快捷键帮助组件
 */
export function ShortcutHelp() {
  const { isVisible, hideHelp } = useShortcutHelp();

  const shortcutGroups: ShortcutGroup[] = [
    {
      title: '文件操作',
      shortcuts: [
        { keys: 'Ctrl+O', description: '打开文件' },
        { keys: 'Ctrl+S', description: '保存/导出' },
        { keys: 'Delete', description: '删除选中项' },
      ],
    },
    {
      title: '编辑操作',
      shortcuts: [
        { keys: 'Ctrl+Z', description: '撤销' },
        { keys: 'Ctrl+Shift+Z', description: '重做' },
        { keys: 'Ctrl+Y', description: '重做 (替代)' },
      ],
    },
    {
      title: '视图控制',
      shortcuts: [
        { keys: 'R', description: '重置视图' },
        { keys: 'F', description: '适应窗口' },
        { keys: '1', description: '实际大小' },
        { keys: '+', description: '放大' },
        { keys: '-', description: '缩小' },
      ],
    },
    {
      title: '处理操作',
      shortcuts: [
        { keys: 'Ctrl+B', description: '批量处理' },
        { keys: 'Ctrl+P', description: '预览切换' },
        { keys: 'Ctrl+Enter', description: '确认/应用' },
      ],
    },
    {
      title: '界面控制',
      shortcuts: [
        { keys: 'Escape', description: '取消/关闭' },
        { keys: '?', description: '显示帮助' },
        { keys: 'H', description: '切换快捷键提示' },
      ],
    },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={hideHelp}
          />
          
          {/* 帮助面板 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 overflow-hidden"
          >
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Keyboard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  键盘快捷键
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={hideHelp}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* 内容区域 */}
            <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shortcutGroups.map((group, groupIndex) => (
                  <motion.div
                    key={group.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: groupIndex * 0.1 }}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
                  >
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                      {group.title}
                    </h3>
                    <div className="space-y-2">
                      {group.shortcuts.map((shortcut, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-3"
                        >
                          <span className="text-sm text-gray-600 dark:text-gray-300 flex-1">
                            {shortcut.description}
                          </span>
                          <kbd className="px-2 py-1 text-xs font-mono bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {shortcut.keys}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 提示信息 */}
              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full" />
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">使用提示</p>
                    <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                      <li>• 快捷键在输入框中不会生效</li>
                      <li>• 按 <kbd className="px-1 py-0.5 text-xs bg-blue-100 dark:bg-blue-800 rounded">H</kbd> 可以切换快捷键提示显示</li>
                      <li>• 按 <kbd className="px-1 py-0.5 text-xs bg-blue-100 dark:bg-blue-800 rounded">?</kbd> 可以随时打开此帮助</li>
                      <li>• 按 <kbd className="px-1 py-0.5 text-xs bg-blue-100 dark:bg-blue-800 rounded">Esc</kbd> 关闭对话框</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 底部操作栏 */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <Button variant="outline" onClick={hideHelp}>
                关闭
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * 快捷键提示组件
 */
export function ShortcutHint({ shortcut, className = '' }: { 
  shortcut: string; 
  className?: string; 
}) {
  return (
    <kbd className={`px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm text-gray-700 dark:text-gray-300 ${className}`}>
      {shortcut}
    </kbd>
  );
}

/**
 * 浮动快捷键提示组件
 */
export function FloatingShortcutHints() {
  const [isVisible, setIsVisible] = React.useState(false);

  // 监听快捷键提示切换事件
  React.useEffect(() => {
    const handleToggle = () => setIsVisible(prev => !prev);
    
    window.addEventListener('app:toggle-shortcuts-hint', handleToggle);
    return () => {
      window.removeEventListener('app:toggle-shortcuts-hint', handleToggle);
    };
  }, []);

  const commonShortcuts = [
    { keys: 'Ctrl+O', description: '打开' },
    { keys: 'Ctrl+S', description: '保存' },
    { keys: 'Ctrl+Z', description: '撤销' },
    { keys: '?', description: '帮助' },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="fixed top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-40"
        >
          <div className="flex items-center gap-2 mb-2">
            <Keyboard className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              快捷键
            </span>
          </div>
          <div className="space-y-1">
            {commonShortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-gray-600 dark:text-gray-300">
                  {shortcut.description}
                </span>
                <ShortcutHint shortcut={shortcut.keys} />
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              按 <ShortcutHint shortcut="H" className="text-xs" /> 隐藏
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
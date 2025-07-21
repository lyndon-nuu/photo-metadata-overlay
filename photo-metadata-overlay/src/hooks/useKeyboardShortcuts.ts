import { useEffect, useCallback, useRef, useState } from 'react';

/**
 * 键盘快捷键配置
 */
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
  preventDefault?: boolean;
  enabled?: boolean;
}

/**
 * 快捷键组合
 */
export interface ShortcutCombo {
  keys: string[];
  description: string;
  action: () => void;
  preventDefault?: boolean;
  enabled?: boolean;
}

/**
 * 键盘快捷键Hook选项
 */
export interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

/**
 * 键盘快捷键Hook
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const { shortcuts, enabled = true, preventDefault = true, stopPropagation = false } = options;
  const shortcutsRef = useRef(shortcuts);
  const enabledRef = useRef(enabled);

  // 更新引用
  useEffect(() => {
    shortcutsRef.current = shortcuts;
    enabledRef.current = enabled;
  }, [shortcuts, enabled]);

  // 处理键盘事件
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabledRef.current) return;

    // 检查是否在输入框中
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    // 查找匹配的快捷键
    const matchedShortcut = shortcutsRef.current.find(shortcut => {
      if (!shortcut.enabled && shortcut.enabled !== undefined) return false;

      return (
        shortcut.key.toLowerCase() === event.key.toLowerCase() &&
        !!shortcut.ctrlKey === event.ctrlKey &&
        !!shortcut.shiftKey === event.shiftKey &&
        !!shortcut.altKey === event.altKey &&
        !!shortcut.metaKey === event.metaKey
      );
    });

    if (matchedShortcut) {
      if (preventDefault || matchedShortcut.preventDefault) {
        event.preventDefault();
      }
      if (stopPropagation) {
        event.stopPropagation();
      }
      
      try {
        matchedShortcut.action();
      } catch (error) {
        console.error('快捷键执行失败:', error);
      }
    }
  }, [preventDefault, stopPropagation]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);

  return {
    shortcuts: shortcutsRef.current,
    enabled: enabledRef.current,
  };
}

/**
 * 全局键盘快捷键Hook
 */
export function useGlobalKeyboardShortcuts() {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'o',
      ctrlKey: true,
      description: '打开文件',
      action: () => {
        // 触发文件选择
        const event = new CustomEvent('app:open-file');
        window.dispatchEvent(event);
      },
    },
    {
      key: 's',
      ctrlKey: true,
      description: '保存/导出',
      action: () => {
        // 触发保存操作
        const event = new CustomEvent('app:save');
        window.dispatchEvent(event);
      },
    },
    {
      key: 'z',
      ctrlKey: true,
      description: '撤销',
      action: () => {
        // 触发撤销操作
        const event = new CustomEvent('app:undo');
        window.dispatchEvent(event);
      },
    },
    {
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
      description: '重做',
      action: () => {
        // 触发重做操作
        const event = new CustomEvent('app:redo');
        window.dispatchEvent(event);
      },
    },
    {
      key: 'y',
      ctrlKey: true,
      description: '重做 (替代)',
      action: () => {
        // 触发重做操作
        const event = new CustomEvent('app:redo');
        window.dispatchEvent(event);
      },
    },
    {
      key: 'b',
      ctrlKey: true,
      description: '批量处理',
      action: () => {
        // 触发批量处理
        const event = new CustomEvent('app:batch-process');
        window.dispatchEvent(event);
      },
    },
    {
      key: 'p',
      ctrlKey: true,
      description: '预览切换',
      action: () => {
        // 切换预览模式
        const event = new CustomEvent('app:toggle-preview');
        window.dispatchEvent(event);
      },
    },
    {
      key: 'r',
      description: '重置视图',
      action: () => {
        // 重置图像视图
        const event = new CustomEvent('app:reset-view');
        window.dispatchEvent(event);
      },
    },
    {
      key: 'f',
      description: '适应窗口',
      action: () => {
        // 适应窗口大小
        const event = new CustomEvent('app:fit-to-window');
        window.dispatchEvent(event);
      },
    },
    {
      key: '1',
      description: '实际大小',
      action: () => {
        // 显示实际大小
        const event = new CustomEvent('app:actual-size');
        window.dispatchEvent(event);
      },
    },
    {
      key: '+',
      description: '放大',
      action: () => {
        // 放大图像
        const event = new CustomEvent('app:zoom-in');
        window.dispatchEvent(event);
      },
    },
    {
      key: '=',
      description: '放大 (替代)',
      action: () => {
        // 放大图像
        const event = new CustomEvent('app:zoom-in');
        window.dispatchEvent(event);
      },
    },
    {
      key: '-',
      description: '缩小',
      action: () => {
        // 缩小图像
        const event = new CustomEvent('app:zoom-out');
        window.dispatchEvent(event);
      },
    },
    {
      key: 'Delete',
      description: '删除选中项',
      action: () => {
        // 删除选中的文件
        const event = new CustomEvent('app:delete-selected');
        window.dispatchEvent(event);
      },
    },
    {
      key: 'Escape',
      description: '取消/关闭',
      action: () => {
        // 取消当前操作或关闭对话框
        const event = new CustomEvent('app:cancel');
        window.dispatchEvent(event);
      },
    },
    {
      key: 'Enter',
      ctrlKey: true,
      description: '确认/应用',
      action: () => {
        // 确认当前操作
        const event = new CustomEvent('app:confirm');
        window.dispatchEvent(event);
      },
    },
    {
      key: '?',
      description: '显示帮助',
      action: () => {
        // 显示快捷键帮助
        const event = new CustomEvent('app:show-help');
        window.dispatchEvent(event);
      },
    },
    {
      key: 'h',
      description: '显示/隐藏快捷键提示',
      action: () => {
        // 切换快捷键提示显示
        const event = new CustomEvent('app:toggle-shortcuts-hint');
        window.dispatchEvent(event);
      },
    },
  ];

  return useKeyboardShortcuts({
    shortcuts,
    enabled: true,
    preventDefault: true,
  });
}

/**
 * 格式化快捷键显示
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  
  // 检测操作系统
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  if (shortcut.ctrlKey) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shiftKey) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (shortcut.altKey) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (shortcut.metaKey) {
    parts.push(isMac ? '⌘' : 'Meta');
  }
  
  // 格式化按键名称
  let keyName = shortcut.key;
  const keyMap: { [key: string]: string } = {
    ' ': 'Space',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Enter': '⏎',
    'Escape': 'Esc',
    'Delete': 'Del',
    'Backspace': '⌫',
    'Tab': '⇥',
  };
  
  if (keyMap[keyName]) {
    keyName = keyMap[keyName];
  } else if (keyName.length === 1) {
    keyName = keyName.toUpperCase();
  }
  
  parts.push(keyName);
  
  return parts.join(isMac ? '' : '+');
}

/**
 * 快捷键帮助Hook
 */
export function useShortcutHelp() {
  const [isVisible, setIsVisible] = useState(false);
  
  const toggleHelp = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);
  
  const hideHelp = useCallback(() => {
    setIsVisible(false);
  }, []);
  
  // 监听帮助事件
  useEffect(() => {
    const handleShowHelp = () => setIsVisible(true);
    const handleToggleHelp = () => toggleHelp();
    
    window.addEventListener('app:show-help', handleShowHelp);
    window.addEventListener('app:toggle-shortcuts-hint', handleToggleHelp);
    
    return () => {
      window.removeEventListener('app:show-help', handleShowHelp);
      window.removeEventListener('app:toggle-shortcuts-hint', handleToggleHelp);
    };
  }, [toggleHelp]);
  
  return {
    isVisible,
    toggleHelp,
    hideHelp,
  };
}


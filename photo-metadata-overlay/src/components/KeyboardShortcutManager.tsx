import { useEffect } from 'react';
import { useGlobalKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface KeyboardShortcutManagerProps {
  onOpenFile: () => void;
  onSaveFile: () => void;
  onBatchProcess: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onShowPresets?: () => void;
  onShowHelp?: () => void;
  onToggleShortcutHints?: () => void;
  onResetView?: () => void;
  onFitToWindow?: () => void;
  onActualSize?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onDeleteSelected?: () => void;
  onCancel?: () => void;
  onConfirm?: () => void;
  onTogglePreview?: () => void;
}

/**
 * 键盘快捷键管理器组件
 * 处理全局键盘快捷键事件并分发到相应的处理函数
 */
export function KeyboardShortcutManager({
  onOpenFile,
  onSaveFile,
  onBatchProcess,
  onUndo,
  onRedo,
  onShowPresets,
  onShowHelp,
  onToggleShortcutHints,
  onResetView,
  onFitToWindow,
  onActualSize,
  onZoomIn,
  onZoomOut,
  onDeleteSelected,
  onCancel,
  onConfirm,
  onTogglePreview,
}: KeyboardShortcutManagerProps) {
  // 启用全局快捷键
  useGlobalKeyboardShortcuts();

  // 监听自定义事件并分发到相应的处理函数
  useEffect(() => {
    const eventHandlers = {
      'app:open-file': onOpenFile,
      'app:save': onSaveFile,
      'app:batch-process': onBatchProcess,
      'app:undo': onUndo,
      'app:redo': onRedo,
      'app:show-presets': onShowPresets,
      'app:show-help': onShowHelp,
      'app:toggle-shortcuts-hint': onToggleShortcutHints,
      'app:reset-view': onResetView,
      'app:fit-to-window': onFitToWindow,
      'app:actual-size': onActualSize,
      'app:zoom-in': onZoomIn,
      'app:zoom-out': onZoomOut,
      'app:delete-selected': onDeleteSelected,
      'app:cancel': onCancel,
      'app:confirm': onConfirm,
      'app:toggle-preview': onTogglePreview,
    };

    // 注册事件监听器
    Object.entries(eventHandlers).forEach(([eventName, handler]) => {
      if (handler) {
        window.addEventListener(eventName, handler);
      }
    });

    // 清理事件监听器
    return () => {
      Object.entries(eventHandlers).forEach(([eventName, handler]) => {
        if (handler) {
          window.removeEventListener(eventName, handler);
        }
      });
    };
  }, [
    onOpenFile,
    onSaveFile,
    onBatchProcess,
    onUndo,
    onRedo,
    onShowPresets,
    onShowHelp,
    onToggleShortcutHints,
    onResetView,
    onFitToWindow,
    onActualSize,
    onZoomIn,
    onZoomOut,
    onDeleteSelected,
    onCancel,
    onConfirm,
    onTogglePreview,
  ]);

  return null; // 这个组件不渲染任何内容
}
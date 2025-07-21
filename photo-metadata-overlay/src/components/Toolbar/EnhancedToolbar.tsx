import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FolderOpen, 
  Save, 
  Settings, 
  Layers, 
  Sparkles,
  Keyboard,
  MoreHorizontal,
  Download
} from 'lucide-react';
import { Button } from '../UI/Button';
import { UndoRedoControls } from '../UI/UndoRedoControls';
import { Tooltip } from '../UI/Tooltip';

interface EnhancedToolbarProps {
  onOpenFile: () => void;
  onSaveFile: () => void;
  onBatchProcess: () => void;
  onShowPresets?: () => void;
  onShowSettings?: () => void;
  onShowShortcuts?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  undoDescription?: string | null;
  redoDescription?: string | null;
  className?: string;
}

/**
 * 增强的工具栏组件
 * 集成了撤销重做、快捷键提示等功能
 */
export function EnhancedToolbar({
  onOpenFile,
  onSaveFile,
  onBatchProcess,
  onShowPresets,
  onShowSettings,
  onShowShortcuts,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  undoDescription,
  redoDescription,
  className = '',
}: EnhancedToolbarProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 ${className}`}
    >
      <div className="flex items-center justify-between">
        {/* 左侧主要操作 */}
        <div className="flex items-center gap-2">
          <Tooltip content="打开文件 (Ctrl+O)">
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenFile}
              icon={<FolderOpen className="w-4 h-4" />}
            >
              打开
            </Button>
          </Tooltip>

          <Tooltip content="保存/导出 (Ctrl+S)">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSaveFile}
              icon={<Save className="w-4 h-4" />}
            >
              保存
            </Button>
          </Tooltip>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

          {/* 撤销重做控件 */}
          {(onUndo || onRedo) && (
            <>
              <UndoRedoControls
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={onUndo || (() => {})}
                onRedo={onRedo || (() => {})}
                undoDescription={undoDescription}
                redoDescription={redoDescription}
                showTooltips={true}
              />
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
            </>
          )}

          <Tooltip content="批量处理 (Ctrl+B)">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBatchProcess}
              icon={<Layers className="w-4 h-4" />}
            >
              批量处理
            </Button>
          </Tooltip>

          {onShowPresets && (
            <Tooltip content="智能预设">
              <Button
                variant="ghost"
                size="sm"
                onClick={onShowPresets}
                icon={<Sparkles className="w-4 h-4" />}
              >
                预设
              </Button>
            </Tooltip>
          )}
        </div>

        {/* 右侧辅助操作 */}
        <div className="flex items-center gap-2">
          {onShowShortcuts && (
            <Tooltip content="键盘快捷键 (?)">
              <Button
                variant="ghost"
                size="sm"
                onClick={onShowShortcuts}
                icon={<Keyboard className="w-4 h-4" />}
              />
            </Tooltip>
          )}

          {onShowSettings && (
            <Tooltip content="设置">
              <Button
                variant="ghost"
                size="sm"
                onClick={onShowSettings}
                icon={<Settings className="w-4 h-4" />}
              />
            </Tooltip>
          )}

          {/* 更多菜单 */}
          <div className="relative">
            <Tooltip content="更多选项">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                icon={<MoreHorizontal className="w-4 h-4" />}
              />
            </Tooltip>

            {showMoreMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[150px]"
              >
                <button
                  onClick={() => {
                    // 触发导出事件
                    const event = new CustomEvent('app:export-settings');
                    window.dispatchEvent(event);
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  导出设置
                </button>
                
                <button
                  onClick={() => {
                    // 触发重置事件
                    const event = new CustomEvent('app:reset-settings');
                    window.dispatchEvent(event);
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  重置设置
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* 点击外部关闭更多菜单 */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMoreMenu(false)}
        />
      )}
    </motion.div>
  );
}
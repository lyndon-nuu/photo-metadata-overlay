
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, Redo2, History, X } from 'lucide-react';
import { Button } from './Button';
import { Tooltip } from './Tooltip';

interface UndoRedoControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onShowHistory?: () => void;
  undoDescription?: string | null;
  redoDescription?: string | null;
  className?: string;
  showLabels?: boolean;
  showTooltips?: boolean;
  showHistoryButton?: boolean;
}

export function UndoRedoControls({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onShowHistory,
  undoDescription,
  redoDescription,
  className = '',
  showLabels = false,
  showTooltips = true,
  showHistoryButton = false,
}: UndoRedoControlsProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Tooltip content={showTooltips ? `撤销${undoDescription ? `: ${undoDescription}` : ''}` : undefined}>
        <Button
          variant="ghost"
          size="sm"
          disabled={!canUndo}
          onClick={onUndo}
          className={`${!canUndo ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
          <Undo2 className="w-4 h-4" />
          {showLabels && <span className="ml-1">撤销</span>}
        </Button>
      </Tooltip>

      <Tooltip content={showTooltips ? `重做${redoDescription ? `: ${redoDescription}` : ''}` : undefined}>
        <Button
          variant="ghost"
          size="sm"
          disabled={!canRedo}
          onClick={onRedo}
          className={`${!canRedo ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
          <Redo2 className="w-4 h-4" />
          {showLabels && <span className="ml-1">重做</span>}
        </Button>
      </Tooltip>

      {showHistoryButton && onShowHistory && (
        <Tooltip content={showTooltips ? "查看历史记录" : undefined}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowHistory}
            className="hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <History className="w-4 h-4" />
            {showLabels && <span className="ml-1">历史</span>}
          </Button>
        </Tooltip>
      )}
    </div>
  );
}

interface HistoryPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  history: Array<{ id: string; description: string; timestamp: Date }>;
  currentIndex: number;
  onSelectHistoryItem: (index: number) => void;
}

export function HistoryPopover({
  isOpen,
  onClose,
  history,
  currentIndex,
  onSelectHistoryItem,
}: HistoryPopoverProps) {
  // 格式化时间
  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 w-64 z-50 overflow-hidden"
          >
            <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">历史记录</h3>
              <Button variant="ghost" size="xs" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {history.length > 0 ? (
                <div className="py-1">
                  {history.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => onSelectHistoryItem(index)}
                      className={`w-full text-left px-3 py-2 text-sm ${index === currentIndex ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{item.description}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          {formatTime(item.timestamp)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
                  没有历史记录
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * 历史记录项
 */
export interface HistoryItem<T = any> {
  id: string;
  timestamp: Date;
  action: string;
  data: T;
  description: string;
}

/**
 * 撤销重做Hook选项
 */
export interface UseUndoRedoOptions<T> {
  maxHistorySize?: number;
  initialState?: T;
  onStateChange?: (state: T, action: string) => void;
  enableAutoSave?: boolean;
  autoSaveKey?: string;
}

/**
 * 撤销重做Hook
 */
export function useUndoRedo<T>(options: UseUndoRedoOptions<T> = {}) {
  const {
    maxHistorySize = 50,
    initialState,
    onStateChange,
    enableAutoSave = false,
    autoSaveKey = 'undo-redo-state',
  } = options;

  // 历史记录栈
  const [history, setHistory] = useState<HistoryItem<T>[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentState, setCurrentState] = useState<T | undefined>(initialState);

  // 引用，避免闭包问题
  const historyRef = useRef(history);
  const currentIndexRef = useRef(currentIndex);
  const currentStateRef = useRef(currentState);

  // 更新引用
  useEffect(() => {
    historyRef.current = history;
    currentIndexRef.current = currentIndex;
    currentStateRef.current = currentState;
  }, [history, currentIndex, currentState]);

  // 自动保存
  useEffect(() => {
    if (enableAutoSave && currentState !== undefined) {
      try {
        localStorage.setItem(autoSaveKey, JSON.stringify({
          state: currentState,
          history: history.slice(-10), // 只保存最近10条记录
          currentIndex: Math.min(currentIndex, 9),
        }));
      } catch (error) {
        console.warn('自动保存失败:', error);
      }
    }
  }, [currentState, history, currentIndex, enableAutoSave, autoSaveKey]);

  // 加载自动保存的状态
  useEffect(() => {
    if (enableAutoSave && initialState === undefined) {
      try {
        const saved = localStorage.getItem(autoSaveKey);
        if (saved) {
          const { state, history: savedHistory, currentIndex: savedIndex } = JSON.parse(saved);
          setCurrentState(state);
          setHistory(savedHistory || []);
          setCurrentIndex(savedIndex >= 0 ? savedIndex : -1);
        }
      } catch (error) {
        console.warn('加载自动保存状态失败:', error);
      }
    }
  }, [enableAutoSave, autoSaveKey, initialState]);

  /**
   * 添加新的历史记录
   */
  const pushState = useCallback((newState: T, action: string, description?: string) => {
    const historyItem: HistoryItem<T> = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      action,
      data: newState,
      description: description || action,
    };

    setHistory(prevHistory => {
      // 如果当前不在历史记录的末尾，删除后面的记录
      const newHistory = currentIndexRef.current >= 0 
        ? prevHistory.slice(0, currentIndexRef.current + 1)
        : [];
      
      // 添加新记录
      newHistory.push(historyItem);
      
      // 限制历史记录大小
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      }
      
      return newHistory;
    });

    setCurrentIndex(prevIndex => {
      const newIndex = prevIndex >= 0 
        ? Math.min(prevIndex + 1, maxHistorySize - 1)
        : 0;
      return newIndex;
    });

    setCurrentState(newState);
    onStateChange?.(newState, action);
    
    console.log(`添加历史记录: ${action} - ${description || action}`);
  }, [maxHistorySize, onStateChange]);

  /**
   * 撤销操作
   */
  const undo = useCallback(() => {
    if (currentIndexRef.current > 0) {
      const newIndex = currentIndexRef.current - 1;
      const historyItem = historyRef.current[newIndex];
      
      setCurrentIndex(newIndex);
      setCurrentState(historyItem.data);
      onStateChange?.(historyItem.data, `undo:${historyItem.action}`);
      
      console.log(`撤销操作: ${historyItem.description}`);
      return historyItem.data;
    } else if (currentIndexRef.current === 0 && initialState !== undefined) {
      // 撤销到初始状态
      setCurrentIndex(-1);
      setCurrentState(initialState);
      onStateChange?.(initialState, 'undo:initial');
      
      console.log('撤销到初始状态');
      return initialState;
    }
    
    return currentStateRef.current;
  }, [initialState, onStateChange]);

  /**
   * 重做操作
   */
  const redo = useCallback(() => {
    if (currentIndexRef.current < historyRef.current.length - 1) {
      const newIndex = currentIndexRef.current + 1;
      const historyItem = historyRef.current[newIndex];
      
      setCurrentIndex(newIndex);
      setCurrentState(historyItem.data);
      onStateChange?.(historyItem.data, `redo:${historyItem.action}`);
      
      console.log(`重做操作: ${historyItem.description}`);
      return historyItem.data;
    }
    
    return currentStateRef.current;
  }, [onStateChange]);

  /**
   * 跳转到指定历史记录
   */
  const goToHistory = useCallback((index: number) => {
    if (index >= -1 && index < historyRef.current.length) {
      if (index === -1 && initialState !== undefined) {
        setCurrentIndex(-1);
        setCurrentState(initialState);
        onStateChange?.(initialState, 'goto:initial');
      } else if (index >= 0) {
        const historyItem = historyRef.current[index];
        setCurrentIndex(index);
        setCurrentState(historyItem.data);
        onStateChange?.(historyItem.data, `goto:${historyItem.action}`);
      }
    }
  }, [initialState, onStateChange]);

  /**
   * 清空历史记录
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
    if (initialState !== undefined) {
      setCurrentState(initialState);
      onStateChange?.(initialState, 'clear:reset');
    }
    
    console.log('清空历史记录');
  }, [initialState, onStateChange]);

  /**
   * 获取历史记录摘要
   */
  const getHistorySummary = useCallback(() => {
    return {
      total: historyRef.current.length,
      current: currentIndexRef.current,
      canUndo: currentIndexRef.current >= 0,
      canRedo: currentIndexRef.current < historyRef.current.length - 1,
      hasInitialState: initialState !== undefined,
    };
  }, [initialState]);

  /**
   * 获取当前可撤销的操作描述
   */
  const getUndoDescription = useCallback(() => {
    if (currentIndexRef.current > 0) {
      return historyRef.current[currentIndexRef.current].description;
    } else if (currentIndexRef.current === 0) {
      return '初始状态';
    }
    return null;
  }, []);

  /**
   * 获取当前可重做的操作描述
   */
  const getRedoDescription = useCallback(() => {
    if (currentIndexRef.current < historyRef.current.length - 1) {
      return historyRef.current[currentIndexRef.current + 1].description;
    }
    return null;
  }, []);

  // 监听全局撤销重做事件
  useEffect(() => {
    const handleUndo = () => undo();
    const handleRedo = () => redo();

    window.addEventListener('app:undo', handleUndo);
    window.addEventListener('app:redo', handleRedo);

    return () => {
      window.removeEventListener('app:undo', handleUndo);
      window.removeEventListener('app:redo', handleRedo);
    };
  }, [undo, redo]);

  return {
    // 状态
    currentState,
    history,
    currentIndex,
    
    // 操作
    pushState,
    undo,
    redo,
    goToHistory,
    clearHistory,
    
    // 查询
    canUndo: currentIndex >= 0,
    canRedo: currentIndex < history.length - 1,
    getHistorySummary,
    getUndoDescription,
    getRedoDescription,
  };
}

/**
 * 应用程序状态撤销重做Hook
 */
export function useAppUndoRedo() {
  return useUndoRedo({
    maxHistorySize: 50,
    enableAutoSave: true,
    autoSaveKey: 'app-undo-redo-state',
    onStateChange: (state, action) => {
      console.log(`状态变更: ${action}`, state);
    },
  });
}

/**
   * 设置撤销重做Hook
   */
export function useSettingsUndoRedo<T>(initialSettings: T) {
  return useUndoRedo<T>({
    maxHistorySize: 20,
    initialState: initialSettings,
    enableAutoSave: true,
    autoSaveKey: 'settings-undo-redo-state',
    onStateChange: (settings, action) => {
      console.log(`设置变更: ${action}`);
      // 可以在这里触发设置保存
      const event = new CustomEvent('settings:changed', { 
        detail: { settings, action } 
      });
      window.dispatchEvent(event);
    },
  });
}
import { useEffect, useRef, useCallback, useState } from 'react';
import { useSettingsStore } from '../stores';
import { OverlaySettings, FrameSettings, PhotoMetadata } from '../types';
import { storageService } from '../services/storage.service';

interface UseAutoSaveOptions {
  debounceMs?: number;
  enabled?: boolean;
  saveWorkProgress?: boolean;
}

/**
 * 工作进度数据
 */
export interface WorkProgress {
  id: string;
  timestamp: Date;
  currentPhoto: PhotoMetadata | null;
  selectedFiles: PhotoMetadata[];
  overlaySettings: OverlaySettings | null;
  frameSettings: FrameSettings | null;
  processingQueue: any[];
  viewState: {
    zoom: number;
    pan: { x: number; y: number };
    selectedFileIndex: number;
  };
  sessionDuration: number;
  lastActivity: Date;
}

/**
 * 自动保存Hook
 * 监听设置变化并自动保存到本地存储，支持工作进度保存
 */
export function useAutoSave(
  overlaySettings: OverlaySettings | null,
  frameSettings: FrameSettings | null,
  options: UseAutoSaveOptions = {}
) {
  const { debounceMs = 1000, enabled = true, saveWorkProgress = true } = options;
  const { settings } = useSettingsStore();
  
  const overlayTimerRef = useRef<NodeJS.Timeout>();
  const frameTimerRef = useRef<NodeJS.Timeout>();
  const progressTimerRef = useRef<NodeJS.Timeout>();
  const lastOverlaySettingsRef = useRef<string>('');
  const lastFrameSettingsRef = useRef<string>('');
  const sessionStartRef = useRef<Date>(new Date());
  const lastActivityRef = useRef<Date>(new Date());
  
  // 工作进度状态
  const [workProgress, setWorkProgress] = useState<WorkProgress | null>(null);
  const [isProgressLoaded, setIsProgressLoaded] = useState(false);

  // 防抖保存叠加设置
  const debouncedSaveOverlaySettings = useCallback(async (settings: OverlaySettings) => {
    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current);
    }

    overlayTimerRef.current = setTimeout(async () => {
      try {
        await storageService.saveOverlaySettings(settings);
        console.log('叠加设置已自动保存');
      } catch (error) {
        console.error('自动保存叠加设置失败:', error);
      }
    }, debounceMs);
  }, [debounceMs]);

  // 防抖保存相框设置
  const debouncedSaveFrameSettings = useCallback(async (settings: FrameSettings) => {
    if (frameTimerRef.current) {
      clearTimeout(frameTimerRef.current);
    }

    frameTimerRef.current = setTimeout(async () => {
      try {
        await storageService.saveFrameSettings(settings);
        console.log('相框设置已自动保存');
      } catch (error) {
        console.error('自动保存相框设置失败:', error);
      }
    }, debounceMs);
  }, [debounceMs]);

  // 防抖保存工作进度
  const debouncedSaveWorkProgress = useCallback(async (progress: WorkProgress) => {
    if (progressTimerRef.current) {
      clearTimeout(progressTimerRef.current);
    }

    progressTimerRef.current = setTimeout(async () => {
      try {
        await storageService.saveData('work_progress', progress);
        console.log('工作进度已自动保存');
      } catch (error) {
        console.error('自动保存工作进度失败:', error);
      }
    }, debounceMs * 2); // 工作进度保存间隔稍长
  }, [debounceMs]);

  // 更新活动时间
  const updateActivity = useCallback(() => {
    lastActivityRef.current = new Date();
  }, []);

  // 创建工作进度快照
  const createProgressSnapshot = useCallback((
    currentPhoto: PhotoMetadata | null = null,
    selectedFiles: PhotoMetadata[] = [],
    processingQueue: any[] = [],
    viewState: WorkProgress['viewState'] = { zoom: 1, pan: { x: 0, y: 0 }, selectedFileIndex: 0 }
  ): WorkProgress => {
    const now = new Date();
    const sessionDuration = now.getTime() - sessionStartRef.current.getTime();

    return {
      id: `progress_${Date.now()}`,
      timestamp: now,
      currentPhoto,
      selectedFiles,
      overlaySettings,
      frameSettings,
      processingQueue,
      viewState,
      sessionDuration,
      lastActivity: lastActivityRef.current,
    };
  }, [overlaySettings, frameSettings]);

  // 保存工作进度
  const saveWorkProgressData = useCallback((
    currentPhoto?: PhotoMetadata | null,
    selectedFiles?: PhotoMetadata[],
    processingQueue?: any[],
    viewState?: WorkProgress['viewState']
  ) => {
    if (!saveWorkProgress || !enabled || !settings.autoSave) return;

    updateActivity();
    const progress = createProgressSnapshot(currentPhoto, selectedFiles, processingQueue, viewState);
    setWorkProgress(progress);
    debouncedSaveWorkProgress(progress);
  }, [saveWorkProgress, enabled, settings.autoSave, updateActivity, createProgressSnapshot, debouncedSaveWorkProgress]);

  // 加载工作进度
  const loadWorkProgress = useCallback(async (): Promise<WorkProgress | null> => {
    try {
      const progress = await storageService.loadData('work_progress', null);
      if (progress) {
        // 验证进度数据的有效性
        const progressAge = Date.now() - new Date(progress.timestamp).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24小时

        if (progressAge < maxAge) {
          setWorkProgress(progress);
          console.log('工作进度已加载');
          return progress;
        } else {
          console.log('工作进度已过期，忽略');
          await clearWorkProgress();
        }
      }
    } catch (error) {
      console.error('加载工作进度失败:', error);
    }
    return null;
  }, []);

  // 清除工作进度
  const clearWorkProgress = useCallback(async () => {
    try {
      await storageService.removeData('work_progress');
      setWorkProgress(null);
      console.log('工作进度已清除');
    } catch (error) {
      console.error('清除工作进度失败:', error);
    }
  }, []);

  // 恢复工作进度
  const restoreWorkProgress = useCallback(async (): Promise<boolean> => {
    const progress = await loadWorkProgress();
    if (progress) {
      // 触发工作进度恢复事件
      const event = new CustomEvent('app:restore-progress', {
        detail: progress
      });
      window.dispatchEvent(event);
      return true;
    }
    return false;
  }, [loadWorkProgress]);

  // 监听叠加设置变化
  useEffect(() => {
    if (!enabled || !settings.autoSave || !overlaySettings) return;

    const currentSettings = JSON.stringify(overlaySettings);
    if (currentSettings !== lastOverlaySettingsRef.current) {
      lastOverlaySettingsRef.current = currentSettings;
      debouncedSaveOverlaySettings(overlaySettings);
    }
  }, [overlaySettings, enabled, settings.autoSave, debouncedSaveOverlaySettings]);

  // 监听相框设置变化
  useEffect(() => {
    if (!enabled || !settings.autoSave || !frameSettings) return;

    const currentSettings = JSON.stringify(frameSettings);
    if (currentSettings !== lastFrameSettingsRef.current) {
      lastFrameSettingsRef.current = currentSettings;
      debouncedSaveFrameSettings(frameSettings);
    }
  }, [frameSettings, enabled, settings.autoSave, debouncedSaveFrameSettings]);

  // 初始化时加载工作进度
  useEffect(() => {
    if (saveWorkProgress && enabled && !isProgressLoaded) {
      loadWorkProgress().then(() => {
        setIsProgressLoaded(true);
      });
    }
  }, [saveWorkProgress, enabled, isProgressLoaded, loadWorkProgress]);

  // 监听页面卸载，保存最终进度
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (saveWorkProgress && workProgress) {
        // 同步保存最终进度
        try {
          localStorage.setItem('work_progress_final', JSON.stringify(workProgress));
        } catch (error) {
          console.error('保存最终工作进度失败:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveWorkProgress, workProgress]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
      }
      if (frameTimerRef.current) {
        clearTimeout(frameTimerRef.current);
      }
      if (progressTimerRef.current) {
        clearTimeout(progressTimerRef.current);
      }
    };
  }, []);

  // 手动保存函数
  const saveNow = useCallback(async () => {
    try {
      const promises: Promise<void>[] = [];
      
      if (overlaySettings) {
        promises.push(storageService.saveOverlaySettings(overlaySettings));
      }
      
      if (frameSettings) {
        promises.push(storageService.saveFrameSettings(frameSettings));
      }

      await Promise.all(promises);
      console.log('设置已手动保存');
    } catch (error) {
      console.error('手动保存设置失败:', error);
      throw error;
    }
  }, [overlaySettings, frameSettings]);

  return {
    // 基础功能
    saveNow,
    isAutoSaveEnabled: enabled && settings.autoSave,
    
    // 工作进度功能
    workProgress,
    isProgressLoaded,
    saveWorkProgress: saveWorkProgressData,
    loadWorkProgress,
    clearWorkProgress,
    restoreWorkProgress,
    updateActivity,
  };
}

export default useAutoSave;
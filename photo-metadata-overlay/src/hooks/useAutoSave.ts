import { useEffect, useRef, useCallback } from 'react';
import { useSettingsStore } from '../stores';
import { OverlaySettings, FrameSettings } from '../types';
import { storageService } from '../services/storage.service';

interface UseAutoSaveOptions {
  debounceMs?: number;
  enabled?: boolean;
}

/**
 * 自动保存Hook
 * 监听设置变化并自动保存到本地存储
 */
export function useAutoSave(
  overlaySettings: OverlaySettings | null,
  frameSettings: FrameSettings | null,
  options: UseAutoSaveOptions = {}
) {
  const { debounceMs = 1000, enabled = true } = options;
  const { settings } = useSettingsStore();
  
  const overlayTimerRef = useRef<NodeJS.Timeout>();
  const frameTimerRef = useRef<NodeJS.Timeout>();
  const lastOverlaySettingsRef = useRef<string>('');
  const lastFrameSettingsRef = useRef<string>('');

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

  // 清理定时器
  useEffect(() => {
    return () => {
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
      }
      if (frameTimerRef.current) {
        clearTimeout(frameTimerRef.current);
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
    saveNow,
    isAutoSaveEnabled: enabled && settings.autoSave,
  };
}

export default useAutoSave;
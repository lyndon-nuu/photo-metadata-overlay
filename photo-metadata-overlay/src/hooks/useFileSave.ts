import { useState, useCallback } from 'react';
import { tauriAPI } from '../services/tauri-api.service';
import { BackendPhotoMetadata, BackendOverlaySettings, BackendFrameSettings } from '../types';
import { useToast } from './useToast';

interface UseFileSaveOptions {
  onSaveStart?: () => void;
  onSaveSuccess?: (savedPath: string) => void;
  onSaveError?: (error: string) => void;
  onSaveCancel?: () => void;
}

interface UseFileSaveReturn {
  isSaving: boolean;
  saveImage: (
    inputPath: string,
    metadata: BackendPhotoMetadata,
    overlaySettings: BackendOverlaySettings,
    frameSettings: BackendFrameSettings,
    quality?: number
  ) => Promise<string | null>;
  lastSavedPath: string | null;
  error: string | null;
}

/**
 * 文件保存Hook
 * 提供带文件保存对话框的图片保存功能
 */
export function useFileSave(options: UseFileSaveOptions = {}): UseFileSaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedPath, setLastSavedPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError, info } = useToast();

  const saveImage = useCallback(async (
    inputPath: string,
    metadata: BackendPhotoMetadata,
    overlaySettings: BackendOverlaySettings,
    frameSettings: BackendFrameSettings,
    quality: number = 95
  ): Promise<string | null> => {
    if (isSaving) {
      console.warn('⚠️ 保存操作正在进行中，请稍候...');
      return null;
    }

    setIsSaving(true);
    setError(null);
    options.onSaveStart?.();

    try {
      console.log('🔄 开始保存图片...', {
        inputPath,
        quality,
        overlayEnabled: Object.values(overlaySettings.display_items).some(Boolean),
        frameEnabled: frameSettings.enabled,
      });

      // 调用后端API保存图片（会弹出文件保存对话框）
      const savedPath = await tauriAPI.saveProcessedImage(
        inputPath,
        metadata,
        overlaySettings,
        frameSettings,
        quality
      );

      console.log('✅ 图片保存成功:', savedPath);
      
      setLastSavedPath(savedPath);
      options.onSaveSuccess?.(savedPath);
      
      // 显示成功提示
      success('保存成功', `图片已保存到: ${savedPath}`, { duration: 5000 });

      return savedPath;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('❌ 保存图片失败:', errorMessage);
      
      setError(errorMessage);

      // 处理用户取消的情况
      if (errorMessage.includes('用户取消')) {
        console.log('ℹ️ 用户取消了保存操作');
        options.onSaveCancel?.();
        
        info('保存取消', '保存操作已取消', { duration: 3000 });
      } else {
        options.onSaveError?.(errorMessage);
        
        showError('保存失败', errorMessage);
      }

      return null;

    } finally {
      setIsSaving(false);
    }
  }, [isSaving, options, success, showError, info]);

  return {
    isSaving,
    saveImage,
    lastSavedPath,
    error,
  };
}

export default useFileSave;
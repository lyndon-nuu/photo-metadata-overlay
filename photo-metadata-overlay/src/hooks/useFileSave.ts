import { useState, useCallback } from 'react';
import { PhotoMetadata, OverlaySettings, FrameSettings } from '../types';
import { imageProcessingService } from '../services/image-processing.service';
import { useToast } from './useToast';
import { save } from '@tauri-apps/plugin-dialog';

interface UseFileSaveOptions {
  onSaveStart?: () => void;
  onSaveSuccess?: (savedPath: string) => void;
  onSaveError?: (error: string) => void;
  onSaveCancel?: () => void;
}

interface UseFileSaveReturn {
  isSaving: boolean;
  saveImage: (
    file: File,
    metadata: PhotoMetadata,
    overlaySettings: OverlaySettings,
    frameSettings: FrameSettings,
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
    file: File,
    metadata: PhotoMetadata,
    overlaySettings: OverlaySettings,
    frameSettings: FrameSettings,
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
      console.log('🔄 开始纯前端处理并保存图片...', {
        fileName: file.name,
        quality,
        overlayEnabled: Object.values(overlaySettings.displayItems).some(Boolean),
        frameEnabled: frameSettings.enabled,
      });

      // 第一步：使用与预览完全相同的前端处理逻辑
      console.log('🎨 开始纯前端高质量图像处理...');

      // 1. 加载原始图像（保持原始分辨率，无损质量）
      const image = await imageProcessingService.loadImage(file);
      console.log(`📸 图像加载完成: ${image.naturalWidth}x${image.naturalHeight}`);

      // 2. 应用元数据叠加（高质量渲染）
      const overlaidCanvas = await imageProcessingService.applyOverlay(
        image,
        metadata,
        overlaySettings
      );
      console.log('✨ 元数据叠加完成');

      // 3. 应用相框效果（如果启用）
      const finalCanvas = await imageProcessingService.applyFrame(
        overlaidCanvas,
        frameSettings
      );
      console.log('🖼️ 相框效果完成');

      // 4. 导出高质量图像（无损质量）
      const originalFormat = file.type.includes('png') ? 'png' : 'jpeg';
      const exportQuality = 1.0; // PNG和JPEG都使用100%无损质量
      const blob = await imageProcessingService.exportImage(
        finalCanvas,
        originalFormat,
        exportQuality
      );

      console.log(`✅ 前端处理完成，格式: ${originalFormat}, 质量: ${exportQuality}, 大小: ${(blob.size / 1024).toFixed(1)}KB`);

      // 第二步：检测运行环境并保存文件
      const fileExtension = originalFormat === 'png' ? 'png' : 'jpg';
      const defaultFileName = `${file.name.replace(/\.[^/.]+$/, '')}_processed.${fileExtension}`;

      // 检测是否在Tauri环境中
      const isTauriEnv = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;
      
      if (isTauriEnv) {
        // Tauri环境：使用文件保存对话框
        const savePath = await save({
          title: '保存处理后的图片',
          defaultPath: defaultFileName,
          filters: [
            {
              name: 'JPEG图片',
              extensions: ['jpg', 'jpeg']
            },
            {
              name: 'PNG图片', 
              extensions: ['png']
            },
            {
              name: '所有图片',
              extensions: ['jpg', 'jpeg', 'png']
            }
          ]
        });

        if (!savePath) {
          console.log('ℹ️ 用户取消了保存操作');
          options.onSaveCancel?.();
          info('保存取消', '保存操作已取消', { duration: 3000 });
          return null;
        }

        // 将Blob写入选择的文件路径
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        const { writeFile } = await import('@tauri-apps/plugin-fs');
        await writeFile(savePath, uint8Array);
        
        console.log('✅ 图片保存成功:', savePath);
        
        setLastSavedPath(savePath);
        options.onSaveSuccess?.(savePath);
        
        // 显示成功提示
        success('保存成功', `图片已保存到: ${savePath}`, { duration: 5000 });
        
        return savePath;
      } else {
        // 浏览器环境：使用浏览器下载
        console.log('🌐 浏览器环境，使用浏览器下载');
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = defaultFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        const downloadPath = `Downloads/${defaultFileName}`;
        
        console.log('✅ 图片保存成功:', downloadPath);
        
        setLastSavedPath(downloadPath);
        options.onSaveSuccess?.(downloadPath);
        
        // 显示成功提示
        success('保存成功', `图片已保存到: ${downloadPath}`, { duration: 5000 });
        
        return downloadPath;
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('❌ 保存图片失败:', errorMessage);
      
      setError(errorMessage);
      options.onSaveError?.(errorMessage);
      
      showError('保存失败', errorMessage);

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
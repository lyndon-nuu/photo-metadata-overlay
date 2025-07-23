import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { PhotoMetadata, OverlaySettings, FrameSettings } from '../types';
import { imageProcessingService } from '../services/image-processing.service';

interface UseImagePreviewOptions {
  debounceMs?: number;
  enableCache?: boolean;
  maxCacheSize?: number;
}

interface PreviewState {
  isProcessing: boolean;
  error: string | null;
  processedBlob: Blob | null;
  canvas: HTMLCanvasElement | null;
}

/**
 * 图像预览Hook
 * 提供防抖处理、缓存优化和性能监控
 */
export function useImagePreview(
  photo: PhotoMetadata | null,
  file: File | null,
  overlaySettings: OverlaySettings,
  frameSettings: FrameSettings,
  options: UseImagePreviewOptions = {}
) {
  const {
    debounceMs: _debounceMs = 300, // TODO: 实现防抖功能
    enableCache = true,
    maxCacheSize = 10,
  } = options;

  const [state, setState] = useState<PreviewState>({
    isProcessing: false,
    error: null,
    processedBlob: null,
    canvas: null,
  });

  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const cacheRef = useRef<Map<string, { blob: Blob; canvas: HTMLCanvasElement }>>(new Map());
  const processingRef = useRef<boolean>(false);

  // 生成设置的哈希值用于缓存键
  const settingsHash = useMemo(() => {
    if (!photo || !file) return '';
    
    // 创建详细的缓存键，确保设置变化时能正确识别
    const key = {
      fileName: photo.fileName,
      fileSize: photo.fileSize,
      lastModified: file.lastModified,
      // 序列化所有设置以确保变化被检测到
      overlay: JSON.stringify(overlaySettings),
      frame: JSON.stringify(frameSettings)
      // 移除timestamp，避免破坏缓存机制
    };
    
    // 使用更可靠的哈希生成方法
    const keyString = JSON.stringify(key);
    let hash = 0;
    for (let i = 0; i < keyString.length; i++) {
      const char = keyString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    return `preview_${Math.abs(hash).toString(36)}`;
  }, [photo, file, overlaySettings, frameSettings]);

  // 清理缓存
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // 处理图像
  const processImage = useCallback(async () => {
    if (!photo || !file || processingRef.current) return;

    // 在函数内部重新计算settingsHash，避免依赖循环
    const currentSettingsHash = (() => {
      const key = {
        fileName: photo.fileName,
        fileSize: photo.fileSize,
        lastModified: file.lastModified,
        overlay: JSON.stringify(overlaySettings),
        frame: JSON.stringify(frameSettings)
      };
      
      const keyString = JSON.stringify(key);
      let hash = 0;
      for (let i = 0; i < keyString.length; i++) {
        const char = keyString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      return `preview_${Math.abs(hash).toString(36)}`;
    })();

    console.log('🔄 开始处理图像预览:', { 
      fileName: photo.fileName, 
      settingsHash: currentSettingsHash.slice(0, 8) + '...',
      cacheHit: enableCache && cacheRef.current.has(currentSettingsHash)
    });

    // 检查缓存
    if (enableCache && cacheRef.current.has(currentSettingsHash)) {
      console.log('✅ 使用缓存的预览结果');
      const cached = cacheRef.current.get(currentSettingsHash)!;
      setState(prev => ({
        ...prev,
        processedBlob: cached.blob,
        canvas: cached.canvas,
        error: null,
        isProcessing: false,
      }));
      return;
    }

    console.log('🎨 开始重新处理图像...');
    processingRef.current = true;
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const startTime = performance.now();

      // 使用后端API生成预览，确保与保存结果100%一致
      const { tauriAPI } = await import('../services/tauri-api.service');
      
      try {
        // 1. 将File对象写入临时文件
        const tempPath = `/tmp/temp_preview_${Date.now()}_${file.name}`;
        
        // 将文件内容写入临时路径
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // 使用Tauri的fs API写入文件
        const { writeFile } = await import('@tauri-apps/plugin-fs');
        await writeFile(tempPath, uint8Array);
        
        console.log('✅ 临时文件写入成功:', tempPath);
        
        // 2. 转换设置格式
        const backendOverlaySettings = tauriAPI.convertToBackendOverlaySettings(overlaySettings);
        const backendFrameSettings = tauriAPI.convertToBackendFrameSettings(frameSettings);
        
        // 3. 调用后端预览API
        const previewSettings = {
          max_width: 1200, // 预览使用较高分辨率
          max_height: 800,
          overlay_settings: backendOverlaySettings,
          frame_settings: backendFrameSettings,
        };
        
        console.log('🔄 调用后端预览API...');
        const previewBytes = await tauriAPI.generatePreview(tempPath, previewSettings);
        
        // 4. 将字节数组转换为Blob
        const blob = new Blob([new Uint8Array(previewBytes)], { type: 'image/png' });
        
        console.log('✅ 后端预览生成成功');
        
        // 5. 清理临时文件
        try {
          const { removeFile } = await import('@tauri-apps/plugin-fs');
          await removeFile(tempPath);
        } catch (cleanupError) {
          console.warn('临时文件清理失败:', cleanupError);
        }
        
        // 6. 创建Canvas用于缓存（可选）
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const img = new Image();
          await new Promise((resolve) => {
            img.onload = () => {
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              ctx.drawImage(img, 0, 0);
              resolve(void 0);
            };
            img.src = URL.createObjectURL(blob);
          });
        }
        
        const endTime = performance.now();
        console.log(`✅ 后端预览处理完成，耗时: ${(endTime - startTime).toFixed(2)}ms`);

        // 缓存结果
        if (enableCache) {
          // 如果缓存已满，删除最旧的条目
          if (cacheRef.current.size >= maxCacheSize) {
            const firstKey = cacheRef.current.keys().next().value;
            if (firstKey) {
              cacheRef.current.delete(firstKey);
            }
          }
          
          cacheRef.current.set(currentSettingsHash, {
            blob,
            canvas,
          });
          console.log('💾 后端预览结果已缓存');
        }

        setState(prev => ({
          ...prev,
          processedBlob: blob,
          canvas,
          error: null,
        }));
        
      } catch (backendError) {
        console.warn('⚠️ 后端预览失败，回退到前端处理:', backendError);
        
        // 回退到前端处理
        const image = await imageProcessingService.loadImage(file);
        const overlaidCanvas = await imageProcessingService.applyOverlay(image, photo, overlaySettings);
        const framedCanvas = await imageProcessingService.applyFrame(overlaidCanvas, frameSettings);
        const originalFormat = file.type.includes('png') ? 'png' : 'jpeg';
        const quality = originalFormat === 'png' ? 1.0 : 0.95;
        const blob = await imageProcessingService.exportImage(framedCanvas, originalFormat, quality);
        
        const endTime = performance.now();
        console.log(`✅ 前端预览处理完成，耗时: ${(endTime - startTime).toFixed(2)}ms`);

        // 缓存结果
        if (enableCache) {
          // 如果缓存已满，删除最旧的条目
          if (cacheRef.current.size >= maxCacheSize) {
            const firstKey = cacheRef.current.keys().next().value;
            if (firstKey) {
              cacheRef.current.delete(firstKey);
            }
          }
          
          cacheRef.current.set(currentSettingsHash, {
            blob,
            canvas: framedCanvas,
          });
          console.log('💾 前端预览结果已缓存');
        }

        setState(prev => ({
          ...prev,
          processedBlob: blob,
          canvas: framedCanvas,
          error: null,
        }));
      }

    } catch (err) {
      console.error('❌ 图像处理失败:', err);
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : '图像处理失败',
      }));
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
      processingRef.current = false;
    }
  }, [photo, file, overlaySettings, frameSettings, enableCache, maxCacheSize]);



  // 立即处理（跳过防抖）
  const processImageImmediately = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    processImage();
  }, [processImage]);

  // 强制刷新预览（跳过缓存）
  const forceRefresh = useCallback(() => {
    if (!photo || !file) return;
    
    // 清除当前缓存项
    if (settingsHash && cacheRef.current.has(settingsHash)) {
      cacheRef.current.delete(settingsHash);
    }
    
    // 立即处理
    processImage();
  }, [photo, file, settingsHash, processImage]);

  // 当设置变化时触发防抖处理
  useEffect(() => {
    if (photo && file) {
      console.log('⚡ 设置变化，触发预览更新:', {
        fileName: photo.fileName,
        settingsHash: settingsHash.slice(0, 8) + '...'
      });
      
      // 清除之前的防抖定时器
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // 立即显示处理状态
      setState(prev => ({ ...prev, isProcessing: true, error: null }));
      
      // 使用较短的防抖时间以提供更好的响应性
      const delay = 100; // 减少延迟时间，提高响应性
      
      debounceTimerRef.current = setTimeout(() => {
        processImage();
      }, delay);
    } else {
      setState({
        isProcessing: false,
        error: null,
        processedBlob: null,
        canvas: null,
      });
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [photo, file, overlaySettings, frameSettings]); // 直接依赖设置对象，确保变化被检测到

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    ...state,
    processImage: processImageImmediately,
    forceRefresh,
    clearCache,
    cacheSize: cacheRef.current.size,
  };
}

export default useImagePreview;
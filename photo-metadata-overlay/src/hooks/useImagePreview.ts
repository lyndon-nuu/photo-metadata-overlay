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

      console.log('🎨 开始纯前端高质量图像处理...');

      // 1. 加载原始图像（保持原始分辨率，无损质量）
      const image = await imageProcessingService.loadImage(file);
      console.log(`📸 图像加载完成: ${image.naturalWidth}x${image.naturalHeight}`);

      // 2. 应用元数据叠加（高质量渲染）
      const overlaidCanvas = await imageProcessingService.applyOverlay(
        image,
        photo,
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
      const quality = 1.0; // PNG和JPEG都使用100%无损质量
      const blob = await imageProcessingService.exportImage(
        finalCanvas,
        originalFormat,
        quality
      );

      const endTime = performance.now();
      console.log(`✅ 纯前端处理完成，耗时: ${(endTime - startTime).toFixed(2)}ms`);
      console.log(`📊 输出格式: ${originalFormat}, 质量: ${quality}, 大小: ${(blob.size / 1024).toFixed(1)}KB`);

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
          canvas: finalCanvas,
        });
        console.log('💾 前端处理结果已缓存');
      }

      setState(prev => ({
        ...prev,
        processedBlob: blob,
        canvas: finalCanvas,
        error: null,
      }));
        
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
      
      // 使用更长的防抖时间，减少频繁调用后端API
      const delay = 500; // 增加防抖时间，避免用户快速调整时频繁调用
      
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
  }, [photo, file, settingsHash]); // 使用settingsHash确保所有设置变化都被检测到

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
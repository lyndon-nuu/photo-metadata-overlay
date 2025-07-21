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
    debounceMs = 300,
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
    
    const key = {
      fileName: photo.fileName,
      fileSize: photo.fileSize,
      overlaySettings,
      frameSettings,
    };
    
    return btoa(JSON.stringify(key)).slice(0, 32);
  }, [photo, file, overlaySettings, frameSettings]);

  // 清理缓存
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // 处理图像
  const processImage = useCallback(async () => {
    if (!photo || !file || processingRef.current) return;

    // 检查缓存
    if (enableCache && cacheRef.current.has(settingsHash)) {
      const cached = cacheRef.current.get(settingsHash)!;
      setState(prev => ({
        ...prev,
        processedBlob: cached.blob,
        canvas: cached.canvas,
        error: null,
      }));
      return;
    }

    processingRef.current = true;
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const startTime = performance.now();

      // 1. 加载原始图像
      const image = await imageProcessingService.loadImage(file);

      // 2. 应用元数据叠加
      const overlaidCanvas = await imageProcessingService.applyOverlay(
        image,
        photo,
        overlaySettings
      );

      // 3. 应用相框效果
      const framedCanvas = await imageProcessingService.applyFrame(
        overlaidCanvas,
        frameSettings
      );

      // 4. 导出处理后的图像
      const blob = await imageProcessingService.exportImage(
        framedCanvas,
        'jpeg',
        0.9
      );

      const endTime = performance.now();
      console.log(`图像处理耗时: ${(endTime - startTime).toFixed(2)}ms`);

      // 缓存结果
      if (enableCache) {
        // 如果缓存已满，删除最旧的条目
        if (cacheRef.current.size >= maxCacheSize) {
          const firstKey = cacheRef.current.keys().next().value;
          if (firstKey) {
            cacheRef.current.delete(firstKey);
          }
        }
        
        cacheRef.current.set(settingsHash, {
          blob,
          canvas: framedCanvas,
        });
      }

      setState(prev => ({
        ...prev,
        processedBlob: blob,
        canvas: framedCanvas,
        error: null,
      }));

    } catch (err) {
      console.error('图像处理失败:', err);
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : '图像处理失败',
      }));
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
      processingRef.current = false;
    }
  }, [photo, file, overlaySettings, frameSettings, settingsHash, enableCache, maxCacheSize]);

  // 防抖处理
  const debouncedProcessImage = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      processImage();
    }, debounceMs);
  }, [processImage, debounceMs]);

  // 立即处理（跳过防抖）
  const processImageImmediately = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    processImage();
  }, [processImage]);

  // 当设置变化时触发防抖处理
  useEffect(() => {
    if (photo && file) {
      debouncedProcessImage();
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
  }, [photo, file, debouncedProcessImage]);

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
    clearCache,
    cacheSize: cacheRef.current.size,
  };
}

export default useImagePreview;
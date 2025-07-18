import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';
import { PhotoMetadata, OverlaySettings, FrameSettings } from '../../types';
import { cn } from '../../utils/cn';
import { Button } from '../UI/Button';
import { useImagePreview } from '../../hooks/useImagePreview';

interface ImagePreviewProps {
  photo: PhotoMetadata | null;
  file: File | null;
  overlaySettings: OverlaySettings;
  frameSettings: FrameSettings;
  className?: string;
  onProcessingComplete?: (blob: Blob) => void;
}

interface ViewportState {
  zoom: number;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
  dragStart: { x: number; y: number };
}

interface PerformanceMetrics {
  renderTime: number;
  cacheHitRate: number;
  memoryUsage: number;
}

/**
 * 实时预览组件
 * 支持图像处理预览、缩放、平移等功能
 */
export const ImagePreview: React.FC<ImagePreviewProps> = ({
  photo,
  file,
  overlaySettings,
  frameSettings,
  className,
  onProcessingComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 使用优化的预览Hook
  const { 
    isProcessing, 
    error, 
    processedBlob, 
    canvas: processedCanvas,
    cacheSize 
  } = useImagePreview(photo, file, overlaySettings, frameSettings, {
    debounceMs: 300,
    enableCache: true,
    maxCacheSize: 10,
  });
  
  // 视口状态
  const [viewport, setViewport] = useState<ViewportState>({
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
  });

  // 性能监控状态
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
  });

  // 渲染性能监控
  const renderStartTimeRef = useRef<number>(0);

  // 当处理完成时更新Canvas显示
  useEffect(() => {
    if (processedCanvas && canvasRef.current) {
      renderStartTimeRef.current = performance.now();
      
      const previewCtx = canvasRef.current.getContext('2d');
      if (previewCtx) {
        canvasRef.current.width = processedCanvas.width;
        canvasRef.current.height = processedCanvas.height;
        previewCtx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
        previewCtx.drawImage(processedCanvas, 0, 0);
        
        // 更新性能指标
        const renderTime = performance.now() - renderStartTimeRef.current;
        setPerformanceMetrics(prev => ({
          ...prev,
          renderTime,
          cacheHitRate: cacheSize > 0 ? (cacheSize / 10) * 100 : 0,
          memoryUsage: processedCanvas.width * processedCanvas.height * 4 / (1024 * 1024), // MB
        }));
      }
    }
  }, [processedCanvas, cacheSize]);

  // 通知父组件处理完成
  useEffect(() => {
    if (processedBlob) {
      onProcessingComplete?.(processedBlob);
    }
  }, [processedBlob, onProcessingComplete]);

  // 缩放控制
  const handleZoom = useCallback((delta: number) => {
    setViewport(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(5, prev.zoom + delta)),
    }));
  }, []);

  // 重置视图
  const resetView = useCallback(() => {
    setViewport({
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      isDragging: false,
      dragStart: { x: 0, y: 0 },
    });
  }, []);

  // 适应窗口
  const fitToWindow = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    const scaleX = (containerRect.width - 40) / canvas.width;
    const scaleY = (containerRect.height - 40) / canvas.height;
    const scale = Math.min(scaleX, scaleY, 1);

    setViewport({
      zoom: scale,
      offsetX: 0,
      offsetY: 0,
      isDragging: false,
      dragStart: { x: 0, y: 0 },
    });
  }, []);

  // 鼠标事件处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // 左键
      setViewport(prev => ({
        ...prev,
        isDragging: true,
        dragStart: { x: e.clientX - prev.offsetX, y: e.clientY - prev.offsetY },
      }));
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (viewport.isDragging) {
      setViewport(prev => ({
        ...prev,
        offsetX: e.clientX - prev.dragStart.x,
        offsetY: e.clientY - prev.dragStart.y,
      }));
    }
  }, [viewport.isDragging]);

  const handleMouseUp = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      isDragging: false,
    }));
  }, []);

  // 滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(delta);
  }, [handleZoom]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;

      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault();
          handleZoom(0.1);
          break;
        case '-':
          e.preventDefault();
          handleZoom(-0.1);
          break;
        case '0':
          e.preventDefault();
          resetView();
          break;
        case 'f':
          e.preventDefault();
          fitToWindow();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoom, resetView, fitToWindow]);

  // 初始化时适应窗口
  useEffect(() => {
    if (photo && file) {
      setTimeout(fitToWindow, 100);
    }
  }, [photo, file, fitToWindow]);

  if (!photo || !file) {
    return (
      <div className={cn(
        "flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600",
        className
      )}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            选择图片开始预览
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            拖拽图片文件到此处或使用文件选择器
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700", className)}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            实时预览
          </h3>
          {isProcessing && (
            <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>处理中...</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom(-0.1)}
            disabled={viewport.zoom <= 0.1}
            icon={<ZoomOut className="w-4 h-4" />}
          >
            缩小
          </Button>
          
          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
            {Math.round(viewport.zoom * 100)}%
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom(0.1)}
            disabled={viewport.zoom >= 5}
            icon={<ZoomIn className="w-4 h-4" />}
          >
            放大
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={resetView}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            重置
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fitToWindow}
            icon={<Maximize2 className="w-4 h-4" />}
          >
            适应
          </Button>
        </div>
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* 预览区域 */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden relative bg-gray-50 dark:bg-gray-900"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: viewport.isDragging ? 'grabbing' : 'grab' }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${viewport.offsetX}px, ${viewport.offsetY}px) scale(${viewport.zoom})`,
            transformOrigin: 'center',
            transition: viewport.isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          <canvas
            ref={canvasRef}
            className="max-w-none shadow-lg"
            style={{
              imageRendering: viewport.zoom > 1 ? 'pixelated' : 'auto',
            }}
          />
        </div>

        {/* 缩放提示 */}
        <div className="absolute bottom-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-xs">
          使用滚轮缩放 | 拖拽平移 | 快捷键: +/- 缩放, 0 重置, F 适应
        </div>
      </div>

      {/* 状态栏 */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>文件: {photo.fileName}</span>
            <span>尺寸: {photo.dimensions.width} × {photo.dimensions.height}</span>
            <span>大小: {(photo.fileSize / 1024).toFixed(1)} KB</span>
            {performanceMetrics.renderTime > 0 && (
              <span>渲染: {performanceMetrics.renderTime.toFixed(1)}ms</span>
            )}
            {cacheSize > 0 && (
              <span>缓存: {cacheSize}/10</span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {performanceMetrics.memoryUsage > 0 && (
              <span>内存: {performanceMetrics.memoryUsage.toFixed(1)}MB</span>
            )}
            {processedBlob && (
              <div className="flex items-center space-x-2">
                <span>处理完成</span>
                <div className="w-2 h-2 bg-green-500 rounded-full" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePreview;
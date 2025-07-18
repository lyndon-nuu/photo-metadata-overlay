import React, { useState, useCallback, useRef } from 'react';
import { Download, Settings, Image as ImageIcon, Loader2 } from 'lucide-react';
import { PhotoMetadata, OverlaySettings, FrameSettings } from '../../types';
import { imageProcessingService } from '../../services/image-processing.service';
import { DEFAULT_OVERLAY_SETTINGS, DEFAULT_FRAME_SETTINGS } from '../../constants/design-tokens';

interface ImageProcessorProps {
  photo: PhotoMetadata;
  file: File;
  overlaySettings?: OverlaySettings;
  frameSettings?: FrameSettings;
  onProcessingComplete?: (blob: Blob) => void;
  className?: string;
}

export const ImageProcessor: React.FC<ImageProcessorProps> = ({
  photo,
  file,
  overlaySettings = DEFAULT_OVERLAY_SETTINGS,
  frameSettings = DEFAULT_FRAME_SETTINGS,
  onProcessingComplete,
  className = '',
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 处理图像
  const processImage = useCallback(async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
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

      // 5. 创建预览URL
      const url = URL.createObjectURL(blob);
      setProcessedImageUrl(url);

      // 6. 通知父组件处理完成
      onProcessingComplete?.(blob);

    } catch (err) {
      console.error('图像处理失败:', err);
      setError(err instanceof Error ? err.message : '图像处理失败');
    } finally {
      setIsProcessing(false);
    }
  }, [file, photo, overlaySettings, frameSettings, isProcessing, onProcessingComplete]);

  // 下载处理后的图像
  const downloadImage = useCallback(() => {
    if (!processedImageUrl) return;

    const link = document.createElement('a');
    link.href = processedImageUrl;
    link.download = `processed_${photo.fileName}`;
    link.click();
  }, [processedImageUrl, photo.fileName]);

  // 清理URL
  React.useEffect(() => {
    return () => {
      if (processedImageUrl) {
        URL.revokeObjectURL(processedImageUrl);
      }
    };
  }, [processedImageUrl]);

  return (
    <div className={`image-processor ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ImageIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  图像处理
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {photo.fileName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={processImage}
                disabled={isProcessing}
                className="
                  inline-flex items-center px-4 py-2 border border-transparent
                  rounded-md shadow-sm text-sm font-medium text-white
                  bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2
                  focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50
                  disabled:cursor-not-allowed transition-colors duration-200
                "
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4 mr-2" />
                    处理图像
                  </>
                )}
              </button>

              {processedImageUrl && (
                <button
                  onClick={downloadImage}
                  className="
                    inline-flex items-center px-4 py-2 border border-gray-300
                    dark:border-gray-600 rounded-md shadow-sm text-sm font-medium
                    text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800
                    hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none
                    focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                    transition-colors duration-200
                  "
                >
                  <Download className="w-4 h-4 mr-2" />
                  下载
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-4">
          {/* 错误信息 */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    处理失败
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 图像预览 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 原始图像 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                原始图像
              </h4>
              <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <img
                  src={URL.createObjectURL(file)}
                  alt="原始图像"
                  className="w-full h-full object-contain"
                  onLoad={(e) => {
                    // 清理临时URL
                    setTimeout(() => {
                      URL.revokeObjectURL((e.target as HTMLImageElement).src);
                    }, 1000);
                  }}
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {photo.dimensions.width} × {photo.dimensions.height}
              </div>
            </div>

            {/* 处理后图像 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                处理后图像
              </h4>
              <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center">
                {isProcessing ? (
                  <div className="flex flex-col items-center space-y-2">
                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      正在处理图像...
                    </p>
                  </div>
                ) : processedImageUrl ? (
                  <img
                    src={processedImageUrl}
                    alt="处理后图像"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      点击"处理图像"查看效果
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 处理设置摘要 */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              处理设置
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                  元数据叠加
                </h5>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li>位置: {overlaySettings.position}</li>
                  <li>字体大小: {overlaySettings.font.size}px</li>
                  <li>背景透明度: {Math.round(overlaySettings.background.opacity * 100)}%</li>
                  <li>显示项目: {Object.entries(overlaySettings.displayItems)
                    .filter(([_, enabled]) => enabled)
                    .map(([key, _]) => key)
                    .join(', ')}</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                  相框效果
                </h5>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li>启用: {frameSettings.enabled ? '是' : '否'}</li>
                  {frameSettings.enabled && (
                    <>
                      <li>样式: {frameSettings.style}</li>
                      <li>宽度: {frameSettings.width}px</li>
                      <li>透明度: {Math.round(frameSettings.opacity * 100)}%</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 隐藏的Canvas用于调试 */}
      <canvas
        ref={canvasRef}
        className="hidden"
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ImageProcessor;
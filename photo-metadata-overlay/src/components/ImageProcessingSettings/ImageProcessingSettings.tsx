import React from 'react';
import { motion } from 'framer-motion';
import { ImageProcessingSettings } from '../../types';
import { Slider } from '../UI/Slider';
import { Button } from '../UI/Button';

interface ImageProcessingSettingsProps {
  settings: ImageProcessingSettings;
  onSettingsChange: (settings: ImageProcessingSettings) => void;
  onReset?: () => void;
}

export const ImageProcessingSettingsPanel: React.FC<ImageProcessingSettingsProps> = ({
  settings,
  onSettingsChange,
  onReset,
}) => {
  const handleChange = (key: keyof ImageProcessingSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 分辨率设置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          📐 分辨率设置
        </h3>
        
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.preserveOriginalResolution}
              onChange={(e) => handleChange('preserveOriginalResolution', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              保持原始分辨率
            </span>
          </label>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 ml-7">
            启用后将保持图像的原始分辨率，确保最高质量输出
          </p>
        </div>

        {!settings.preserveOriginalResolution && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              最大尺寸限制 (像素)
            </label>
            <div className="space-y-2">
              <Slider
                value={settings.maxDimension}
                onChange={(value) => handleChange('maxDimension', value)}
                min={1024}
                max={8192}
                step={256}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1024px</span>
                <span className="font-medium">{settings.maxDimension}px</span>
                <span>8192px (8K)</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* 质量设置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          🎨 质量设置
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              JPEG 质量
            </label>
            <div className="space-y-2">
              <Slider
                value={settings.jpegQuality}
                onChange={(value) => handleChange('jpegQuality', value)}
                min={1}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1% (最小)</span>
                <span className="font-medium">{settings.jpegQuality}%</span>
                <span>100% (无损)</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              PNG 压缩级别
            </label>
            <div className="space-y-2">
              <Slider
                value={settings.pngCompression}
                onChange={(value) => handleChange('pngCompression', value)}
                min={0}
                max={9}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0 (无压缩)</span>
                <span className="font-medium">{settings.pngCompression}</span>
                <span>9 (最大压缩)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 性能设置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          ⚡ 性能设置
        </h3>
        
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.enableCache}
              onChange={(e) => handleChange('enableCache', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              启用图像缓存
            </span>
          </label>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 ml-7">
            缓存处理过的图像以提高性能，避免重复处理
          </p>
        </div>

        {settings.enableCache && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              最大缓存数量
            </label>
            <div className="space-y-2">
              <Slider
                value={settings.maxCacheSize}
                onChange={(value) => handleChange('maxCacheSize', value)}
                min={1}
                max={50}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1 个</span>
                <span className="font-medium">{settings.maxCacheSize} 个</span>
                <span>50 个</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* 内存管理 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          🧠 内存管理
        </h3>
        
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.enableMemoryOptimization}
              onChange={(e) => handleChange('enableMemoryOptimization', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              启用内存优化
            </span>
          </label>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 ml-7">
            自动监控内存使用情况，在内存不足时清理缓存
          </p>
        </div>

        {settings.enableMemoryOptimization && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              内存阈值
            </label>
            <div className="space-y-2">
              <Slider
                value={settings.memoryThreshold}
                onChange={(value) => handleChange('memoryThreshold', value)}
                min={0.5}
                max={0.95}
                step={0.05}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>50%</span>
                <span className="font-medium">{Math.round(settings.memoryThreshold * 100)}%</span>
                <span>95%</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* 重置按钮 */}
      {onReset && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onReset}
            className="w-full"
          >
            🔄 重置为默认设置
          </Button>
        </div>
      )}

      {/* 当前设置摘要 */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          📊 当前设置摘要
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
          <div>
            <span className="font-medium">分辨率:</span>{' '}
            {settings.preserveOriginalResolution ? '原始' : `${settings.maxDimension}px`}
          </div>
          <div>
            <span className="font-medium">JPEG质量:</span> {settings.jpegQuality}%
          </div>
          <div>
            <span className="font-medium">PNG压缩:</span> {settings.pngCompression}
          </div>
          <div>
            <span className="font-medium">缓存:</span>{' '}
            {settings.enableCache ? `${settings.maxCacheSize}个` : '禁用'}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ImageProcessingSettingsPanel;
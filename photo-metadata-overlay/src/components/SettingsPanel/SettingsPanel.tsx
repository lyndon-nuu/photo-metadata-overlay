import React, { useState } from 'react';
import { Settings, Image, Frame, Palette } from 'lucide-react';
import { OverlaySettings, FrameSettings } from '../../types';
import { DEFAULT_OVERLAY_SETTINGS, DEFAULT_FRAME_SETTINGS } from '../../constants/design-tokens';
import { cn } from '../../utils/cn';

interface SettingsPanelProps {
  overlaySettings: OverlaySettings;
  frameSettings: FrameSettings;
  onOverlayChange: (settings: OverlaySettings) => void;
  onFrameChange: (settings: FrameSettings) => void;
  disabled?: boolean;
  className?: string;
}

type TabType = 'overlay' | 'frame';

/**
 * 设置面板组件
 * 包含叠加设置和相框设置的统一界面
 */
export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  overlaySettings,
  frameSettings,
  onOverlayChange,
  onFrameChange,
  disabled = false,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overlay');

  const tabs = [
    {
      id: 'overlay' as TabType,
      label: '元数据叠加',
      icon: Image,
    },
    {
      id: 'frame' as TabType,
      label: '相框效果',
      icon: Frame,
    },
  ];

  return (
    <div className={cn("bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg", className)}>
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            设置面板
          </h2>
        </div>
      </div>

      {/* 标签页 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-4" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                  isActive
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        {activeTab === 'overlay' && (
          <OverlaySettingsTab
            settings={overlaySettings}
            onChange={onOverlayChange}
          />
        )}
        
        {activeTab === 'frame' && (
          <FrameSettingsTab
            settings={frameSettings}
            onChange={onFrameChange}
          />
        )}
      </div>
    </div>
  );
};

// 元数据叠加设置标签页
interface OverlaySettingsTabProps {
  settings: OverlaySettings;
  onChange: (settings: OverlaySettings) => void;
}

const OverlaySettingsTab: React.FC<OverlaySettingsTabProps> = ({
  settings,
  onChange,
}) => {
  const handleDisplayItemChange = (key: keyof OverlaySettings['displayItems']) => {
    onChange({
      ...settings,
      displayItems: {
        ...settings.displayItems,
        [key]: !settings.displayItems[key],
      },
    });
  };

  const handlePositionChange = (position: OverlaySettings['position']) => {
    onChange({
      ...settings,
      position,
    });
  };

  const handleFontChange = (key: keyof OverlaySettings['font'], value: any) => {
    onChange({
      ...settings,
      font: {
        ...settings.font,
        [key]: value,
      },
    });
  };

  const handleBackgroundChange = (key: keyof OverlaySettings['background'], value: any) => {
    onChange({
      ...settings,
      background: {
        ...settings.background,
        [key]: key === 'opacity' ? parseFloat(value) : value,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* 显示项目 */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          显示项目
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(settings.displayItems).map(([key, value]) => (
            <label key={key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={value}
                onChange={() => handleDisplayItemChange(key as keyof OverlaySettings['displayItems'])}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {getDisplayItemLabel(key)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 位置设置 */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          位置
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'top-left', label: '左上角' },
            { value: 'top-right', label: '右上角' },
            { value: 'bottom-left', label: '左下角' },
            { value: 'bottom-right', label: '右下角' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => handlePositionChange(option.value as OverlaySettings['position'])}
              className={cn(
                "px-3 py-2 text-sm rounded-md border transition-colors",
                settings.position === option.value
                  ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 字体设置 */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          字体设置
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              字体大小: {settings.font.size}px
            </label>
            <input
              type="range"
              min="12"
              max="48"
              value={settings.font.size}
              onChange={(e) => handleFontChange('size', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              字体颜色
            </label>
            <input
              type="color"
              value={settings.font.color}
              onChange={(e) => handleFontChange('color', e.target.value)}
              className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              字体粗细
            </label>
            <select
              value={settings.font.weight}
              onChange={(e) => handleFontChange('weight', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
            >
              <option value="normal">正常</option>
              <option value="bold">粗体</option>
            </select>
          </div>
        </div>
      </div>

      {/* 背景设置 */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          背景设置
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              背景颜色
            </label>
            <input
              type="color"
              value={settings.background.color}
              onChange={(e) => handleBackgroundChange('color', e.target.value)}
              className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              透明度: {Math.round(settings.background.opacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.background.opacity}
              onChange={(e) => handleBackgroundChange('opacity', e.target.value)}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              内边距: {settings.background.padding}px
            </label>
            <input
              type="range"
              min="0"
              max="30"
              value={settings.background.padding}
              onChange={(e) => handleBackgroundChange('padding', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              圆角: {settings.background.borderRadius}px
            </label>
            <input
              type="range"
              min="0"
              max="20"
              value={settings.background.borderRadius}
              onChange={(e) => handleBackgroundChange('borderRadius', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* 重置按钮 */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onChange(DEFAULT_OVERLAY_SETTINGS)}
          className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
        >
          重置为默认设置
        </button>
      </div>
    </div>
  );
};

// 相框设置标签页
interface FrameSettingsTabProps {
  settings: FrameSettings;
  onChange: (settings: FrameSettings) => void;
}

const FrameSettingsTab: React.FC<FrameSettingsTabProps> = ({
  settings,
  onChange,
}) => {
  const handleEnabledChange = (enabled: boolean) => {
    onChange({
      ...settings,
      enabled,
    });
  };

  const handleStyleChange = (style: FrameSettings['style']) => {
    onChange({
      ...settings,
      style,
    });
  };

  const handlePropertyChange = (key: keyof Omit<FrameSettings, 'enabled' | 'style' | 'customProperties'>, value: any) => {
    onChange({
      ...settings,
      [key]: key === 'opacity' ? parseFloat(value) : value,
    });
  };

  const handleCustomPropertyChange = (key: string, value: any) => {
    onChange({
      ...settings,
      customProperties: {
        ...settings.customProperties,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* 启用开关 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          启用相框
        </h3>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => handleEnabledChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {settings.enabled && (
        <>
          {/* 相框样式 */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              相框样式
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                { value: 'simple', label: '简约边框', description: '简单的边框样式' },
                { value: 'shadow', label: '阴影效果', description: '带阴影的边框' },
                { value: 'film', label: '胶片风格', description: '复古胶片边框' },
                { value: 'polaroid', label: '宝丽来风格', description: '宝丽来相片边框' },
                { value: 'vintage', label: '复古风格', description: '复古装饰边框' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStyleChange(option.value as FrameSettings['style'])}
                  className={cn(
                    "p-3 text-left rounded-md border transition-colors",
                    settings.style === option.value
                      ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                  )}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 基本设置 */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              基本设置
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  相框宽度: {settings.width}px
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={settings.width}
                  onChange={(e) => handlePropertyChange('width', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  相框颜色
                </label>
                <input
                  type="color"
                  value={settings.color}
                  onChange={(e) => handlePropertyChange('color', e.target.value)}
                  className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  透明度: {Math.round(settings.opacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.opacity}
                  onChange={(e) => handlePropertyChange('opacity', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* 高级设置 */}
          {(settings.style === 'simple' || settings.style === 'shadow' || settings.style === 'polaroid') && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                高级设置
              </h3>
              <div className="space-y-4">
                {settings.style === 'simple' && (
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                      圆角半径: {settings.customProperties?.cornerRadius || 0}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={settings.customProperties?.cornerRadius || 0}
                      onChange={(e) => handleCustomPropertyChange('cornerRadius', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
                
                {(settings.style === 'shadow' || settings.style === 'polaroid') && (
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                      阴影模糊: {settings.customProperties?.shadowBlur || 10}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={settings.customProperties?.shadowBlur || 10}
                      onChange={(e) => handleCustomPropertyChange('shadowBlur', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 重置按钮 */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => onChange(DEFAULT_FRAME_SETTINGS)}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              重置为默认设置
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// 辅助函数：获取显示项目的标签
function getDisplayItemLabel(key: string): string {
  const labels: Record<string, string> = {
    brand: '相机品牌',
    model: '相机型号',
    aperture: '光圈',
    shutterSpeed: '快门速度',
    iso: 'ISO',
    timestamp: '拍摄时间',
    location: '位置信息',
    brandLogo: '品牌Logo',
  };
  
  return labels[key] || key;
}

export default SettingsPanel;
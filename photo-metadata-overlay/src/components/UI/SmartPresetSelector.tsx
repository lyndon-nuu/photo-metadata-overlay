import { useState, useEffect } from 'react';
import { Palette, Star, Clock, User } from 'lucide-react';
import { Button } from './Button';
import { OverlaySettings, FrameSettings } from '../../types';

import { PresetTemplate } from '../../services/template.service';

interface SmartPresetSelectorProps {
  onSelectPreset: (preset: PresetTemplate) => void;
  onClose: () => void;
  currentSettings?: {
    overlay: OverlaySettings;
    frame: FrameSettings;
  };
}

export function SmartPresetSelector({
  onSelectPreset,
  onClose,
  currentSettings: _currentSettings
}: SmartPresetSelectorProps) {
  const [presets, setPresets] = useState<PresetTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'custom' | 'photography' | 'social' | 'professional' | 'artistic'>('professional');

  useEffect(() => {
    // 模拟预设数据
    const mockPresets: PresetTemplate[] = [
      {
        id: 'minimal',
        name: '简约风格',
        description: '简洁的白色背景，适合专业摄影',
        category: 'professional',
        overlaySettings: {
          layoutMode: 'preset',
          position: 'bottom-right',
          font: {
            family: 'Inter',
            size: 14,
            color: '#333333',
            weight: 'normal'
          },
          background: {
            color: '#ffffff',
            opacity: 0.9,
            padding: 12,
            borderRadius: 6
          },
          displayItems: {
            brand: true,
            model: true,
            aperture: true,
            shutterSpeed: true,
            iso: true,
            timestamp: false,
            location: false,
            brandLogo: true
          }
        },
        frameSettings: {
          enabled: false,
          style: 'simple',
          color: '#ffffff',
          width: 10,
          opacity: 1
        },
        tags: ['简约', '专业', '白色'],
        createdAt: new Date(),
        updatedAt: new Date(),
        isBuiltIn: true,
        usageCount: 0
      },
      {
        id: 'vintage',
        name: '复古胶片',
        description: '温暖的胶片风格，带有复古相框',
        category: 'artistic',
        overlaySettings: {
          layoutMode: 'preset',
          position: 'bottom-left',
          font: {
            family: 'serif',
            size: 16,
            color: '#8B4513',
            weight: 'normal'
          },
          background: {
            color: '#FFF8DC',
            opacity: 0.8,
            padding: 16,
            borderRadius: 8
          },
          displayItems: {
            brand: true,
            model: true,
            aperture: true,
            shutterSpeed: true,
            iso: true,
            timestamp: true,
            location: false,
            brandLogo: false
          }
        },
        frameSettings: {
          enabled: true,
          style: 'vintage',
          color: '#8B4513',
          width: 20,
          opacity: 0.8
        },
        tags: ['复古', '胶片', '艺术'],
        createdAt: new Date(),
        updatedAt: new Date(),
        isBuiltIn: true,
        usageCount: 0
      }
    ];
    setPresets(mockPresets);
  }, []);

  const filteredPresets = presets.filter(preset => preset.category === selectedCategory);

  const categories = [
    { key: 'professional' as const, label: '专业', icon: Star },
    { key: 'artistic' as const, label: '艺术', icon: Clock },
    { key: 'custom' as const, label: '自定义', icon: User }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Palette className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">智能预设选择器</h2>
            </div>
            <Button variant="ghost" onClick={onClose}>
              ×
            </Button>
          </div>
          
          <div className="flex gap-2 mt-4">
            {categories.map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={selectedCategory === key ? 'primary' : 'secondary'}
                onClick={() => setSelectedCategory(key)}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPresets.map((preset) => (
              <div
                key={preset.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-colors"
                onClick={() => onSelectPreset(preset)}
              >
                <div className="aspect-video bg-gray-100 rounded mb-3 flex items-center justify-center">
                  {preset.thumbnail ? (
                    <img src={preset.thumbnail} alt={preset.name} className="w-full h-full object-cover rounded" />
                  ) : (
                    <Palette className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <h3 className="font-medium text-gray-900 mb-1">{preset.name}</h3>
                <p className="text-sm text-gray-600">{preset.description}</p>
              </div>
            ))}
          </div>

          {filteredPresets.length === 0 && (
            <div className="text-center py-12">
              <Palette className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无{categories.find(c => c.key === selectedCategory)?.label}预设</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
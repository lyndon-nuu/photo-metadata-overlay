import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PhotoMetadata, CustomLayoutSettings, MetadataElement, OverlaySettings } from '../../types';
import { DraggableMetadataItem } from './DraggableMetadataItem';
import { Button } from '../UI/Button';
import { Slider } from '../UI/Slider';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomLayoutEditorProps {
  imageFile: File;
  metadata: PhotoMetadata;
  customLayout: CustomLayoutSettings;
  overlaySettings: OverlaySettings;
  onLayoutChange: (layout: CustomLayoutSettings) => void;
  onElementMove: (elementId: string, position: { x: number; y: number }) => void;
  onElementStyleChange: (elementId: string, style: Partial<MetadataElement['style']>) => void;
}

export const CustomLayoutEditor: React.FC<CustomLayoutEditorProps> = ({
  imageFile,
  metadata,
  customLayout,
  overlaySettings,
  onLayoutChange,
  onElementMove,
  onElementStyleChange,
}) => {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(customLayout.gridEnabled);
  const imageRef = useRef<HTMLImageElement>(null);

  // 加载图像并计算缩放比例
  useEffect(() => {
    if (imageFile && imageRef.current) {
      const url = URL.createObjectURL(imageFile);
      imageRef.current.src = url;
      
      // 图片加载完成后计算缩放比例
      imageRef.current.onload = () => {
        if (imageRef.current) {
          const naturalWidth = imageRef.current.naturalWidth;
          const naturalHeight = imageRef.current.naturalHeight;
          const displayWidth = imageRef.current.clientWidth;
          const displayHeight = imageRef.current.clientHeight;
          
          // 计算实际的缩放比例
          const scaleX = displayWidth / naturalWidth;
          const scaleY = displayHeight / naturalHeight;
          const actualScale = Math.min(scaleX, scaleY); // 使用较小的缩放比例
          
          console.log('图片缩放信息:', {
            natural: `${naturalWidth}x${naturalHeight}`,
            display: `${displayWidth}x${displayHeight}`,
            scale: actualScale.toFixed(3)
          });
        }
      };
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [imageFile]);

  // 创建默认元数据元素
  const createDefaultElements = useCallback((): MetadataElement[] => {
    const elements: MetadataElement[] = [];
    const spacing = 25; // 默认间距
    let yOffset = 10;

    console.log('Creating default elements with displayItems:', overlaySettings.displayItems);

    // 根据显示设置创建元素 - 即使没有真实数据也创建演示元素
    if (overlaySettings.displayItems.brand) {
      elements.push({
        id: 'brand',
        type: 'brand',
        position: { x: 10, y: yOffset },
        visible: true,
        style: {
          fontSize: overlaySettings.font.size,
          color: overlaySettings.font.color,
        }
      });
      yOffset += spacing;
    }

    if (overlaySettings.displayItems.model) {
      elements.push({
        id: 'model',
        type: 'model',
        position: { x: 10, y: yOffset },
        visible: true,
        style: {
          fontSize: overlaySettings.font.size,
          color: overlaySettings.font.color,
        }
      });
      yOffset += spacing;
    }

    if (overlaySettings.displayItems.aperture) {
      elements.push({
        id: 'aperture',
        type: 'aperture',
        position: { x: 10, y: yOffset },
        visible: true,
        style: {
          fontSize: overlaySettings.font.size,
          color: overlaySettings.font.color,
        }
      });
      yOffset += spacing;
    }

    if (overlaySettings.displayItems.shutterSpeed) {
      elements.push({
        id: 'shutterSpeed',
        type: 'shutterSpeed',
        position: { x: 10, y: yOffset },
        visible: true,
        style: {
          fontSize: overlaySettings.font.size,
          color: overlaySettings.font.color,
        }
      });
      yOffset += spacing;
    }

    if (overlaySettings.displayItems.iso) {
      elements.push({
        id: 'iso',
        type: 'iso',
        position: { x: 10, y: yOffset },
        visible: true,
        style: {
          fontSize: overlaySettings.font.size,
          color: overlaySettings.font.color,
        }
      });
      yOffset += spacing;
    }

    if (overlaySettings.displayItems.timestamp) {
      elements.push({
        id: 'timestamp',
        type: 'timestamp',
        position: { x: 10, y: yOffset },
        visible: true,
        style: {
          fontSize: overlaySettings.font.size,
          color: overlaySettings.font.color,
        }
      });
      yOffset += spacing;
    }

    if (overlaySettings.displayItems.location) {
      elements.push({
        id: 'location',
        type: 'location',
        position: { x: 10, y: yOffset },
        visible: true,
        style: {
          fontSize: overlaySettings.font.size,
          color: overlaySettings.font.color,
        }
      });
      yOffset += spacing;
    }

    if (overlaySettings.displayItems.brandLogo) {
      elements.push({
        id: 'brandLogo',
        type: 'brandLogo',
        position: { x: 10, y: yOffset },
        visible: true,
        style: {
          fontSize: overlaySettings.font.size,
          color: overlaySettings.font.color,
        }
      });
      yOffset += spacing;
    }

    console.log('Created elements:', elements);
    return elements;
  }, [overlaySettings]);

  // 初始化元素（如果没有自定义布局）
  useEffect(() => {
    if (customLayout.elements.length === 0) {
      const defaultElements = createDefaultElements();
      onLayoutChange({
        ...customLayout,
        elements: defaultElements,
      });
    }
  }, [customLayout, createDefaultElements, onLayoutChange]);

  // 处理元素拖拽结束
  const handleElementDragEnd = useCallback((elementId: string, position: { x: number; y: number }) => {
    // 如果启用网格对齐，调整位置到网格点
    let finalPosition = position;
    if (customLayout.snapToGrid) {
      const gridSize = customLayout.gridSize;
      finalPosition = {
        x: Math.round(position.x / gridSize) * gridSize,
        y: Math.round(position.y / gridSize) * gridSize,
      };
    }

    // 确保位置在有效范围内
    finalPosition = {
      x: Math.max(0, Math.min(100, finalPosition.x)),
      y: Math.max(0, Math.min(100, finalPosition.y)),
    };

    onElementMove(elementId, finalPosition);
  }, [customLayout.snapToGrid, customLayout.gridSize, onElementMove]);

  // 处理元素选择
  const handleElementSelect = useCallback((elementId: string) => {
    setSelectedElementId(elementId);
  }, []);

  // 重置布局到默认位置
  const handleResetLayout = useCallback(() => {
    const defaultElements = createDefaultElements();
    onLayoutChange({
      ...customLayout,
      elements: defaultElements,
    });
    setSelectedElementId(null);
  }, [createDefaultElements, customLayout, onLayoutChange]);

  // 切换网格显示
  const handleToggleGrid = useCallback(() => {
    const newGridEnabled = !showGrid;
    setShowGrid(newGridEnabled);
    onLayoutChange({
      ...customLayout,
      gridEnabled: newGridEnabled,
    });
  }, [showGrid, customLayout, onLayoutChange]);

  // 切换网格对齐
  const handleToggleSnapToGrid = useCallback(() => {
    onLayoutChange({
      ...customLayout,
      snapToGrid: !customLayout.snapToGrid,
    });
  }, [customLayout, onLayoutChange]);

  // 调整网格大小
  const handleGridSizeChange = useCallback((size: number) => {
    onLayoutChange({
      ...customLayout,
      gridSize: size,
    });
  }, [customLayout, onLayoutChange]);

  // 获取选中元素
  const selectedElement = customLayout.elements.find(el => el.id === selectedElementId);

  return (
    <div className="custom-layout-editor">
      {/* 工具栏 */}
      <div className="toolbar bg-gray-100 p-4 rounded-lg mb-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Button
            onClick={handleToggleGrid}
            variant={showGrid ? 'primary' : 'secondary'}
            size="sm"
          >
            {showGrid ? '隐藏网格' : '显示网格'}
          </Button>
          
          <Button
            onClick={handleToggleSnapToGrid}
            variant={customLayout.snapToGrid ? 'primary' : 'secondary'}
            size="sm"
          >
            {customLayout.snapToGrid ? '关闭吸附' : '网格吸附'}
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">网格大小:</span>
            <Slider
              value={customLayout.gridSize}
              onChange={handleGridSizeChange}
              min={5}
              max={50}
              step={5}
              className="w-24"
            />
            <span className="text-sm text-gray-500">{customLayout.gridSize}px</span>
          </div>
          
          <Button
            onClick={handleResetLayout}
            variant="outline"
            size="sm"
          >
            重置布局
          </Button>
        </div>
      </div>

      {/* 编辑区域 */}
      <div className="editor-area relative bg-gray-50 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
        {/* 背景图片 - 使用与预览相同的尺寸和样式 */}
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            ref={imageRef}
            alt="Preview"
            className="max-w-none shadow-lg"
            style={{ 
              opacity: 0.8,
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />
          
          {/* 网格覆盖层 */}
          {showGrid && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
                `,
                backgroundSize: `${customLayout.gridSize}px ${customLayout.gridSize}px`,
              }}
            />
          )}
          
          {/* 调试信息 */}
          <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white p-2 text-xs rounded z-50">
            元素数量: {customLayout.elements.length}
            <br />
            显示项: {Object.entries(overlaySettings.displayItems).filter(([_, enabled]) => enabled).map(([key]) => key).join(', ')}
          </div>

          {/* 可拖拽的元数据元素 */}
          <AnimatePresence>
            {customLayout.elements.map((element) => {
              console.log('Rendering element in CustomLayoutEditor:', element);
              return (
                <DraggableMetadataItem
                  key={element.id}
                  element={element}
                  metadata={metadata}
                  imageSize={{ width: imageRef.current?.naturalWidth || 1, height: imageRef.current?.naturalHeight || 1 }}
                  isSelected={selectedElementId === element.id}
                  onSelect={handleElementSelect}
                  onDragEnd={handleElementDragEnd}
                  onStyleChange={onElementStyleChange}
                  gridSize={customLayout.snapToGrid ? customLayout.gridSize : 0}
                />
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* 属性面板 */}
      {selectedElement && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="properties-panel mt-4 p-4 bg-white rounded-lg border"
        >
          <h3 className="text-lg font-semibold mb-3">
            元素属性 - {getElementDisplayName(selectedElement.type)}
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                字体大小
              </label>
              <Slider
                value={selectedElement.style?.fontSize || overlaySettings.font.size}
                onChange={(size) => onElementStyleChange(selectedElement.id, { fontSize: size })}
                min={12}
                max={48}
                step={1}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                颜色
              </label>
              <input
                type="color"
                value={selectedElement.style?.color || overlaySettings.font.color}
                onChange={(e) => onElementStyleChange(selectedElement.id, { color: e.target.value })}
                className="w-full h-8 rounded border"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                X 位置 (%)
              </label>
              <input
                type="number"
                value={Math.round(selectedElement.position.x)}
                onChange={(e) => onElementMove(selectedElement.id, {
                  x: Number(e.target.value),
                  y: selectedElement.position.y
                })}
                min={0}
                max={100}
                className="w-full px-2 py-1 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Y 位置 (%)
              </label>
              <input
                type="number"
                value={Math.round(selectedElement.position.y)}
                onChange={(e) => onElementMove(selectedElement.id, {
                  x: selectedElement.position.x,
                  y: Number(e.target.value)
                })}
                min={0}
                max={100}
                className="w-full px-2 py-1 border rounded"
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// 获取元素显示名称
function getElementDisplayName(type: MetadataElement['type']): string {
  const names = {
    brand: '相机品牌',
    model: '相机型号',
    aperture: '光圈',
    shutterSpeed: '快门速度',
    iso: 'ISO',
    timestamp: '拍摄时间',
    location: '拍摄地点',
    brandLogo: '品牌Logo',
  };
  return names[type] || type;
}
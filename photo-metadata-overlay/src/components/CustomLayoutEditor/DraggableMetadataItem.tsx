import React, { useCallback, useRef, useState } from 'react';
import { MetadataElement, PhotoMetadata } from '../../types';

interface DraggableMetadataItemProps {
  element: MetadataElement;
  metadata: PhotoMetadata;
  imageSize: { width: number; height: number };
  isSelected: boolean;
  onSelect: (elementId: string) => void;
  onDragEnd: (elementId: string, position: { x: number; y: number }) => void;
  onStyleChange: (elementId: string, style: Partial<MetadataElement['style']>) => void;
  gridSize?: number;
}

export const DraggableMetadataItem: React.FC<DraggableMetadataItemProps> = ({
  element,
  metadata,
  imageSize,
  isSelected,
  onSelect,
  onDragEnd,
  gridSize = 0,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取元素显示的文本内容
  const getElementText = useCallback((): string => {
    switch (element.type) {
      case 'brand':
        return metadata.exif?.make || 'Canon'; // 提供默认值用于演示
      case 'model':
        return metadata.exif?.model || 'EOS R5';
      case 'aperture':
        return metadata.exif?.aperture || 'f/2.8';
      case 'shutterSpeed':
        return metadata.exif?.shutterSpeed || '1/125s';
      case 'iso':
        return metadata.exif?.iso || 'ISO 400';
      case 'timestamp':
        return metadata.exif?.dateTime || metadata.exif?.dateTimeOriginal || '2024-01-01';
      case 'location':
        return metadata.exif?.gps ? `${metadata.exif.gps.latitude.toFixed(4)}, ${metadata.exif.gps.longitude.toFixed(4)}` : 'Unknown Location';
      case 'brandLogo':
        return '📷'; // 临时用emoji表示logo
      default:
        return '';
    }
  }, [element.type, metadata]);

  // 原生鼠标拖拽事件处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current) return;
    
    setIsDragging(true);
    onSelect(element.id);
    
    // 找到图片元素
    const imageElement = containerRef.current.closest('.editor-area')?.querySelector('img');
    if (!imageElement) return;
    
    const imageRect = imageElement.getBoundingClientRect();
    const elementRect = containerRef.current.getBoundingClientRect();
    
    // 计算鼠标相对于元素的偏移
    const offsetX = e.clientX - elementRect.left;
    const offsetY = e.clientY - elementRect.top;
    
    setDragOffset({ x: offsetX, y: offsetY });
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current || !imageElement) return;
      
      // 计算新位置（鼠标位置减去偏移）
      const newLeft = moveEvent.clientX - offsetX;
      const newTop = moveEvent.clientY - offsetY;
      
      // 转换为相对于图片的百分比位置
      const newX = ((newLeft - imageRect.left) / imageRect.width) * 100;
      const newY = ((newTop - imageRect.top) / imageRect.height) * 100;
      
      // 边界检查
      const elementWidth = elementRect.width;
      const elementHeight = elementRect.height;
      const elementWidthPercent = (elementWidth / imageRect.width) * 100;
      const elementHeightPercent = (elementHeight / imageRect.height) * 100;
      
      const clampedX = Math.max(0, Math.min(100 - elementWidthPercent, newX));
      const clampedY = Math.max(0, Math.min(100 - elementHeightPercent, newY));
      
      // 实时更新元素位置
      containerRef.current!.style.left = `${clampedX}%`;
      containerRef.current!.style.top = `${clampedY}%`;
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      
      if (!containerRef.current || !imageElement) return;
      
      // 获取最终位置
      const finalRect = containerRef.current.getBoundingClientRect();
      const finalX = ((finalRect.left - imageRect.left) / imageRect.width) * 100;
      const finalY = ((finalRect.top - imageRect.top) / imageRect.height) * 100;
      
      console.log('Native drag end:', {
        imageRect: { left: imageRect.left, top: imageRect.top, width: imageRect.width, height: imageRect.height },
        finalRect: { left: finalRect.left, top: finalRect.top },
        finalPosition: { x: finalX.toFixed(2), y: finalY.toFixed(2) }
      });
      
      // 应用网格对齐
      let gridX = finalX;
      let gridY = finalY;
      
      if (gridSize > 0) {
        const gridPercentX = (gridSize / imageRect.width) * 100;
        const gridPercentY = (gridSize / imageRect.height) * 100;
        
        gridX = Math.round(finalX / gridPercentX) * gridPercentX;
        gridY = Math.round(finalY / gridPercentY) * gridPercentY;
      }
      
      // 最终边界检查
      const elementWidth = finalRect.width;
      const elementHeight = finalRect.height;
      const elementWidthPercent = (elementWidth / imageRect.width) * 100;
      const elementHeightPercent = (elementHeight / imageRect.height) * 100;
      
      const finalClampedX = Math.max(0, Math.min(100 - elementWidthPercent, gridX));
      const finalClampedY = Math.max(0, Math.min(100 - elementHeightPercent, gridY));
      
      onDragEnd(element.id, { x: finalClampedX, y: finalClampedY });
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [element.id, onSelect, onDragEnd, gridSize, dragOffset]);

  // 处理点击选择
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(element.id);
  }, [onSelect, element.id]);

  // 计算正确的字体大小，考虑图片缩放
  const calculateFontSize = useCallback((): number => {
    const baseFontSize = element.style?.fontSize || 16;
    
    // 获取图片元素来计算缩放比例
    const imageElement = containerRef.current?.closest('.editor-area')?.querySelector('img') as HTMLImageElement;
    if (!imageElement) return baseFontSize;
    
    // 计算图片的显示缩放比例
    const displayWidth = imageElement.clientWidth;
    const naturalWidth = imageElement.naturalWidth || imageSize.width;
    const scale = displayWidth / naturalWidth;
    
    // 根据缩放比例调整字体大小，确保与预览模式一致
    const scaledFontSize = baseFontSize * scale;
    
    console.log('Font size calculation:', {
      baseFontSize,
      displayWidth,
      naturalWidth,
      scale: scale.toFixed(3),
      scaledFontSize: scaledFontSize.toFixed(1)
    });
    
    return scaledFontSize;
  }, [element.style?.fontSize, imageSize]);

  const text = getElementText();
  
  // 如果没有文本内容，不渲染
  if (!text) return null;

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      className={`
        absolute cursor-move select-none z-10
        px-2 py-1 rounded
        transition-all duration-200
        ${isSelected 
          ? 'ring-2 ring-blue-500 bg-blue-50 shadow-lg' 
          : 'bg-black bg-opacity-70 hover:bg-opacity-80'
        }
        ${isDragging ? 'shadow-xl z-20' : ''}
      `}
      style={{
        left: `${element.position.x}%`,
        top: `${element.position.y}%`,
        fontSize: `${calculateFontSize()}px`, // 使用计算后的字体大小
        color: isSelected ? '#1f2937' : (element.style?.color || '#ffffff'),
        fontWeight: 'bold',
        textShadow: isSelected ? 'none' : '1px 1px 2px rgba(0,0,0,0.8)',
        minWidth: '40px',
        textAlign: 'center',
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        // 确保元素不会因为内容过长而变形
        whiteSpace: 'nowrap',
        overflow: 'visible',
      }}
    >
      {text}
      
      {/* 选中状态的控制点 */}
      {isSelected && (
        <>
          {/* 四个角的控制点 */}
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
          
          {/* 类型标签 */}
          <div className="absolute -top-6 left-0 px-1 py-0.5 bg-blue-500 text-white text-xs rounded whitespace-nowrap">
            {getElementDisplayName(element.type)}
          </div>
        </>
      )}
      
      {/* 拖拽时的辅助线 */}
      {isDragging && gridSize > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {/* 这里可以添加拖拽时的网格辅助线 */}
        </div>
      )}
    </div>
  );
};

// 获取元素显示名称
function getElementDisplayName(type: MetadataElement['type']): string {
  const names = {
    brand: '品牌',
    model: '型号',
    aperture: '光圈',
    shutterSpeed: '快门',
    iso: 'ISO',
    timestamp: '时间',
    location: '地点',
    brandLogo: 'Logo',
  };
  return names[type] || type;
}
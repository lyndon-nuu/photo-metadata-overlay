import { invoke } from '@tauri-apps/api/core';
import {
  BackendPhotoMetadata,
  BackendOverlaySettings,
  BackendFrameSettings,
  BackendProcessingSettings,
  BackendProcessedImageInfo,
  BackendBatchProcessingResult,
  BackendPreviewSettings,
  TauriAPI,
} from '../types';

/**
 * Tauri API服务 - 包装后端Rust函数调用
 * 提供类型安全的API调用和错误处理
 */
class TauriAPIService implements TauriAPI {
  /**
   * 测试后端连接
   */
  async greet(name: string): Promise<string> {
    try {
      return await invoke('greet', { name });
    } catch (error) {
      console.error('Greet command failed:', error);
      throw new Error(`后端连接失败: ${error}`);
    }
  }

  /**
   * 提取图片EXIF元数据
   */
  async extractMetadata(filePath: string): Promise<BackendPhotoMetadata> {
    try {
      return await invoke('extract_metadata', { filePath });
    } catch (error) {
      console.error('Extract metadata failed:', error);
      throw new Error(`EXIF数据提取失败: ${error}`);
    }
  }

  /**
   * 验证图片文件格式
   */
  async validateImageFile(filePath: string): Promise<boolean> {
    try {
      return await invoke('validate_image_file', { filePath });
    } catch (error) {
      console.error('Validate image file failed:', error);
      throw new Error(`文件格式验证失败: ${error}`);
    }
  }

  /**
   * 处理单张图片
   */
  async processImage(
    inputPath: string,
    metadata: BackendPhotoMetadata,
    overlaySettings: BackendOverlaySettings,
    frameSettings: BackendFrameSettings,
    outputPath: string,
    quality: number
  ): Promise<BackendProcessedImageInfo> {
    try {
      return await invoke('process_image', {
        inputPath,
        metadata,
        overlaySettings,
        frameSettings,
        outputPath,
        quality,
      });
    } catch (error) {
      console.error('Process image failed:', error);
      throw new Error(`图片处理失败: ${error}`);
    }
  }

  /**
   * 批量处理图片
   */
  async batchProcessImages(
    imagePaths: string[],
    settings: BackendProcessingSettings,
    outputDir: string
  ): Promise<BackendBatchProcessingResult> {
    try {
      return await invoke('batch_process_images', {
        imagePaths,
        settings,
        outputDir,
      });
    } catch (error) {
      console.error('Batch process images failed:', error);
      throw new Error(`批量处理失败: ${error}`);
    }
  }

  /**
   * 生成预览图片
   */
  async generatePreview(
    imagePath: string,
    settings: BackendPreviewSettings
  ): Promise<number[]> {
    try {
      return await invoke('generate_preview', {
        imagePath,
        settings,
      });
    } catch (error) {
      console.error('Generate preview failed:', error);
      throw new Error(`预览生成失败: ${error}`);
    }
  }

  /**
   * 保存处理后的图片（带文件保存对话框）
   * 这是新增的功能，会弹出文件保存对话框让用户选择保存位置
   */
  async saveProcessedImage(
    inputPath: string,
    metadata: BackendPhotoMetadata,
    overlaySettings: BackendOverlaySettings,
    frameSettings: BackendFrameSettings,
    quality: number
  ): Promise<string> {
    try {
      console.log('🔄 调用后端保存图片API...', {
        inputPath,
        quality,
        overlayEnabled: overlaySettings.display_items,
        frameEnabled: frameSettings.enabled,
      });

      const savedPath = await invoke<string>('save_processed_image', {
        inputPath,
        metadata,
        overlaySettings,
        frameSettings,
        quality,
      });

      console.log('✅ 图片保存成功:', savedPath);
      return savedPath;
    } catch (error) {
      console.error('❌ 保存图片失败:', error);
      
      // 处理用户取消保存的情况
      if (typeof error === 'string' && error.includes('用户取消')) {
        throw new Error('用户取消了保存操作');
      }
      
      throw new Error(`保存图片失败: ${error}`);
    }
  }

  /**
   * 将前端设置转换为后端格式
   */
  convertToBackendOverlaySettings(frontendSettings: any): BackendOverlaySettings {
    return {
      position: this.convertPosition(frontendSettings.position),
      font: {
        family: frontendSettings.font.family,
        size: frontendSettings.font.size,
        color: frontendSettings.font.color,
        weight: frontendSettings.font.weight === 'bold' ? 'Bold' : 'Normal',
      },
      background: {
        color: frontendSettings.background.color,
        opacity: frontendSettings.background.opacity,
        padding: frontendSettings.background.padding,
        border_radius: frontendSettings.background.borderRadius,
      },
      display_items: {
        brand: frontendSettings.displayItems.brand,
        model: frontendSettings.displayItems.model,
        aperture: frontendSettings.displayItems.aperture,
        shutter_speed: frontendSettings.displayItems.shutterSpeed,
        iso: frontendSettings.displayItems.iso,
        timestamp: frontendSettings.displayItems.timestamp,
        location: frontendSettings.displayItems.location,
        brand_logo: frontendSettings.displayItems.brandLogo,
      },
    };
  }

  /**
   * 将前端相框设置转换为后端格式
   */
  convertToBackendFrameSettings(frontendSettings: any): BackendFrameSettings {
    return {
      enabled: frontendSettings.enabled,
      style: this.convertFrameStyle(frontendSettings.style),
      color: frontendSettings.color,
      width: frontendSettings.width,
      opacity: frontendSettings.opacity,
      custom_properties: frontendSettings.customProperties,
    };
  }

  /**
   * 转换位置枚举
   */
  private convertPosition(position: string): 'TopLeft' | 'TopRight' | 'BottomLeft' | 'BottomRight' {
    switch (position) {
      case 'top-left':
        return 'TopLeft';
      case 'top-right':
        return 'TopRight';
      case 'bottom-left':
        return 'BottomLeft';
      case 'bottom-right':
        return 'BottomRight';
      default:
        return 'BottomRight';
    }
  }

  /**
   * 转换相框样式枚举
   */
  private convertFrameStyle(style: string): 'Simple' | 'Shadow' | 'Film' | 'Polaroid' | 'Vintage' {
    switch (style) {
      case 'simple':
        return 'Simple';
      case 'shadow':
        return 'Shadow';
      case 'film':
        return 'Film';
      case 'polaroid':
        return 'Polaroid';
      case 'vintage':
        return 'Vintage';
      default:
        return 'Simple';
    }
  }

  /**
   * 创建默认的叠加设置
   */
  createDefaultOverlaySettings(): BackendOverlaySettings {
    return {
      position: 'BottomRight',
      font: {
        family: 'Arial',
        size: 16,
        color: '#FFFFFF',
        weight: 'Normal',
      },
      background: {
        color: '#000000',
        opacity: 0.8,
        padding: 10,
        border_radius: 5,
      },
      display_items: {
        brand: true,
        model: true,
        aperture: true,
        shutter_speed: true,
        iso: true,
        timestamp: true,
        location: false,
        brand_logo: true,
      },
    };
  }

  /**
   * 创建默认的相框设置
   */
  createDefaultFrameSettings(): BackendFrameSettings {
    return {
      enabled: false,
      style: 'Simple',
      color: '#FFFFFF',
      width: 10,
      opacity: 1.0,
      custom_properties: {},
    };
  }
}

// 导出单例实例
export const tauriAPI = new TauriAPIService();
export default tauriAPI;
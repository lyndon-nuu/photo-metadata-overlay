import { StorageService, UserSettings, OverlaySettings, FrameSettings, OverlayConfig } from '../types';
import { DEFAULT_OVERLAY_SETTINGS, DEFAULT_FRAME_SETTINGS } from '../constants/design-tokens';

/**
 * 存储服务实现
 * 使用 Tauri 的存储 API 进行本地配置持久化
 */
export class StorageServiceImpl implements StorageService {
  private readonly STORAGE_KEYS = {
    USER_SETTINGS: 'user_settings',
    OVERLAY_SETTINGS: 'overlay_settings',
    FRAME_SETTINGS: 'frame_settings',
    OVERLAY_TEMPLATES: 'overlay_templates',
  };

  /**
   * 保存用户设置
   */
  async saveSettings(settings: UserSettings): Promise<void> {
    try {
      // 在浏览器环境中使用 localStorage 作为后备
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
        console.log('用户设置已保存到 localStorage');
        return;
      }

      // TODO: 在 Tauri 环境中使用 Tauri 存储 API
      // const { writeTextFile, BaseDirectory } = await import('@tauri-apps/api/fs');
      // await writeTextFile('settings/user_settings.json', JSON.stringify(settings, null, 2), {
      //   dir: BaseDirectory.AppData,
      // });
      
      console.log('用户设置已保存');
    } catch (error) {
      console.error('保存用户设置失败:', error);
      throw new Error('无法保存用户设置');
    }
  }

  /**
   * 加载用户设置
   */
  async loadSettings(): Promise<UserSettings> {
    try {
      // 在浏览器环境中使用 localStorage 作为后备
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.STORAGE_KEYS.USER_SETTINGS);
        if (stored) {
          const settings = JSON.parse(stored) as UserSettings;
          console.log('从 localStorage 加载用户设置');
          return this.validateUserSettings(settings);
        }
      }

      // TODO: 在 Tauri 环境中使用 Tauri 存储 API
      // const { readTextFile, BaseDirectory } = await import('@tauri-apps/api/fs');
      // try {
      //   const content = await readTextFile('settings/user_settings.json', {
      //     dir: BaseDirectory.AppData,
      //   });
      //   const settings = JSON.parse(content) as UserSettings;
      //   return this.validateUserSettings(settings);
      // } catch (fileError) {
      //   // 文件不存在，返回默认设置
      //   console.log('设置文件不存在，使用默认设置');
      // }

      // 返回默认设置
      return this.getDefaultUserSettings();
    } catch (error) {
      console.error('加载用户设置失败:', error);
      return this.getDefaultUserSettings();
    }
  }

  /**
   * 保存叠加设置
   */
  async saveOverlaySettings(settings: OverlaySettings): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEYS.OVERLAY_SETTINGS, JSON.stringify(settings));
        console.log('叠加设置已保存到 localStorage');
        return;
      }

      // TODO: Tauri 实现
      console.log('叠加设置已保存');
    } catch (error) {
      console.error('保存叠加设置失败:', error);
      throw new Error('无法保存叠加设置');
    }
  }

  /**
   * 加载叠加设置
   */
  async loadOverlaySettings(): Promise<OverlaySettings> {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.STORAGE_KEYS.OVERLAY_SETTINGS);
        if (stored) {
          const settings = JSON.parse(stored) as OverlaySettings;
          console.log('从 localStorage 加载叠加设置');
          return this.validateOverlaySettings(settings);
        }
      }

      // TODO: Tauri 实现
      return DEFAULT_OVERLAY_SETTINGS;
    } catch (error) {
      console.error('加载叠加设置失败:', error);
      return DEFAULT_OVERLAY_SETTINGS;
    }
  }

  /**
   * 保存相框设置
   */
  async saveFrameSettings(settings: FrameSettings): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEYS.FRAME_SETTINGS, JSON.stringify(settings));
        console.log('相框设置已保存到 localStorage');
        return;
      }

      // TODO: Tauri 实现
      console.log('相框设置已保存');
    } catch (error) {
      console.error('保存相框设置失败:', error);
      throw new Error('无法保存相框设置');
    }
  }

  /**
   * 加载相框设置
   */
  async loadFrameSettings(): Promise<FrameSettings> {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.STORAGE_KEYS.FRAME_SETTINGS);
        if (stored) {
          const settings = JSON.parse(stored) as FrameSettings;
          console.log('从 localStorage 加载相框设置');
          return this.validateFrameSettings(settings);
        }
      }

      // TODO: Tauri 实现
      return DEFAULT_FRAME_SETTINGS;
    } catch (error) {
      console.error('加载相框设置失败:', error);
      return DEFAULT_FRAME_SETTINGS;
    }
  }

  /**
   * 保存模板
   */
  async saveTemplate(template: OverlayConfig): Promise<void> {
    try {
      const templates = await this.loadTemplates();
      const existingIndex = templates.findIndex(t => t.id === template.id);
      
      if (existingIndex >= 0) {
        templates[existingIndex] = template;
      } else {
        templates.push(template);
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEYS.OVERLAY_TEMPLATES, JSON.stringify(templates));
        console.log('模板已保存到 localStorage');
        return;
      }

      // TODO: Tauri 实现
      console.log('模板已保存');
    } catch (error) {
      console.error('保存模板失败:', error);
      throw new Error('无法保存模板');
    }
  }

  /**
   * 加载模板列表
   */
  async loadTemplates(): Promise<OverlayConfig[]> {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.STORAGE_KEYS.OVERLAY_TEMPLATES);
        if (stored) {
          const templates = JSON.parse(stored) as OverlayConfig[];
          console.log('从 localStorage 加载模板列表');
          return templates;
        }
      }

      // TODO: Tauri 实现
      return [];
    } catch (error) {
      console.error('加载模板列表失败:', error);
      return [];
    }
  }

  /**
   * 删除模板
   */
  async deleteTemplate(id: string): Promise<void> {
    try {
      const templates = await this.loadTemplates();
      const filteredTemplates = templates.filter(t => t.id !== id);

      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEYS.OVERLAY_TEMPLATES, JSON.stringify(filteredTemplates));
        console.log('模板已从 localStorage 删除');
        return;
      }

      // TODO: Tauri 实现
      console.log('模板已删除');
    } catch (error) {
      console.error('删除模板失败:', error);
      throw new Error('无法删除模板');
    }
  }

  /**
   * 导出所有设置
   */
  async exportSettings(): Promise<string> {
    try {
      const userSettings = await this.loadSettings();
      const overlaySettings = await this.loadOverlaySettings();
      const frameSettings = await this.loadFrameSettings();
      const templates = await this.loadTemplates();

      const exportData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        userSettings,
        overlaySettings,
        frameSettings,
        templates,
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('导出设置失败:', error);
      throw new Error('无法导出设置');
    }
  }

  /**
   * 导入设置
   */
  async importSettings(data: string): Promise<void> {
    try {
      const importData = JSON.parse(data);
      
      // 验证导入数据格式
      if (!importData.version || !importData.timestamp) {
        throw new Error('无效的设置文件格式');
      }

      // 导入各项设置
      if (importData.userSettings) {
        await this.saveSettings(this.validateUserSettings(importData.userSettings));
      }

      if (importData.overlaySettings) {
        await this.saveOverlaySettings(this.validateOverlaySettings(importData.overlaySettings));
      }

      if (importData.frameSettings) {
        await this.saveFrameSettings(this.validateFrameSettings(importData.frameSettings));
      }

      if (importData.templates && Array.isArray(importData.templates)) {
        // 清空现有模板并导入新模板
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.STORAGE_KEYS.OVERLAY_TEMPLATES, JSON.stringify(importData.templates));
        }
      }

      console.log('设置导入成功');
    } catch (error) {
      console.error('导入设置失败:', error);
      throw new Error('无法导入设置：' + (error instanceof Error ? error.message : '未知错误'));
    }
  }

  /**
   * 重置所有设置
   */
  async resetAllSettings(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.STORAGE_KEYS.USER_SETTINGS);
        localStorage.removeItem(this.STORAGE_KEYS.OVERLAY_SETTINGS);
        localStorage.removeItem(this.STORAGE_KEYS.FRAME_SETTINGS);
        localStorage.removeItem(this.STORAGE_KEYS.OVERLAY_TEMPLATES);
        console.log('所有设置已从 localStorage 重置');
        return;
      }

      // TODO: Tauri 实现
      console.log('所有设置已重置');
    } catch (error) {
      console.error('重置设置失败:', error);
      throw new Error('无法重置设置');
    }
  }

  /**
   * 获取默认用户设置
   */
  private getDefaultUserSettings(): UserSettings {
    return {
      theme: 'auto',
      language: 'zh-CN',
      defaultExportFormat: 'jpeg',
      defaultExportQuality: 0.9,
      autoSave: true,
      recentTemplates: [],
      shortcuts: {
        openFile: 'Ctrl+O',
        exportImage: 'Ctrl+E',
        togglePreview: 'Space',
        undo: 'Ctrl+Z',
        redo: 'Ctrl+Y',
        save: 'Ctrl+S',
      },
    };
  }

  /**
   * 验证用户设置
   */
  private validateUserSettings(settings: Partial<UserSettings>): UserSettings {
    const defaultSettings = this.getDefaultUserSettings();
    
    // 验证主题设置
    const validThemes = ['light', 'dark', 'auto'];
    const theme = validThemes.includes(settings.theme as string) ? settings.theme : defaultSettings.theme;
    
    // 验证导出格式
    const validFormats = ['jpeg', 'png'];
    const defaultExportFormat = validFormats.includes(settings.defaultExportFormat as string) 
      ? settings.defaultExportFormat 
      : defaultSettings.defaultExportFormat;
    
    return {
      theme: theme as UserSettings['theme'],
      language: settings.language || defaultSettings.language,
      defaultExportFormat: defaultExportFormat as UserSettings['defaultExportFormat'],
      defaultExportQuality: Math.max(0.1, Math.min(1, settings.defaultExportQuality || defaultSettings.defaultExportQuality)),
      autoSave: typeof settings.autoSave === 'boolean' ? settings.autoSave : defaultSettings.autoSave,
      recentTemplates: Array.isArray(settings.recentTemplates) ? settings.recentTemplates : defaultSettings.recentTemplates,
      shortcuts: {
        ...defaultSettings.shortcuts,
        ...settings.shortcuts,
      },
    };
  }

  /**
   * 验证叠加设置
   */
  private validateOverlaySettings(settings: Partial<OverlaySettings>): OverlaySettings {
    return {
      position: settings.position || DEFAULT_OVERLAY_SETTINGS.position,
      font: {
        family: settings.font?.family || DEFAULT_OVERLAY_SETTINGS.font.family,
        size: Math.max(8, Math.min(72, settings.font?.size || DEFAULT_OVERLAY_SETTINGS.font.size)),
        color: settings.font?.color || DEFAULT_OVERLAY_SETTINGS.font.color,
        weight: settings.font?.weight || DEFAULT_OVERLAY_SETTINGS.font.weight,
      },
      background: {
        color: settings.background?.color || DEFAULT_OVERLAY_SETTINGS.background.color,
        opacity: Math.max(0, Math.min(1, settings.background?.opacity || DEFAULT_OVERLAY_SETTINGS.background.opacity)),
        padding: Math.max(0, settings.background?.padding || DEFAULT_OVERLAY_SETTINGS.background.padding),
        borderRadius: Math.max(0, settings.background?.borderRadius || DEFAULT_OVERLAY_SETTINGS.background.borderRadius),
      },
      displayItems: {
        brand: settings.displayItems?.brand ?? DEFAULT_OVERLAY_SETTINGS.displayItems.brand,
        model: settings.displayItems?.model ?? DEFAULT_OVERLAY_SETTINGS.displayItems.model,
        aperture: settings.displayItems?.aperture ?? DEFAULT_OVERLAY_SETTINGS.displayItems.aperture,
        shutterSpeed: settings.displayItems?.shutterSpeed ?? DEFAULT_OVERLAY_SETTINGS.displayItems.shutterSpeed,
        iso: settings.displayItems?.iso ?? DEFAULT_OVERLAY_SETTINGS.displayItems.iso,
        timestamp: settings.displayItems?.timestamp ?? DEFAULT_OVERLAY_SETTINGS.displayItems.timestamp,
        location: settings.displayItems?.location ?? DEFAULT_OVERLAY_SETTINGS.displayItems.location,
        brandLogo: settings.displayItems?.brandLogo ?? DEFAULT_OVERLAY_SETTINGS.displayItems.brandLogo,
      },
    };
  }

  /**
   * 验证相框设置
   */
  private validateFrameSettings(settings: Partial<FrameSettings>): FrameSettings {
    return {
      enabled: settings.enabled ?? DEFAULT_FRAME_SETTINGS.enabled,
      style: settings.style || DEFAULT_FRAME_SETTINGS.style,
      color: settings.color || DEFAULT_FRAME_SETTINGS.color,
      width: Math.max(0, settings.width || DEFAULT_FRAME_SETTINGS.width),
      opacity: Math.max(0, Math.min(1, settings.opacity || DEFAULT_FRAME_SETTINGS.opacity)),
      customProperties: {
        shadowBlur: Math.max(0, settings.customProperties?.shadowBlur || DEFAULT_FRAME_SETTINGS.customProperties?.shadowBlur || 0),
        shadowOffset: {
          x: settings.customProperties?.shadowOffset?.x || DEFAULT_FRAME_SETTINGS.customProperties?.shadowOffset?.x || 0,
          y: settings.customProperties?.shadowOffset?.y || DEFAULT_FRAME_SETTINGS.customProperties?.shadowOffset?.y || 0,
        },
        cornerRadius: Math.max(0, settings.customProperties?.cornerRadius || DEFAULT_FRAME_SETTINGS.customProperties?.cornerRadius || 0),
      },
    };
  }
}

// 导出单例实例
export const storageService = new StorageServiceImpl();
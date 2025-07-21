import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageServiceImpl } from '../storage.service';
import { UserSettings, OverlaySettings, FrameSettings } from '../../types';
import { DEFAULT_OVERLAY_SETTINGS, DEFAULT_FRAME_SETTINGS } from '../../constants/design-tokens';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('StorageService', () => {
  let storageService: StorageServiceImpl;

  beforeEach(() => {
    storageService = new StorageServiceImpl();
    vi.clearAllMocks();
  });

  describe('User Settings', () => {
    const mockUserSettings: UserSettings = {
      theme: 'dark',
      language: 'zh-CN',
      defaultExportFormat: 'png',
      defaultExportQuality: 0.8,
      autoSave: false,
      recentTemplates: ['template1', 'template2'],
      shortcuts: {
        openFile: 'Ctrl+O',
        exportImage: 'Ctrl+E',
        togglePreview: 'Space',
        undo: 'Ctrl+Z',
        redo: 'Ctrl+Y',
        save: 'Ctrl+S',
      },
    };

    it('should save user settings to localStorage', async () => {
      await storageService.saveSettings(mockUserSettings);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'user_settings',
        JSON.stringify(mockUserSettings)
      );
    });

    it('should load user settings from localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUserSettings));

      const result = await storageService.loadSettings();

      expect(localStorageMock.getItem).toHaveBeenCalledWith('user_settings');
      expect(result).toEqual(mockUserSettings);
    });

    it('should return default settings when localStorage is empty', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = await storageService.loadSettings();

      expect(result.theme).toBe('auto');
      expect(result.language).toBe('zh-CN');
      expect(result.autoSave).toBe(true);
    });

    it('should validate and fix invalid settings', async () => {
      const invalidSettings = {
        theme: 'invalid-theme',
        defaultExportQuality: 2.0, // Invalid: > 1
        autoSave: 'not-boolean',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(invalidSettings));

      const result = await storageService.loadSettings();

      expect(result.theme).toBe('auto'); // Fixed to default
      expect(result.defaultExportQuality).toBe(1); // Clamped to max
      expect(result.autoSave).toBe(true); // Fixed to default
    });
  });

  describe('Overlay Settings', () => {
    const mockOverlaySettings: OverlaySettings = {
      ...DEFAULT_OVERLAY_SETTINGS,
      position: 'top-right',
      font: {
        ...DEFAULT_OVERLAY_SETTINGS.font,
        size: 18,
        color: '#ff0000',
      },
    };

    it('should save overlay settings to localStorage', async () => {
      await storageService.saveOverlaySettings(mockOverlaySettings);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'overlay_settings',
        JSON.stringify(mockOverlaySettings)
      );
    });

    it('should load overlay settings from localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockOverlaySettings));

      const result = await storageService.loadOverlaySettings();

      expect(result).toEqual(mockOverlaySettings);
    });

    it('should return default overlay settings when localStorage is empty', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = await storageService.loadOverlaySettings();

      expect(result).toEqual(DEFAULT_OVERLAY_SETTINGS);
    });

    it('should validate overlay settings', async () => {
      const invalidSettings = {
        ...DEFAULT_OVERLAY_SETTINGS,
        font: {
          ...DEFAULT_OVERLAY_SETTINGS.font,
          size: 100, // Too large
        },
        background: {
          ...DEFAULT_OVERLAY_SETTINGS.background,
          opacity: 2.0, // Invalid: > 1
        },
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(invalidSettings));

      const result = await storageService.loadOverlaySettings();

      expect(result.font.size).toBe(72); // Clamped to max
      expect(result.background.opacity).toBe(1); // Clamped to max
    });
  });

  describe('Frame Settings', () => {
    const mockFrameSettings: FrameSettings = {
      ...DEFAULT_FRAME_SETTINGS,
      enabled: true,
      style: 'shadow',
      width: 30,
    };

    it('should save frame settings to localStorage', async () => {
      await storageService.saveFrameSettings(mockFrameSettings);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'frame_settings',
        JSON.stringify(mockFrameSettings)
      );
    });

    it('should load frame settings from localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockFrameSettings));

      const result = await storageService.loadFrameSettings();

      expect(result).toEqual(mockFrameSettings);
    });

    it('should return default frame settings when localStorage is empty', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = await storageService.loadFrameSettings();

      expect(result).toEqual(DEFAULT_FRAME_SETTINGS);
    });
  });

  describe('Templates', () => {
    const mockTemplate = {
      id: 'template1',
      name: 'Test Template',
      template: {
        id: 'template1',
        name: 'Test Template',
        layout: 'horizontal' as const,
        background: {
          type: 'solid' as const,
          color: '#000000',
        },
      },
      position: { x: 0, y: 0, anchor: 'bottom-left' as const },
      style: {
        backgroundColor: '#000000',
        textColor: '#ffffff',
        fontSize: 14,
        fontFamily: 'Arial',
        padding: 10,
        borderRadius: 5,
        opacity: 0.8,
        shadow: false,
      },
      fields: [],
    };

    it('should save template to localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]));

      await storageService.saveTemplate(mockTemplate);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'overlay_templates',
        JSON.stringify([mockTemplate])
      );
    });

    it('should load templates from localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockTemplate]));

      const result = await storageService.loadTemplates();

      expect(result).toEqual([mockTemplate]);
    });

    it('should delete template from localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([mockTemplate]));

      await storageService.deleteTemplate('template1');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'overlay_templates',
        JSON.stringify([])
      );
    });
  });

  describe('Import/Export', () => {
    it('should export all settings', async () => {
      const mockSettings = {
        theme: 'dark',
        language: 'zh-CN',
        defaultExportFormat: 'png' as const,
        defaultExportQuality: 0.8,
        autoSave: false,
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

      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify(mockSettings)) // user settings
        .mockReturnValueOnce(JSON.stringify(DEFAULT_OVERLAY_SETTINGS)) // overlay settings
        .mockReturnValueOnce(JSON.stringify(DEFAULT_FRAME_SETTINGS)) // frame settings
        .mockReturnValueOnce(JSON.stringify([])); // templates

      const result = await storageService.exportSettings();
      const exportData = JSON.parse(result);

      expect(exportData.version).toBe('1.0.0');
      expect(exportData.userSettings).toEqual(mockSettings);
      expect(exportData.overlaySettings).toEqual(DEFAULT_OVERLAY_SETTINGS);
      expect(exportData.frameSettings).toEqual(DEFAULT_FRAME_SETTINGS);
      expect(exportData.templates).toEqual([]);
    });

    it('should import settings', async () => {
      const importData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        userSettings: {
          theme: 'dark',
          language: 'en',
          defaultExportFormat: 'png',
          defaultExportQuality: 0.7,
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
        },
        overlaySettings: DEFAULT_OVERLAY_SETTINGS,
        frameSettings: DEFAULT_FRAME_SETTINGS,
        templates: [],
      };

      await storageService.importSettings(JSON.stringify(importData));

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'user_settings',
        JSON.stringify(importData.userSettings)
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'overlay_settings',
        JSON.stringify(importData.overlaySettings)
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'frame_settings',
        JSON.stringify(importData.frameSettings)
      );
    });

    it('should throw error for invalid import data', async () => {
      const invalidData = '{"invalid": "data"}';

      await expect(storageService.importSettings(invalidData)).rejects.toThrow(
        '无法导入设置：无效的设置文件格式'
      );
    });
  });

  describe('Reset', () => {
    it('should reset all settings', async () => {
      await storageService.resetAllSettings();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user_settings');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('overlay_settings');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('frame_settings');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('overlay_templates');
    });
  });
});
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ImageProcessingServiceImpl } from '../image-processing.service';
import { PhotoMetadata, OverlaySettings } from '../../types';
import { DEFAULT_OVERLAY_SETTINGS } from '../../constants/design-tokens';

// Mock Canvas API
class MockCanvas {
  width = 1920;
  height = 1080;
  
  getContext() {
    return {
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 100 })),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      set fillStyle(_value: string) {},
      set strokeStyle(_value: string) {},
      set font(_value: string) {},
      set textBaseline(_value: string) {},
      set globalAlpha(_value: number) {},
      set lineWidth(_value: number) {},
      set shadowColor(_value: string) {},
      set shadowBlur(_value: number) {},
      set shadowOffsetX(_value: number) {},
      set shadowOffsetY(_value: number) {},
      set imageSmoothingEnabled(_value: boolean) {},
      set imageSmoothingQuality(_value: string) {},
    };
  }

  toBlob(callback: (blob: Blob | null) => void, type?: string, _quality?: number) {
    const mockBlob = new Blob(['mock image data'], { type: type || 'image/png' });
    setTimeout(() => callback(mockBlob), 0);
  }

  toDataURL(_type?: string) {
    return 'data:image/png;base64,mock-canvas-data';
  }
}

// Mock Image
class MockImage {
  naturalWidth = 1920;
  naturalHeight = 1080;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  
  set src(_value: string) {
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
}

// Mock URL
const mockURL = {
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
};

describe('Metadata Overlay Integration Tests', () => {
  let service: ImageProcessingServiceImpl;
  // let mockFile: File;
  let mockMetadata: PhotoMetadata;

  beforeEach(() => {
    // Mock DOM APIs
    Object.defineProperty(global, 'document', {
      value: {
        createElement: vi.fn((tagName: string) => {
          if (tagName === 'canvas') {
            return new MockCanvas();
          }
          return {};
        }),
      },
    });

    Object.defineProperty(global, 'Image', {
      value: MockImage,
    });

    Object.defineProperty(global, 'URL', {
      value: mockURL,
    });

    // Mock btoa for base64 encoding
    global.btoa = vi.fn((str: string) => btoa(str));

    service = new ImageProcessingServiceImpl();

    // 创建测试数据
    // mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    mockMetadata = {
      fileName: 'test.jpg',
      filePath: 'test.jpg',
      fileSize: 1024,
      dimensions: { width: 1920, height: 1080 },
      exif: {
        make: 'Canon',
        model: 'EOS R5',
        aperture: 'f/2.8',
        shutterSpeed: '1/125',
        iso: 'ISO 400',
      },
      createdAt: new Date(),
      modifiedAt: new Date(),
      mimeType: 'image/jpeg',
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('文字叠加功能', () => {
    it('should support custom font settings', async () => {
      const mockImage = new MockImage() as unknown as HTMLImageElement;
      
      const customFontSettings: OverlaySettings = {
        ...DEFAULT_OVERLAY_SETTINGS,
        font: {
          family: 'Arial',
          size: 24,
          color: '#ff0000',
          weight: 'bold',
        },
        displayItems: {
          ...DEFAULT_OVERLAY_SETTINGS.displayItems,
          brand: true,
          model: true,
        },
      };

      const result = await service.applyOverlay(mockImage, mockMetadata, customFontSettings);
      
      expect(result).toBeDefined();
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
    });

    it('should support different text colors', async () => {
      const mockImage = new MockImage() as unknown as HTMLImageElement;
      
      const colors = ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff'];
      
      for (const color of colors) {
        const settings: OverlaySettings = {
          ...DEFAULT_OVERLAY_SETTINGS,
          font: {
            ...DEFAULT_OVERLAY_SETTINGS.font,
            color,
          },
          displayItems: {
            ...DEFAULT_OVERLAY_SETTINGS.displayItems,
            brand: true,
          },
        };

        const result = await service.applyOverlay(mockImage, mockMetadata, settings);
        expect(result).toBeDefined();
      }
    });

    it('should support different font sizes', async () => {
      const mockImage = new MockImage() as unknown as HTMLImageElement;
      
      const fontSizes = [12, 16, 20, 24, 32];
      
      for (const size of fontSizes) {
        const settings: OverlaySettings = {
          ...DEFAULT_OVERLAY_SETTINGS,
          font: {
            ...DEFAULT_OVERLAY_SETTINGS.font,
            size,
          },
          displayItems: {
            ...DEFAULT_OVERLAY_SETTINGS.displayItems,
            brand: true,
          },
        };

        const result = await service.applyOverlay(mockImage, mockMetadata, settings);
        expect(result).toBeDefined();
      }
    });
  });

  describe('背景框和透明度设置', () => {
    it('should support background with different opacity levels', async () => {
      const mockImage = new MockImage() as unknown as HTMLImageElement;
      
      const opacityLevels = [0, 0.25, 0.5, 0.75, 1.0];
      
      for (const opacity of opacityLevels) {
        const settings: OverlaySettings = {
          ...DEFAULT_OVERLAY_SETTINGS,
          background: {
            ...DEFAULT_OVERLAY_SETTINGS.background,
            opacity,
          },
          displayItems: {
            ...DEFAULT_OVERLAY_SETTINGS.displayItems,
            brand: true,
          },
        };

        const result = await service.applyOverlay(mockImage, mockMetadata, settings);
        expect(result).toBeDefined();
      }
    });

    it('should support different background colors', async () => {
      const mockImage = new MockImage() as unknown as HTMLImageElement;
      
      const colors = ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff'];
      
      for (const color of colors) {
        const settings: OverlaySettings = {
          ...DEFAULT_OVERLAY_SETTINGS,
          background: {
            ...DEFAULT_OVERLAY_SETTINGS.background,
            color,
          },
          displayItems: {
            ...DEFAULT_OVERLAY_SETTINGS.displayItems,
            brand: true,
          },
        };

        const result = await service.applyOverlay(mockImage, mockMetadata, settings);
        expect(result).toBeDefined();
      }
    });

    it('should support different padding values', async () => {
      const mockImage = new MockImage() as unknown as HTMLImageElement;
      
      const paddingValues = [0, 5, 10, 15, 20];
      
      for (const padding of paddingValues) {
        const settings: OverlaySettings = {
          ...DEFAULT_OVERLAY_SETTINGS,
          background: {
            ...DEFAULT_OVERLAY_SETTINGS.background,
            padding,
          },
          displayItems: {
            ...DEFAULT_OVERLAY_SETTINGS.displayItems,
            brand: true,
          },
        };

        const result = await service.applyOverlay(mockImage, mockMetadata, settings);
        expect(result).toBeDefined();
      }
    });

    it('should support different border radius values', async () => {
      const mockImage = new MockImage() as unknown as HTMLImageElement;
      
      const borderRadiusValues = [0, 5, 10, 15, 20];
      
      for (const borderRadius of borderRadiusValues) {
        const settings: OverlaySettings = {
          ...DEFAULT_OVERLAY_SETTINGS,
          background: {
            ...DEFAULT_OVERLAY_SETTINGS.background,
            borderRadius,
          },
          displayItems: {
            ...DEFAULT_OVERLAY_SETTINGS.displayItems,
            brand: true,
          },
        };

        const result = await service.applyOverlay(mockImage, mockMetadata, settings);
        expect(result).toBeDefined();
      }
    });
  });

  describe('四个角落的位置选择功能', () => {
    it('should support all four corner positions', async () => {
      const mockImage = new MockImage() as unknown as HTMLImageElement;
      
      const positions: OverlaySettings['position'][] = [
        'top-left', 'top-right', 'bottom-left', 'bottom-right'
      ];
      
      for (const position of positions) {
        const settings: OverlaySettings = {
          ...DEFAULT_OVERLAY_SETTINGS,
          position,
          displayItems: {
            ...DEFAULT_OVERLAY_SETTINGS.displayItems,
            brand: true,
            model: true,
          },
        };

        const result = await service.applyOverlay(mockImage, mockMetadata, settings);
        expect(result).toBeDefined();
      }
    });
  });

  describe('选择性显示不同的信息项', () => {
    it('should display only selected metadata items', async () => {
      const mockImage = new MockImage() as unknown as HTMLImageElement;
      
      // 测试只显示品牌
      const brandOnlySettings: OverlaySettings = {
        ...DEFAULT_OVERLAY_SETTINGS,
        displayItems: {
          brand: true,
          model: false,
          aperture: false,
          shutterSpeed: false,
          iso: false,
          timestamp: false,
          location: false,
          brandLogo: false,
        },
      };

      const result1 = await service.applyOverlay(mockImage, mockMetadata, brandOnlySettings);
      expect(result1).toBeDefined();

      // 测试显示多个项目
      const multipleItemsSettings: OverlaySettings = {
        ...DEFAULT_OVERLAY_SETTINGS,
        displayItems: {
          brand: true,
          model: true,
          aperture: true,
          shutterSpeed: false,
          iso: false,
          timestamp: false,
          location: false,
          brandLogo: false,
        },
      };

      const result2 = await service.applyOverlay(mockImage, mockMetadata, multipleItemsSettings);
      expect(result2).toBeDefined();
    });

    it('should handle empty display items gracefully', async () => {
      const mockImage = new MockImage() as unknown as HTMLImageElement;
      
      const emptySettings: OverlaySettings = {
        ...DEFAULT_OVERLAY_SETTINGS,
        displayItems: {
          brand: false,
          model: false,
          aperture: false,
          shutterSpeed: false,
          iso: false,
          timestamp: false,
          location: false,
          brandLogo: false,
        },
      };

      const result = await service.applyOverlay(mockImage, mockMetadata, emptySettings);
      expect(result).toBeDefined();
    });

    it('should display all available metadata items', async () => {
      const mockImage = new MockImage() as unknown as HTMLImageElement;
      
      const allItemsSettings: OverlaySettings = {
        ...DEFAULT_OVERLAY_SETTINGS,
        displayItems: {
          brand: true,
          model: true,
          aperture: true,
          shutterSpeed: true,
          iso: true,
          timestamp: true,
          location: true,
          brandLogo: true,
        },
      };

      const result = await service.applyOverlay(mockImage, mockMetadata, allItemsSettings);
      expect(result).toBeDefined();
    });
  });

  describe('品牌Logo显示功能集成', () => {
    it('should integrate brand logo with text overlay', async () => {
      const mockImage = new MockImage() as unknown as HTMLImageElement;
      
      const logoSettings: OverlaySettings = {
        ...DEFAULT_OVERLAY_SETTINGS,
        displayItems: {
          ...DEFAULT_OVERLAY_SETTINGS.displayItems,
          brand: true,
          model: true,
          brandLogo: true,
        },
      };

      const result = await service.applyOverlay(mockImage, mockMetadata, logoSettings);
      expect(result).toBeDefined();
    });

    it('should handle logo loading failures gracefully', async () => {
      const mockImage = new MockImage() as unknown as HTMLImageElement;
      
      // 使用不存在的品牌来测试错误处理
      const metadataWithUnknownBrand: PhotoMetadata = {
        ...mockMetadata,
        exif: {
          ...mockMetadata.exif,
          make: 'UnknownBrand',
        },
      };

      const logoSettings: OverlaySettings = {
        ...DEFAULT_OVERLAY_SETTINGS,
        displayItems: {
          ...DEFAULT_OVERLAY_SETTINGS.displayItems,
          brand: true,
          brandLogo: true,
        },
      };

      const result = await service.applyOverlay(mockImage, metadataWithUnknownBrand, logoSettings);
      expect(result).toBeDefined();
    });
  });

  describe('综合功能测试', () => {
    it('should handle complex overlay configurations', async () => {
      const mockImage = new MockImage() as unknown as HTMLImageElement;
      
      const complexSettings: OverlaySettings = {
        position: 'bottom-right',
        font: {
          family: 'Arial',
          size: 18,
          color: '#ffffff',
          weight: 'bold',
        },
        background: {
          color: '#000000',
          opacity: 0.7,
          padding: 15,
          borderRadius: 8,
        },
        displayItems: {
          brand: true,
          model: true,
          aperture: true,
          shutterSpeed: true,
          iso: true,
          timestamp: false,
          location: false,
          brandLogo: true,
        },
      };

      const result = await service.applyOverlay(mockImage, mockMetadata, complexSettings);
      expect(result).toBeDefined();
      expect(result.width).toBe(1920);
      expect(result.height).toBe(1080);
    });

    it('should maintain image quality after overlay application', async () => {
      const mockImage = new MockImage() as unknown as HTMLImageElement;
      
      const result = await service.applyOverlay(mockImage, mockMetadata, DEFAULT_OVERLAY_SETTINGS);
      
      expect(result).toBeDefined();
      expect(result.width).toBe(mockImage.naturalWidth);
      expect(result.height).toBe(mockImage.naturalHeight);
    });
  });
});
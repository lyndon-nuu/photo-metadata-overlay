import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImagePreview } from '../useImagePreview';
import { PhotoMetadata, OverlaySettings, FrameSettings } from '../../types';
import { DEFAULT_OVERLAY_SETTINGS, DEFAULT_FRAME_SETTINGS } from '../../constants/design-tokens';

// Mock image processing service
vi.mock('../../services/image-processing.service', () => ({
  imageProcessingService: {
    loadImage: vi.fn(),
    applyOverlay: vi.fn(),
    applyFrame: vi.fn(),
    exportImage: vi.fn(),
  },
}));

// Mock Canvas API
class MockCanvas {
  width = 800;
  height = 600;
  
  getContext() {
    return {
      clearRect: vi.fn(),
      drawImage: vi.fn(),
    };
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

describe('useImagePreview', () => {
  let mockFile: File;
  let mockMetadata: PhotoMetadata;
  let overlaySettings: OverlaySettings;
  let frameSettings: FrameSettings;

  beforeEach(() => {
    // Mock DOM APIs
    Object.defineProperty(global, 'document', {
      value: {
        createElement: vi.fn(() => new MockCanvas()),
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn(),
        },
      },
    });

    Object.defineProperty(global, 'Image', {
      value: MockImage,
    });

    Object.defineProperty(global, 'URL', {
      value: {
        createObjectURL: vi.fn(() => 'blob:mock-url'),
        revokeObjectURL: vi.fn(),
      },
    });

    // Mock btoa
    global.btoa = vi.fn((str: string) => btoa(str));

    // Mock performance
    Object.defineProperty(global, 'performance', {
      value: {
        now: vi.fn(() => Date.now()),
      },
    });

    // 创建测试数据
    mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
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

    overlaySettings = { ...DEFAULT_OVERLAY_SETTINGS };
    frameSettings = { ...DEFAULT_FRAME_SETTINGS };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() =>
      useImagePreview(null, null, overlaySettings, frameSettings)
    );

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.processedBlob).toBeNull();
    expect(result.current.canvas).toBeNull();
    expect(result.current.cacheSize).toBe(0);
  });

  it('should process image when photo and file are provided', async () => {
    const { imageProcessingService } = await import('../../services/image-processing.service');
    
    // Mock successful processing
    const mockImage = new MockImage();
    const mockCanvas = new MockCanvas();
    const mockBlob = new Blob(['processed'], { type: 'image/jpeg' });

    vi.mocked(imageProcessingService.loadImage).mockResolvedValue(mockImage as any);
    vi.mocked(imageProcessingService.applyOverlay).mockResolvedValue(mockCanvas as any);
    vi.mocked(imageProcessingService.applyFrame).mockResolvedValue(mockCanvas as any);
    vi.mocked(imageProcessingService.exportImage).mockResolvedValue(mockBlob);

    const { result } = renderHook(() =>
      useImagePreview(mockMetadata, mockFile, overlaySettings, frameSettings)
    );

    // Wait for processing to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 400)); // Wait for debounce + processing
    });

    expect(result.current.processedBlob).toBe(mockBlob);
    expect(result.current.canvas).toBe(mockCanvas);
    expect(result.current.error).toBeNull();
    expect(result.current.isProcessing).toBe(false);
  });

  it('should handle processing errors', async () => {
    const { imageProcessingService } = await import('../../services/image-processing.service');
    
    // Mock processing error
    vi.mocked(imageProcessingService.loadImage).mockRejectedValue(new Error('Processing failed'));

    const { result } = renderHook(() =>
      useImagePreview(mockMetadata, mockFile, overlaySettings, frameSettings)
    );

    // Wait for processing to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
    });

    expect(result.current.error).toBe('Processing failed');
    expect(result.current.processedBlob).toBeNull();
    expect(result.current.isProcessing).toBe(false);
  });

  it('should debounce processing when settings change rapidly', async () => {
    const { imageProcessingService } = await import('../../services/image-processing.service');
    
    const mockImage = new MockImage();
    const mockCanvas = new MockCanvas();
    const mockBlob = new Blob(['processed'], { type: 'image/jpeg' });

    vi.mocked(imageProcessingService.loadImage).mockResolvedValue(mockImage as any);
    vi.mocked(imageProcessingService.applyOverlay).mockResolvedValue(mockCanvas as any);
    vi.mocked(imageProcessingService.applyFrame).mockResolvedValue(mockCanvas as any);
    vi.mocked(imageProcessingService.exportImage).mockResolvedValue(mockBlob);

    const { rerender } = renderHook(
      ({ settings }) => useImagePreview(mockMetadata, mockFile, settings, frameSettings),
      { initialProps: { settings: overlaySettings } }
    );

    // Rapidly change settings
    const newSettings1 = { ...overlaySettings, font: { ...overlaySettings.font, size: 20 } };
    const newSettings2 = { ...overlaySettings, font: { ...overlaySettings.font, size: 24 } };
    const newSettings3 = { ...overlaySettings, font: { ...overlaySettings.font, size: 28 } };

    rerender({ settings: newSettings1 });
    rerender({ settings: newSettings2 });
    rerender({ settings: newSettings3 });

    // Wait for debounce to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
    });

    // Should only process once due to debouncing
    expect(imageProcessingService.loadImage).toHaveBeenCalledTimes(1);
  });

  it('should use cache for repeated settings', async () => {
    const { imageProcessingService } = await import('../../services/image-processing.service');
    
    const mockImage = new MockImage();
    const mockCanvas = new MockCanvas();
    const mockBlob = new Blob(['processed'], { type: 'image/jpeg' });

    vi.mocked(imageProcessingService.loadImage).mockResolvedValue(mockImage as any);
    vi.mocked(imageProcessingService.applyOverlay).mockResolvedValue(mockCanvas as any);
    vi.mocked(imageProcessingService.applyFrame).mockResolvedValue(mockCanvas as any);
    vi.mocked(imageProcessingService.exportImage).mockResolvedValue(mockBlob);

    const { result, rerender } = renderHook(
      ({ settings }) => useImagePreview(mockMetadata, mockFile, settings, frameSettings, {
        enableCache: true,
        debounceMs: 100,
      }),
      { initialProps: { settings: overlaySettings } }
    );

    // Wait for initial processing
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    expect(result.current.cacheSize).toBe(1);

    // Change settings and then change back
    const newSettings = { ...overlaySettings, font: { ...overlaySettings.font, size: 20 } };
    rerender({ settings: newSettings });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    expect(result.current.cacheSize).toBe(2);

    // Change back to original settings
    rerender({ settings: overlaySettings });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    // Should use cache, so processing count shouldn't increase
    expect(imageProcessingService.loadImage).toHaveBeenCalledTimes(2);
    expect(result.current.cacheSize).toBe(2);
  });

  it('should clear cache when requested', async () => {
    const { result } = renderHook(() =>
      useImagePreview(mockMetadata, mockFile, overlaySettings, frameSettings, {
        enableCache: true,
      })
    );

    // Wait for processing
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
    });

    expect(result.current.cacheSize).toBeGreaterThan(0);

    // Clear cache
    act(() => {
      result.current.clearCache();
    });

    expect(result.current.cacheSize).toBe(0);
  });

  it('should process immediately when requested', async () => {
    const { imageProcessingService } = await import('../../services/image-processing.service');
    
    const mockImage = new MockImage();
    const mockCanvas = new MockCanvas();
    const mockBlob = new Blob(['processed'], { type: 'image/jpeg' });

    vi.mocked(imageProcessingService.loadImage).mockResolvedValue(mockImage as any);
    vi.mocked(imageProcessingService.applyOverlay).mockResolvedValue(mockCanvas as any);
    vi.mocked(imageProcessingService.applyFrame).mockResolvedValue(mockCanvas as any);
    vi.mocked(imageProcessingService.exportImage).mockResolvedValue(mockBlob);

    const { result } = renderHook(() =>
      useImagePreview(mockMetadata, mockFile, overlaySettings, frameSettings, {
        debounceMs: 1000, // Long debounce
      })
    );

    // Process immediately without waiting for debounce
    await act(async () => {
      result.current.processImage();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.processedBlob).toBe(mockBlob);
    expect(imageProcessingService.loadImage).toHaveBeenCalledTimes(1);
  });

  it('should handle cache size limit', async () => {
    const { imageProcessingService } = await import('../../services/image-processing.service');
    
    const mockImage = new MockImage();
    const mockCanvas = new MockCanvas();
    const mockBlob = new Blob(['processed'], { type: 'image/jpeg' });

    vi.mocked(imageProcessingService.loadImage).mockResolvedValue(mockImage as any);
    vi.mocked(imageProcessingService.applyOverlay).mockResolvedValue(mockCanvas as any);
    vi.mocked(imageProcessingService.applyFrame).mockResolvedValue(mockCanvas as any);
    vi.mocked(imageProcessingService.exportImage).mockResolvedValue(mockBlob);

    const { result, rerender } = renderHook(
      ({ settings }) => useImagePreview(mockMetadata, mockFile, settings, frameSettings, {
        enableCache: true,
        maxCacheSize: 2,
        debounceMs: 50,
      }),
      { initialProps: { settings: overlaySettings } }
    );

    // Process with different settings to fill cache beyond limit
    const settings1 = { ...overlaySettings, font: { ...overlaySettings.font, size: 16 } };
    const settings2 = { ...overlaySettings, font: { ...overlaySettings.font, size: 20 } };
    const settings3 = { ...overlaySettings, font: { ...overlaySettings.font, size: 24 } };

    rerender({ settings: settings1 });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    rerender({ settings: settings2 });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    rerender({ settings: settings3 });
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Cache should be limited to maxCacheSize
    expect(result.current.cacheSize).toBeLessThanOrEqual(2);
  });

  it('should not process when cache is disabled', async () => {
    const { result } = renderHook(() =>
      useImagePreview(mockMetadata, mockFile, overlaySettings, frameSettings, {
        enableCache: false,
      })
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
    });

    expect(result.current.cacheSize).toBe(0);
  });
});
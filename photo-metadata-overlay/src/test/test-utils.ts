import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { PhotoMetadata, OverlaySettings, FrameSettings } from '../types';
import { vi } from 'vitest';

// Mock data for testing
export const mockPhotoMetadata: PhotoMetadata = {
  fileName: 'test-image.jpg',
  filePath: '/test/path/test-image.jpg',
  fileSize: 1024000,
  mimeType: 'image/jpeg',
  dimensions: {
    width: 1920,
    height: 1080,
  },
  createdAt: new Date('2024-01-15T10:30:00Z'),
  modifiedAt: new Date('2024-01-15T10:30:00Z'),
  exif: {
    make: 'Canon',
    model: 'EOS R5',
    aperture: 'f/2.8',
    shutterSpeed: '1/125',
    iso: 'ISO 400',
    focalLength: '85mm',
    flash: 'Off',
    dateTimeOriginal: '2024-01-15T10:30:00Z',
    gps: {
      latitude: 40.7128,
      longitude: -74.0060,
      altitude: 10,
    },
    artist: 'Test Photographer',
    copyright: '© 2024 Test Photographer',
    imageDescription: 'Test portrait photo',
  },
};

export const mockOverlaySettings: OverlaySettings = {
  layoutMode: 'preset',
  position: 'bottom-right',
  customLayout: {
    elements: [],
    gridEnabled: true,
    gridSize: 20,
    snapToGrid: true,
  },
  font: {
    family: 'Arial',
    size: 16,
    weight: 'normal',
    color: '#ffffff',
  },
  background: {
    color: '#000000',
    opacity: 0.7,
    padding: 12,
    borderRadius: 4,
  },
  displayItems: {
    brand: true,
    model: true,
    aperture: true,
    shutterSpeed: true,
    iso: true,
    timestamp: true,
    location: false,
    brandLogo: true,
  },
};

export const mockFrameSettings: FrameSettings = {
  enabled: true,
  style: 'simple',
  color: '#ffffff',
  width: 20,
  opacity: 1.0,
  customProperties: {
    cornerRadius: 0,
    shadowBlur: 0,
    shadowOffset: { x: 0, y: 0 },
  },
};

// Create mock File object
export function createMockFile(
  name: string = 'test-image.jpg',
  type: string = 'image/jpeg',
  size: number = 1024000
): File {
  const content = new Uint8Array(size);
  return new File([content], name, { type });
}

// Create mock Image element
export function createMockImage(
  width: number = 1920,
  height: number = 1080
): HTMLImageElement {
  const img = new Image();
  Object.defineProperty(img, 'naturalWidth', {
    value: width,
    writable: false,
  });
  Object.defineProperty(img, 'naturalHeight', {
    value: height,
    writable: false,
  });
  Object.defineProperty(img, 'width', {
    value: width,
    writable: true,
  });
  Object.defineProperty(img, 'height', {
    value: height,
    writable: true,
  });
  return img;
}

// Create mock Canvas element
export function createMockCanvas(
  width: number = 1920,
  height: number = 1080
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  // Mock getContext method
  const mockContext = {
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    fillRect: vi.fn(),
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
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    globalAlpha: 1,
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    font: '16px Arial',
    textBaseline: 'top',
    shadowColor: 'transparent',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  };
  
  canvas.getContext = vi.fn(() => mockContext as any);
  
  // Mock toBlob method
  canvas.toBlob = vi.fn((callback) => {
    const blob = new Blob(['mock-image-data'], { type: 'image/jpeg' });
    callback?.(blob);
  });
  
  return canvas;
}

// Wait for async operations
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Custom render function with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { ...options });

export * from '@testing-library/react';
export { customRender as render };

// Performance testing utilities
export class PerformanceMonitor {
  private startTime: number = 0;
  private measurements: { [key: string]: number[] } = {};

  start(): void {
    this.startTime = performance.now();
  }

  end(label: string): number {
    const duration = performance.now() - this.startTime;
    if (!this.measurements[label]) {
      this.measurements[label] = [];
    }
    this.measurements[label].push(duration);
    return duration;
  }

  getAverage(label: string): number {
    const measurements = this.measurements[label];
    if (!measurements || measurements.length === 0) return 0;
    return measurements.reduce((a, b) => a + b, 0) / measurements.length;
  }

  getStats(label: string): { min: number; max: number; avg: number; count: number } {
    const measurements = this.measurements[label] || [];
    if (measurements.length === 0) {
      return { min: 0, max: 0, avg: 0, count: 0 };
    }
    
    return {
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      avg: this.getAverage(label),
      count: measurements.length,
    };
  }

  reset(): void {
    this.measurements = {};
  }
}

// Memory usage monitoring
export function getMemoryUsage(): {
  used: number;
  total: number;
  percentage: number;
} {
  if ('memory' in performance) {
    const memInfo = (performance as any).memory;
    return {
      used: memInfo.usedJSHeapSize,
      total: memInfo.totalJSHeapSize,
      percentage: (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100,
    };
  }
  
  return { used: 0, total: 0, percentage: 0 };
}

// Create large test files for performance testing
export function createLargeTestFile(
  width: number = 4000,
  height: number = 3000,
  name: string = 'large-test-image.jpg'
): File {
  // Simulate a large image file size
  const estimatedSize = width * height * 3; // 3 bytes per pixel (RGB)
  return createMockFile(name, 'image/jpeg', estimatedSize);
}

// Batch processing test utilities
export function createTestFilesBatch(count: number): PhotoMetadata[] {
  return Array.from({ length: count }, (_, index) => ({
    ...mockPhotoMetadata,
    fileName: `test-image-${index + 1}.jpg`,
    filePath: `/test/path/test-image-${index + 1}.jpg`,
  }));
}

// Error simulation utilities
export function simulateNetworkError(): void {
  // Mock fetch to throw network error
  global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
}

export function simulateMemoryError(): void {
  // Mock canvas creation to throw memory error
  const originalCreateElement = document.createElement;
  document.createElement = vi.fn((tagName: string) => {
    if (tagName === 'canvas') {
      throw new Error('Out of memory');
    }
    return originalCreateElement.call(document, tagName);
  });
}

export function restoreMocks(): void {
  vi.restoreAllMocks();
}
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
  camera: {
    make: 'Canon',
    model: 'EOS R5',
  },
  settings: {
    aperture: 'f/2.8',
    shutterSpeed: '1/125',
    iso: 400,
    focalLength: '85mm',
    flash: 'Off',
  },
  timestamp: new Date('2024-01-15T10:30:00Z'),
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    altitude: 10,
    address: 'New York, NY, USA',
  },
  keywords: ['portrait', 'outdoor'],
  description: 'Test portrait photo',
  copyright: '© 2024 Test Photographer',
};\n\nexport const mockOverlaySettings: OverlaySettings = {\n  enabled: true,\n  displayItems: {\n    camera: true,\n    settings: true,\n    timestamp: true,\n    location: false,\n    brandLogo: true,\n    customText: false,\n  },\n  position: 'bottom-right',\n  font: {\n    family: 'Arial',\n    size: 16,\n    weight: 'normal',\n    color: '#ffffff',\n  },\n  background: {\n    color: '#000000',\n    opacity: 0.7,\n    padding: 12,\n    borderRadius: 4,\n  },\n  customText: '',\n};\n\nexport const mockFrameSettings: FrameSettings = {\n  enabled: true,\n  style: 'simple',\n  color: '#ffffff',\n  width: 20,\n  opacity: 1.0,\n  customProperties: {\n    cornerRadius: 0,\n    shadowBlur: 0,\n    shadowOffset: { x: 0, y: 0 },\n  },\n};\n\n// Create mock File object\nexport function createMockFile(\n  name: string = 'test-image.jpg',\n  type: string = 'image/jpeg',\n  size: number = 1024000\n): File {\n  const content = new Uint8Array(size);\n  return new File([content], name, { type });\n}\n\n// Create mock Image element\nexport function createMockImage(\n  width: number = 1920,\n  height: number = 1080\n): HTMLImageElement {\n  const img = new Image();\n  Object.defineProperty(img, 'naturalWidth', {\n    value: width,\n    writable: false,\n  });\n  Object.defineProperty(img, 'naturalHeight', {\n    value: height,\n    writable: false,\n  });\n  Object.defineProperty(img, 'width', {\n    value: width,\n    writable: true,\n  });\n  Object.defineProperty(img, 'height', {\n    value: height,\n    writable: true,\n  });\n  return img;\n}\n\n// Create mock Canvas element\nexport function createMockCanvas(\n  width: number = 1920,\n  height: number = 1080\n): HTMLCanvasElement {\n  const canvas = document.createElement('canvas');\n  canvas.width = width;\n  canvas.height = height;\n  \n  // Mock getContext method\n  const mockContext = {\n    clearRect: vi.fn(),\n    drawImage: vi.fn(),\n    fillRect: vi.fn(),\n    fillText: vi.fn(),\n    measureText: vi.fn(() => ({ width: 100 })),\n    beginPath: vi.fn(),\n    moveTo: vi.fn(),\n    lineTo: vi.fn(),\n    quadraticCurveTo: vi.fn(),\n    closePath: vi.fn(),\n    fill: vi.fn(),\n    stroke: vi.fn(),\n    save: vi.fn(),\n    restore: vi.fn(),\n    createLinearGradient: vi.fn(() => ({\n      addColorStop: vi.fn(),\n    })),\n    imageSmoothingEnabled: true,\n    imageSmoothingQuality: 'high',\n    globalAlpha: 1,\n    fillStyle: '#000000',\n    strokeStyle: '#000000',\n    lineWidth: 1,\n    font: '16px Arial',\n    textBaseline: 'top',\n    shadowColor: 'transparent',\n    shadowBlur: 0,\n    shadowOffsetX: 0,\n    shadowOffsetY: 0,\n  };\n  \n  canvas.getContext = vi.fn(() => mockContext);\n  \n  // Mock toBlob method\n  canvas.toBlob = vi.fn((callback) => {\n    const blob = new Blob(['mock-image-data'], { type: 'image/jpeg' });\n    callback?.(blob);\n  });\n  \n  return canvas;\n}\n\n// Wait for async operations\nexport function waitFor(ms: number): Promise<void> {\n  return new Promise(resolve => setTimeout(resolve, ms));\n}\n\n// Custom render function with providers\nconst customRender = (\n  ui: ReactElement,\n  options?: Omit<RenderOptions, 'wrapper'>\n) => render(ui, { ...options });\n\nexport * from '@testing-library/react';\nexport { customRender as render };\n\n// Performance testing utilities\nexport class PerformanceMonitor {\n  private startTime: number = 0;\n  private measurements: { [key: string]: number[] } = {};\n\n  start(): void {\n    this.startTime = performance.now();\n  }\n\n  end(label: string): number {\n    const duration = performance.now() - this.startTime;\n    if (!this.measurements[label]) {\n      this.measurements[label] = [];\n    }\n    this.measurements[label].push(duration);\n    return duration;\n  }\n\n  getAverage(label: string): number {\n    const measurements = this.measurements[label];\n    if (!measurements || measurements.length === 0) return 0;\n    return measurements.reduce((a, b) => a + b, 0) / measurements.length;\n  }\n\n  getStats(label: string): { min: number; max: number; avg: number; count: number } {\n    const measurements = this.measurements[label] || [];\n    if (measurements.length === 0) {\n      return { min: 0, max: 0, avg: 0, count: 0 };\n    }\n    \n    return {\n      min: Math.min(...measurements),\n      max: Math.max(...measurements),\n      avg: this.getAverage(label),\n      count: measurements.length,\n    };\n  }\n\n  reset(): void {\n    this.measurements = {};\n  }\n}\n\n// Memory usage monitoring\nexport function getMemoryUsage(): {\n  used: number;\n  total: number;\n  percentage: number;\n} {\n  if ('memory' in performance) {\n    const memInfo = (performance as any).memory;\n    return {\n      used: memInfo.usedJSHeapSize,\n      total: memInfo.totalJSHeapSize,\n      percentage: (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100,\n    };\n  }\n  \n  return { used: 0, total: 0, percentage: 0 };\n}\n\n// Create large test files for performance testing\nexport function createLargeTestFile(\n  width: number = 4000,\n  height: number = 3000,\n  name: string = 'large-test-image.jpg'\n): File {\n  // Simulate a large image file size\n  const estimatedSize = width * height * 3; // 3 bytes per pixel (RGB)\n  return createMockFile(name, 'image/jpeg', estimatedSize);\n}\n\n// Batch processing test utilities\nexport function createTestFilesBatch(count: number): PhotoMetadata[] {\n  return Array.from({ length: count }, (_, index) => ({\n    ...mockPhotoMetadata,\n    fileName: `test-image-${index + 1}.jpg`,\n    filePath: `/test/path/test-image-${index + 1}.jpg`,\n  }));\n}\n\n// Error simulation utilities\nexport function simulateNetworkError(): void {\n  // Mock fetch to throw network error\n  global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));\n}\n\nexport function simulateMemoryError(): void {\n  // Mock canvas creation to throw memory error\n  const originalCreateElement = document.createElement;\n  document.createElement = vi.fn((tagName: string) => {\n    if (tagName === 'canvas') {\n      throw new Error('Out of memory');\n    }\n    return originalCreateElement.call(document, tagName);\n  });\n}\n\nexport function restoreMocks(): void {\n  vi.restoreAllMocks();\n}\n"
// Test setup file
import { vi, expect, afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// extends Vitest's expect
expect.extend(matchers);

// Setup DOM environment
beforeEach(() => {
  // Create a container div for React components
  const container = document.createElement('div');
  container.setAttribute('id', 'root');
  document.body.appendChild(container);
});

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
  // Clean up DOM
  document.body.innerHTML = '';
});



// Mock crypto.subtle for testing
Object.defineProperty(globalThis, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    },
  },
});

// Mock URL.createObjectURL and URL.revokeObjectURL
Object.defineProperty(globalThis, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn(),
  },
});

// Mock Image constructor
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 1920;
  naturalHeight = 1080;

  set src(_value: string) {
    // Simulate successful image load
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
}

Object.defineProperty(globalThis, 'Image', {
  value: MockImage,
});

// Mock Canvas API
class MockCanvas extends HTMLCanvasElement {
  width = 800;
  height = 600;
  
  getContext(): any {
    return {
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      measureText: vi.fn(() => ({ width: 100 })),
      fillText: vi.fn(),
      strokeText: vi.fn(),
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
  }

  toBlob(callback: (blob: Blob | null) => void) {
    // Simulate successful blob creation
    setTimeout(() => {
      callback(new Blob(['mock-canvas-data'], { type: 'image/jpeg' }));
    }, 0);
  }
}

// Mock HTMLCanvasElement
Object.defineProperty(globalThis, 'HTMLCanvasElement', {
  value: MockCanvas,
});

// Mock document.createElement for canvas elements
const originalCreateElement = document.createElement.bind(document);
document.createElement = vi.fn((tagName: string) => {
  if (tagName === 'canvas') {
    const canvas = originalCreateElement('canvas');
    // Add our mock methods to the real canvas element
    (canvas as any).getContext = vi.fn(() => ({
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      measureText: vi.fn(() => ({ width: 100 })),
      fillText: vi.fn(),
      strokeText: vi.fn(),
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
    }));
    canvas.toBlob = vi.fn((callback: (blob: Blob | null) => void) => {
      setTimeout(() => {
        callback(new Blob(['mock-canvas-data'], { type: 'image/jpeg' }));
      }, 0);
    });
    return canvas;
  }
  return originalCreateElement(tagName);
});

// Mock performance.now
Object.defineProperty(globalThis, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
  },
});

// Mock btoa for base64 encoding
Object.defineProperty(globalThis, 'btoa', {
  value: vi.fn((str: string) => btoa(str)),
});

// Mock File constructor
Object.defineProperty(globalThis, 'File', {
  value: class MockFile {
    name: string;
    size: number;
    type: string;
    lastModified: number;

    constructor(bits: BlobPart[], name: string, options?: FilePropertyBag) {
      this.name = name;
      this.size = bits.reduce((acc, bit) => {
        if (typeof bit === 'string') {
          return acc + bit.length;
        } else if (bit instanceof ArrayBuffer) {
          return acc + bit.byteLength;
        } else if (bit instanceof Uint8Array) {
          return acc + bit.byteLength;
        }
        return acc;
      }, 0);
      this.type = options?.type || '';
      this.lastModified = options?.lastModified || Date.now();
    }
  },
});

// Test setup file
import { vi } from 'vitest';

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

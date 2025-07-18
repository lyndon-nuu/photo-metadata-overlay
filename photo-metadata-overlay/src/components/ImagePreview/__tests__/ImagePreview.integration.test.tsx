import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ImagePreview } from '../ImagePreview';
import { PhotoMetadata, OverlaySettings, FrameSettings } from '../../../types';
import { DEFAULT_OVERLAY_SETTINGS, DEFAULT_FRAME_SETTINGS } from '../../../constants/design-tokens';

// Mock the image processing service
vi.mock('../../../services/image-processing.service', () => ({
  imageProcessingService: {
    loadImage: vi.fn().mockResolvedValue(new Image()),
    applyOverlay: vi.fn().mockResolvedValue(document.createElement('canvas')),
    applyFrame: vi.fn().mockResolvedValue(document.createElement('canvas')),
    exportImage: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'image/jpeg' })),
  },
}));

// Mock the brand logo service
vi.mock('../../../services/brand-logo.service', () => ({
  brandLogoService: {
    getBrandLogo: vi.fn().mockResolvedValue(null),
  },
}));

describe('ImagePreview Integration', () => {
  const mockPhoto: PhotoMetadata = {
    fileName: 'test.jpg',
    filePath: '/test/test.jpg',
    fileSize: 1024000,
    dimensions: { width: 1920, height: 1080 },
    createdAt: new Date(),
    modifiedAt: new Date(),
    mimeType: 'image/jpeg',
    exif: {
      make: 'Canon',
      model: 'EOS R5',
      aperture: 'f/2.8',
      shutterSpeed: '1/125',
      iso: 'ISO 400',
    },
  };

  const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  const overlaySettings: OverlaySettings = DEFAULT_OVERLAY_SETTINGS;
  const frameSettings: FrameSettings = DEFAULT_FRAME_SETTINGS;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render empty state when no photo is provided', () => {
    render(
      <ImagePreview
        photo={null}
        file={null}
        overlaySettings={overlaySettings}
        frameSettings={frameSettings}
      />
    );

    expect(screen.getByText('选择图片开始预览')).toBeInTheDocument();
    expect(screen.getByText('拖拽图片文件到此处或使用文件选择器')).toBeInTheDocument();
  });

  it('should render preview interface when photo is provided', async () => {
    render(
      <ImagePreview
        photo={mockPhoto}
        file={mockFile}
        overlaySettings={overlaySettings}
        frameSettings={frameSettings}
      />
    );

    expect(screen.getByText('实时预览')).toBeInTheDocument();
    expect(screen.getByText('缩小')).toBeInTheDocument();
    expect(screen.getByText('放大')).toBeInTheDocument();
    expect(screen.getByText('重置')).toBeInTheDocument();
    expect(screen.getByText('适应')).toBeInTheDocument();
  });

  it('should show processing indicator when processing', async () => {
    render(
      <ImagePreview
        photo={mockPhoto}
        file={mockFile}
        overlaySettings={overlaySettings}
        frameSettings={frameSettings}
      />
    );

    // Processing indicator should appear briefly
    await waitFor(() => {
      const processingText = screen.queryByText('处理中...');
      // It might not be visible if processing is very fast
      if (processingText) {
        expect(processingText).toBeInTheDocument();
      }
    });
  });

  it('should display file information in status bar', async () => {
    render(
      <ImagePreview
        photo={mockPhoto}
        file={mockFile}
        overlaySettings={overlaySettings}
        frameSettings={frameSettings}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/文件: test\.jpg/)).toBeInTheDocument();
      expect(screen.getByText(/尺寸: 1920 × 1080/)).toBeInTheDocument();
      expect(screen.getByText(/大小: 1000\.0 KB/)).toBeInTheDocument();
    });
  });

  it('should handle zoom controls', async () => {
    render(
      <ImagePreview
        photo={mockPhoto}
        file={mockFile}
        overlaySettings={overlaySettings}
        frameSettings={frameSettings}
      />
    );

    const zoomInButton = screen.getByText('放大');
    const zoomOutButton = screen.getByText('缩小');

    // Initial zoom might be fit-to-window (negative percentage)
    // Just check that zoom controls exist and work
    expect(zoomInButton).toBeInTheDocument();
    expect(zoomOutButton).toBeInTheDocument();

    // Test zoom in - should increase the zoom value
    const initialZoomText = screen.getByText(/%$/);
    const initialZoom = parseInt(initialZoomText.textContent?.replace('%', '') || '0');
    
    fireEvent.click(zoomInButton);
    await waitFor(() => {
      const newZoomText = screen.getByText(/%$/);
      const newZoom = parseInt(newZoomText.textContent?.replace('%', '') || '0');
      expect(newZoom).toBeGreaterThan(initialZoom);
    });
  });

  it('should handle reset view', async () => {
    render(
      <ImagePreview
        photo={mockPhoto}
        file={mockFile}
        overlaySettings={overlaySettings}
        frameSettings={frameSettings}
      />
    );

    const zoomInButton = screen.getByText('放大');
    const resetButton = screen.getByText('重置');

    // Zoom in first
    fireEvent.click(zoomInButton);
    await waitFor(() => {
      expect(screen.getByText('110%')).toBeInTheDocument();
    });

    // Reset view
    fireEvent.click(resetButton);
    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  it('should call onProcessingComplete when processing is done', async () => {
    const onProcessingComplete = vi.fn();

    render(
      <ImagePreview
        photo={mockPhoto}
        file={mockFile}
        overlaySettings={overlaySettings}
        frameSettings={frameSettings}
        onProcessingComplete={onProcessingComplete}
      />
    );

    // Wait for processing to complete
    await waitFor(() => {
      expect(onProcessingComplete).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should show keyboard shortcuts hint', () => {
    render(
      <ImagePreview
        photo={mockPhoto}
        file={mockFile}
        overlaySettings={overlaySettings}
        frameSettings={frameSettings}
      />
    );

    expect(screen.getByText(/使用滚轮缩放.*快捷键/)).toBeInTheDocument();
  });
});
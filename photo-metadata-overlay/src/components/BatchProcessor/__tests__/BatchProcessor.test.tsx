import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BatchProcessor } from '../BatchProcessor';
import { PhotoMetadata, OverlaySettings, FrameSettings } from '../../../types';
import { DEFAULT_OVERLAY_SETTINGS, DEFAULT_FRAME_SETTINGS } from '../../../constants/design-tokens';

// Mock image processing service
vi.mock('../../../services/image-processing.service', () => ({
  imageProcessingService: {
    loadImage: vi.fn(),
    applyOverlay: vi.fn(),
    applyFrame: vi.fn(),
    exportImage: vi.fn(),
  },
}));

describe('BatchProcessor', () => {
  let mockFiles: PhotoMetadata[];
  let overlaySettings: OverlaySettings;
  let frameSettings: FrameSettings;
  let onComplete: ReturnType<typeof vi.fn>;
  let onProgress: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        blob: () => Promise.resolve(new Blob(['test'], { type: 'image/jpeg' })),
      })
    ) as any;

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock document.createElement for download links
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') {
        return mockLink as any;
      }
      return document.createElement(tagName);
    });
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

    mockFiles = [
      {
        fileName: 'test1.jpg',
        filePath: 'test1.jpg',
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
      },
      {
        fileName: 'test2.jpg',
        filePath: 'test2.jpg',
        fileSize: 2048,
        dimensions: { width: 1920, height: 1080 },
        exif: {
          make: 'Nikon',
          model: 'D850',
          aperture: 'f/4.0',
          shutterSpeed: '1/60',
          iso: 'ISO 800',
        },
        createdAt: new Date(),
        modifiedAt: new Date(),
        mimeType: 'image/jpeg',
      },
    ];

    overlaySettings = { ...DEFAULT_OVERLAY_SETTINGS };
    frameSettings = { ...DEFAULT_FRAME_SETTINGS };
    onComplete = vi.fn();
    onProgress = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render batch processor with file count', () => {
    render(
      <BatchProcessor
        files={mockFiles}
        overlaySettings={overlaySettings}
        frameSettings={frameSettings}
        onComplete={onComplete}
        onProgress={onProgress}
      />
    );

    expect(screen.getByText('批量处理')).toBeInTheDocument();
    expect(screen.getByText('2 个文件')).toBeInTheDocument();
    expect(screen.getByText('开始处理')).toBeInTheDocument();
  });

  it('should show progress bar with initial state', () => {
    render(
      <BatchProcessor
        files={mockFiles}
        overlaySettings={overlaySettings}
        frameSettings={frameSettings}
        onComplete={onComplete}
        onProgress={onProgress}
      />
    );

    expect(screen.getByText('准备开始')).toBeInTheDocument();
    expect(screen.getByText('0 / 2 (0%)')).toBeInTheDocument();
  });

  it('should start processing when start button is clicked', async () => {
    const { imageProcessingService } = await import('../../../services/image-processing.service');
    
    // Mock successful processing
    const mockImage = {} as HTMLImageElement;
    const mockCanvas = {} as HTMLCanvasElement;
    const mockBlob = new Blob(['processed'], { type: 'image/jpeg' });

    vi.mocked(imageProcessingService.loadImage).mockResolvedValue(mockImage);
    vi.mocked(imageProcessingService.applyOverlay).mockResolvedValue(mockCanvas);
    vi.mocked(imageProcessingService.applyFrame).mockResolvedValue(mockCanvas);
    vi.mocked(imageProcessingService.exportImage).mockResolvedValue(mockBlob);

    render(
      <BatchProcessor
        files={mockFiles}
        overlaySettings={overlaySettings}
        frameSettings={frameSettings}
        onComplete={onComplete}
        onProgress={onProgress}
      />
    );

    const startButton = screen.getByText('开始处理');
    fireEvent.click(startButton);

    // Should show processing state
    await waitFor(() => {
      expect(screen.getByText('暂停')).toBeInTheDocument();
    });

    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.getByText('处理完成')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Should show results
    expect(screen.getByText('处理结果')).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalled();
  });

  it('should handle pause and resume functionality', async () => {
    const { imageProcessingService } = await import('../../../services/image-processing.service');
    
    // Mock processing with delay
    vi.mocked(imageProcessingService.loadImage).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({} as HTMLImageElement), 100))
    );
    vi.mocked(imageProcessingService.applyOverlay).mockResolvedValue({} as HTMLCanvasElement);
    vi.mocked(imageProcessingService.applyFrame).mockResolvedValue({} as HTMLCanvasElement);
    vi.mocked(imageProcessingService.exportImage).mockResolvedValue(new Blob());

    render(
      <BatchProcessor
        files={mockFiles}
        overlaySettings={overlaySettings}
        frameSettings={frameSettings}
        onComplete={onComplete}
        onProgress={onProgress}
      />
    );

    // Start processing
    const startButton = screen.getByText('开始处理');
    fireEvent.click(startButton);

    // Wait for processing to start
    await waitFor(() => {
      expect(screen.getByText('暂停')).toBeInTheDocument();
    });

    // Pause processing
    const pauseButton = screen.getByText('暂停');
    fireEvent.click(pauseButton);

    await waitFor(() => {
      expect(screen.getByText('已暂停')).toBeInTheDocument();
      expect(screen.getByText('继续')).toBeInTheDocument();
    });

    // Resume processing
    const resumeButton = screen.getByText('继续');
    fireEvent.click(resumeButton);

    await waitFor(() => {
      expect(screen.getByText('暂停')).toBeInTheDocument();
    });
  });

  it('should handle cancel functionality', async () => {
    const { imageProcessingService } = await import('../../../services/image-processing.service');
    
    // Mock processing with delay
    vi.mocked(imageProcessingService.loadImage).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({} as HTMLImageElement), 1000))
    );

    render(
      <BatchProcessor
        files={mockFiles}
        overlaySettings={overlaySettings}
        frameSettings={frameSettings}
        onComplete={onComplete}
        onProgress={onProgress}
      />
    );

    // Start processing
    const startButton = screen.getByText('开始处理');
    fireEvent.click(startButton);

    // Wait for processing to start
    await waitFor(() => {
      expect(screen.getByText('取消')).toBeInTheDocument();
    });

    // Cancel processing
    const cancelButton = screen.getByText('取消');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('已取消')).toBeInTheDocument();
      expect(screen.getByText('开始处理')).toBeInTheDocument();
    });
  });

  it('should handle processing errors gracefully', async () => {
    const { imageProcessingService } = await import('../../../services/image-processing.service');
    
    // Mock processing error
    vi.mocked(imageProcessingService.loadImage).mockRejectedValue(new Error('Processing failed'));

    render(
      <BatchProcessor
        files={mockFiles}
        overlaySettings={overlaySettings}
        frameSettings={frameSettings}
        onComplete={onComplete}
        onProgress={onProgress}
      />
    );

    const startButton = screen.getByText('开始处理');
    fireEvent.click(startButton);

    // Wait for processing to complete with errors
    await waitFor(() => {
      expect(screen.getByText('处理结果')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Should show error information
    expect(screen.getByText(/处理错误/)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Failed count
  });

  it('should show download buttons after successful processing', async () => {
    const { imageProcessingService } = await import('../../../services/image-processing.service');
    
    // Mock successful processing
    const mockBlob = new Blob(['processed'], { type: 'image/jpeg' });
    vi.mocked(imageProcessingService.loadImage).mockResolvedValue({} as HTMLImageElement);
    vi.mocked(imageProcessingService.applyOverlay).mockResolvedValue({} as HTMLCanvasElement);
    vi.mocked(imageProcessingService.applyFrame).mockResolvedValue({} as HTMLCanvasElement);
    vi.mocked(imageProcessingService.exportImage).mockResolvedValue(mockBlob);

    render(
      <BatchProcessor
        files={mockFiles}
        overlaySettings={overlaySettings}
        frameSettings={frameSettings}
        onComplete={onComplete}
        onProgress={onProgress}
      />
    );

    const startButton = screen.getByText('开始处理');
    fireEvent.click(startButton);

    // Wait for processing to complete
    await waitFor(() => {
      expect(screen.getByText('下载全部')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Should show individual download buttons
    const downloadButtons = screen.getAllByText('下载');
    expect(downloadButtons).toHaveLength(2); // One for each successful file
  });

  it('should handle empty file list', () => {
    render(
      <BatchProcessor
        files={[]}
        overlaySettings={overlaySettings}
        frameSettings={frameSettings}
        onComplete={onComplete}
        onProgress={onProgress}
      />
    );

    expect(screen.getByText('0 个文件')).toBeInTheDocument();
    
    const startButton = screen.getByText('开始处理');
    expect(startButton).toBeDisabled();
  });

  it('should call onProgress callback during processing', async () => {
    const { imageProcessingService } = await import('../../../services/image-processing.service');
    
    vi.mocked(imageProcessingService.loadImage).mockResolvedValue({} as HTMLImageElement);
    vi.mocked(imageProcessingService.applyOverlay).mockResolvedValue({} as HTMLCanvasElement);
    vi.mocked(imageProcessingService.applyFrame).mockResolvedValue({} as HTMLCanvasElement);
    vi.mocked(imageProcessingService.exportImage).mockResolvedValue(new Blob());

    render(
      <BatchProcessor
        files={mockFiles}
        overlaySettings={overlaySettings}
        frameSettings={frameSettings}
        onComplete={onComplete}
        onProgress={onProgress}
      />
    );

    const startButton = screen.getByText('开始处理');
    fireEvent.click(startButton);

    // Wait for processing to complete
    await waitFor(() => {
      expect(onProgress).toHaveBeenCalled();
    }, { timeout: 5000 });

    // Should have been called multiple times during processing
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        current: expect.any(Number),
        total: 2,
        currentFile: expect.any(String),
        percentage: expect.any(Number),
        status: expect.any(String),
      })
    );
  });
});
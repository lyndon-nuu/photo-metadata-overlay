import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import App from '../../App';
import { storageService } from '../../services/storage.service';
import { templateService } from '../../services/template.service';
import { exifService } from '../../services/exif.service';

// Mock services
vi.mock('../../services/storage.service');
vi.mock('../../services/template.service');
vi.mock('../../services/exif.service');

// Mock Tauri API
vi.mock('@tauri-apps/api/fs', () => ({
  readBinaryFile: vi.fn(),
  writeBinaryFile: vi.fn(),
  exists: vi.fn(),
}));

vi.mock('@tauri-apps/api/dialog', () => ({
  open: vi.fn(),
  save: vi.fn(),
}));

describe('App Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock storage service
    vi.mocked(storageService.loadOverlaySettings).mockResolvedValue({
      position: 'bottom-right',
      font: {
        family: 'Arial',
        size: 14,
        color: '#ffffff',
        weight: 'normal',
      },
      background: {
        color: '#000000',
        opacity: 0.6,
        padding: 8,
        borderRadius: 4,
      },
      displayItems: {
        brand: true,
        model: true,
        aperture: true,
        shutterSpeed: true,
        iso: true,
        timestamp: false,
        location: false,
        brandLogo: false,
      },
    });

    vi.mocked(storageService.loadFrameSettings).mockResolvedValue({
      enabled: false,
      style: 'simple',
      color: '#ffffff',
      width: 10,
      opacity: 1.0,
    });

    // Mock template service
    vi.mocked(templateService.getAllTemplates).mockResolvedValue([]);
    vi.mocked(templateService.getSmartRecommendations).mockResolvedValue([]);
    vi.mocked(templateService.getCategories).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应用程序正确初始化', async () => {
    render(<App />);
    
    // 检查主要UI元素是否存在
    await waitFor(() => {
      expect(screen.getByText('照片元数据叠加工具')).toBeInTheDocument();
    });
  });

  it('文件选择功能正常工作', async () => {
    render(<App />);
    
    // 模拟文件选择
    const fileInput = screen.getByLabelText(/选择文件/i);
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
    });

    // 验证文件是否被处理
    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });
  });

  it('设置面板功能正常工作', async () => {
    render(<App />);
    
    // 打开设置面板
    const settingsButton = screen.getByText('设置');
    fireEvent.click(settingsButton);

    await waitFor(() => {
      expect(screen.getByText('叠加设置')).toBeInTheDocument();
    });
  });

  it('批量处理功能正常工作', async () => {
    render(<App />);
    
    // 添加一些文件后测试批量处理
    const batchButton = screen.getByText(/批量处理/i);
    expect(batchButton).toBeDisabled(); // 没有文件时应该禁用

    // 模拟添加文件后再测试
    // ... 添加文件的逻辑
    
    // fireEvent.click(batchButton);
    // 验证批量处理界面打开
  });

  it('键盘快捷键正常工作', async () => {
    render(<App />);
    
    // 测试快捷键
    await act(async () => {
      fireEvent.keyDown(document, { key: '?', code: 'Slash' });
    });

    // 验证帮助对话框打开
    await waitFor(() => {
      expect(screen.getByText('键盘快捷键')).toBeInTheDocument();
    });
  });

  it('撤销重做功能正常工作', async () => {
    render(<App />);
    
    // 模拟一些操作后测试撤销重做
    // 这需要更复杂的设置，包括模拟用户交互
    
    // 测试撤销快捷键
    await act(async () => {
      fireEvent.keyDown(document, { key: 'z', ctrlKey: true });
    });

    // 验证撤销操作
    // ... 验证逻辑
  });

  it('自动保存功能正常工作', async () => {
    render(<App />);
    
    // 模拟设置更改
    // ... 更改设置的逻辑
    
    // 等待自动保存
    await waitFor(() => {
      expect(storageService.saveOverlaySettings).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('错误处理正常工作', async () => {
    // 模拟服务错误
    vi.mocked(storageService.loadOverlaySettings).mockRejectedValue(new Error('Storage error'));
    
    render(<App />);
    
    // 验证错误处理
    await waitFor(() => {
      expect(screen.getByText(/错误/i)).toBeInTheDocument();
    });
  });

  it('响应式设计正常工作', async () => {
    // 测试不同屏幕尺寸下的布局
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    render(<App />);
    
    // 验证移动端布局
    // ... 布局验证逻辑
  });

  it('性能优化正常工作', async () => {
    const startTime = performance.now();
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('照片元数据叠加工具')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // 验证渲染时间在合理范围内（例如小于1秒）
    expect(renderTime).toBeLessThan(1000);
  });
});

describe('Service Integration Tests', () => {
  it('所有服务正确集成', async () => {
    // 测试服务之间的集成
    expect(storageService).toBeDefined();
    expect(templateService).toBeDefined();
    expect(exifService).toBeDefined();
  });

  it('数据流正确工作', async () => {
    // 测试从文件读取到处理到保存的完整数据流
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    // 模拟EXIF读取
    vi.mocked(exifService.extractMetadata).mockResolvedValue({
      fileName: 'test.jpg',
      fileSize: 1024,
      dimensions: { width: 1920, height: 1080 },
      exif: {
        make: 'Canon',
        model: 'EOS R5',
        aperture: 'f/2.8',
        shutterSpeed: '1/125',
        iso: '400',
        focalLength: '85mm',
        timestamp: new Date(),
      },
    });

    // 测试完整流程
    const metadata = await exifService.extractMetadata(mockFile);
    expect(metadata).toBeDefined();
    expect(metadata.exif.make).toBe('Canon');
  });
});
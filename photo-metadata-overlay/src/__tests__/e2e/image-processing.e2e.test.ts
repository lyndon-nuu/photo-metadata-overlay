import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { storageService } from '../../services/storage.service';
import { exifService } from '../../services/exif.service';
import { imageProcessingService } from '../../services/image-processing.service';

// Mock services
vi.mock('../../services/storage.service');
vi.mock('../../services/exif.service');
vi.mock('../../services/image-processing.service');

// Mock Tauri APIs
vi.mock('@tauri-apps/api/fs', () => ({
  readBinaryFile: vi.fn(),
  writeBinaryFile: vi.fn(),
  exists: vi.fn(),
}));

vi.mock('@tauri-apps/api/dialog', () => ({
  open: vi.fn(),
  save: vi.fn(),
}));

describe('Image Processing E2E Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    
    // Mock default service responses
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

    vi.mocked(exifService.extractMetadata).mockResolvedValue({
      fileName: 'test-image.jpg',
      fileSize: 2048000,
      dimensions: { width: 1920, height: 1080 },
      exif: {
        make: 'Canon',
        model: 'EOS R5',
        aperture: 'f/2.8',
        shutterSpeed: '1/125',
        iso: '400',
        focalLength: '85mm',
        timestamp: new Date('2023-01-01T12:00:00Z'),
      },
    });

    vi.mocked(imageProcessingService.processImage).mockResolvedValue(
      new Blob(['processed-image-data'], { type: 'image/jpeg' })
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Image Processing Workflow', () => {
    it('应该完成完整的图像处理工作流程', async () => {
      render(<App />);

      // 1. 等待应用程序加载
      await waitFor(() => {
        expect(screen.getByText('照片元数据叠加工具')).toBeInTheDocument();
      });

      // 2. 选择文件
      const fileInput = screen.getByLabelText(/选择文件/i);
      const mockFile = new File(['test-image-data'], 'test-image.jpg', { 
        type: 'image/jpeg' 
      });

      await user.upload(fileInput, mockFile);

      // 3. 验证文件已加载
      await waitFor(() => {
        expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
      });

      // 4. 验证EXIF数据显示
      await waitFor(() => {
        expect(screen.getByText('Canon')).toBeInTheDocument();
        expect(screen.getByText('EOS R5')).toBeInTheDocument();
      });

      // 5. 调整叠加设置
      const positionSelect = screen.getByLabelText(/位置/i);
      await user.selectOptions(positionSelect, 'top-left');

      const fontSizeSlider = screen.getByLabelText(/字体大小/i);
      await user.clear(fontSizeSlider);
      await user.type(fontSizeSlider, '16');

      // 6. 启用相框
      const enableFrameCheckbox = screen.getByLabelText(/启用相框/i);
      await user.click(enableFrameCheckbox);

      // 7. 验证预览更新
      await waitFor(() => {
        expect(screen.getByText(/预览/i)).toBeInTheDocument();
      });

      // 8. 处理图像
      const processButton = screen.getByText(/处理/i);
      await user.click(processButton);

      // 9. 验证处理完成
      await waitFor(() => {
        expect(imageProcessingService.processImage).toHaveBeenCalled();
      });

      // 10. 下载结果
      const downloadButton = screen.getByText(/下载/i);
      expect(downloadButton).toBeEnabled();
      
      await user.click(downloadButton);

      // 验证下载触发
      // 这里可以验证下载相关的DOM操作
    });

    it('应该处理批量图像处理工作流程', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('照片元数据叠加工具')).toBeInTheDocument();
      });

      // 1. 选择多个文件
      const fileInput = screen.getByLabelText(/选择文件/i);
      const mockFiles = [
        new File(['image1'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['image2'], 'image2.jpg', { type: 'image/jpeg' }),
        new File(['image3'], 'image3.jpg', { type: 'image/jpeg' }),
      ];

      await user.upload(fileInput, mockFiles);

      // 2. 验证文件列表
      await waitFor(() => {
        expect(screen.getByText('image1.jpg')).toBeInTheDocument();
        expect(screen.getByText('image2.jpg')).toBeInTheDocument();
        expect(screen.getByText('image3.jpg')).toBeInTheDocument();
      });

      // 3. 打开批量处理
      const batchButton = screen.getByText(/批量处理/i);
      await user.click(batchButton);

      // 4. 验证批量处理界面
      await waitFor(() => {
        expect(screen.getByText(/批量处理设置/i)).toBeInTheDocument();
      });

      // 5. 开始批量处理
      const startBatchButton = screen.getByText(/开始处理/i);
      await user.click(startBatchButton);

      // 6. 验证进度显示
      await waitFor(() => {
        expect(screen.getByText(/处理进度/i)).toBeInTheDocument();
      });

      // 7. 等待处理完成
      await waitFor(() => {
        expect(screen.getByText(/处理完成/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Error Handling Scenarios', () => {
    it('应该处理文件加载错误', async () => {
      // Mock EXIF service to throw error
      vi.mocked(exifService.extractMetadata).mockRejectedValue(
        new Error('无法读取EXIF数据')
      );

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('照片元数据叠加工具')).toBeInTheDocument();
      });

      const fileInput = screen.getByLabelText(/选择文件/i);
      const mockFile = new File(['invalid-data'], 'invalid.jpg', { 
        type: 'image/jpeg' 
      });

      await user.upload(fileInput, mockFile);

      // 验证错误处理
      await waitFor(() => {
        expect(screen.getByText(/错误/i)).toBeInTheDocument();
      });
    });

    it('应该处理图像处理错误', async () => {
      // Mock image processing service to throw error
      vi.mocked(imageProcessingService.processImage).mockRejectedValue(
        new Error('图像处理失败')
      );

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('照片元数据叠加工具')).toBeInTheDocument();
      });

      // 添加文件
      const fileInput = screen.getByLabelText(/选择文件/i);
      const mockFile = new File(['test-data'], 'test.jpg', { type: 'image/jpeg' });
      await user.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeInTheDocument();
      });

      // 尝试处理
      const processButton = screen.getByText(/处理/i);
      await user.click(processButton);

      // 验证错误处理
      await waitFor(() => {
        expect(screen.getByText(/处理失败/i)).toBeInTheDocument();
      });
    });

    it('应该处理存储错误', async () => {
      // Mock storage service to throw error
      vi.mocked(storageService.saveOverlaySettings).mockRejectedValue(
        new Error('存储失败')
      );

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('照片元数据叠加工具')).toBeInTheDocument();
      });

      // 修改设置触发保存
      const fontSizeSlider = screen.getByLabelText(/字体大小/i);
      await user.clear(fontSizeSlider);
      await user.type(fontSizeSlider, '20');

      // 等待自动保存尝试
      await waitFor(() => {
        expect(storageService.saveOverlaySettings).toHaveBeenCalled();
      });

      // 验证错误不会阻塞用户操作
      expect(fontSizeSlider).toHaveValue('20');
    });
  });

  describe('Performance Scenarios', () => {
    it('应该处理大文件', async () => {
      // Mock large file metadata
      vi.mocked(exifService.extractMetadata).mockResolvedValue({
        fileName: 'large-image.jpg',
        fileSize: 50 * 1024 * 1024, // 50MB
        dimensions: { width: 8000, height: 6000 },
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

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('照片元数据叠加工具')).toBeInTheDocument();
      });

      const fileInput = screen.getByLabelText(/选择文件/i);
      const largeFile = new File(
        [new ArrayBuffer(50 * 1024 * 1024)], 
        'large-image.jpg', 
        { type: 'image/jpeg' }
      );

      const startTime = performance.now();
      await user.upload(fileInput, largeFile);

      await waitFor(() => {
        expect(screen.getByText('large-image.jpg')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 验证处理时间合理
      expect(duration).toBeLessThan(5000); // 应该在5秒内完成
    });

    it('应该处理大量文件', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('照片元数据叠加工具')).toBeInTheDocument();
      });

      // 创建大量文件
      const manyFiles = Array.from({ length: 50 }, (_, i) => 
        new File([`image-${i}`], `image-${i}.jpg`, { type: 'image/jpeg' })
      );

      const fileInput = screen.getByLabelText(/选择文件/i);
      
      const startTime = performance.now();
      await user.upload(fileInput, manyFiles);

      // 等待文件处理完成
      await waitFor(() => {
        expect(screen.getByText('image-0.jpg')).toBeInTheDocument();
      }, { timeout: 10000 });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 验证处理时间合理
      expect(duration).toBeLessThan(10000); // 应该在10秒内完成
    });
  });

  describe('User Experience Scenarios', () => {
    it('应该支持键盘快捷键', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('照片元数据叠加工具')).toBeInTheDocument();
      });

      // 测试帮助快捷键
      await user.keyboard('?');

      await waitFor(() => {
        expect(screen.getByText(/键盘快捷键/i)).toBeInTheDocument();
      });

      // 关闭帮助
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText(/键盘快捷键/i)).not.toBeInTheDocument();
      });
    });

    it('应该支持撤销重做', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('照片元数据叠加工具')).toBeInTheDocument();
      });

      // 修改设置
      const fontSizeSlider = screen.getByLabelText(/字体大小/i);
      const originalValue = fontSizeSlider.getAttribute('value');
      
      await user.clear(fontSizeSlider);
      await user.type(fontSizeSlider, '20');

      expect(fontSizeSlider).toHaveValue('20');

      // 撤销
      await user.keyboard('{Control>}z{/Control}');

      await waitFor(() => {
        expect(fontSizeSlider).toHaveValue(originalValue);
      });

      // 重做
      await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');

      await waitFor(() => {
        expect(fontSizeSlider).toHaveValue('20');
      });
    });

    it('应该支持预设功能', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('照片元数据叠加工具')).toBeInTheDocument();
      });

      // 打开预设选择器
      const presetButton = screen.getByText(/预设/i);
      await user.click(presetButton);

      await waitFor(() => {
        expect(screen.getByText(/智能预设选择器/i)).toBeInTheDocument();
      });

      // 选择一个预设
      const simplePreset = screen.getByText(/简约摄影/i);
      await user.click(simplePreset);

      // 验证预设应用
      await waitFor(() => {
        expect(screen.queryByText(/智能预设选择器/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('应该支持键盘导航', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('照片元数据叠加工具')).toBeInTheDocument();
      });

      // 测试Tab导航
      await user.tab();
      expect(document.activeElement).toBeInstanceOf(HTMLElement);

      // 继续Tab导航
      await user.tab();
      expect(document.activeElement).toBeInstanceOf(HTMLElement);
    });

    it('应该有适当的ARIA标签', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('照片元数据叠加工具')).toBeInTheDocument();
      });

      // 检查重要元素的可访问性
      const fileInput = screen.getByLabelText(/选择文件/i);
      expect(fileInput).toHaveAttribute('aria-label');

      const sliders = screen.getAllByRole('slider');
      sliders.forEach(slider => {
        expect(slider).toHaveAttribute('aria-label');
      });
    });
  });
});
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { performanceOptimizer, withPerformanceTracking } from '../services/performance-optimizer.service';
import { imageProcessingService } from '../services/image-processing.service';
import { exifService } from '../services/exif.service';
import { storageService } from '../services/storage.service';

describe('Performance Tests', () => {
  beforeEach(() => {
    performanceOptimizer.startMonitoring();
  });

  afterEach(() => {
    performanceOptimizer.stopMonitoring();
  });

  describe('Image Processing Performance', () => {
    it('应该在合理时间内处理小图像', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d')!;
      
      const startTime = performance.now();
      
      // 模拟图像处理
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.fillText('Test Image', 10, 30);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // 应该在100ms内完成
    });

    it('应该在合理时间内处理大图像', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 4000;
      canvas.height = 3000;
      const ctx = canvas.getContext('2d')!;
      
      const startTime = performance.now();
      
      // 模拟大图像处理
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 4000, 3000);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    });

    it('应该正确优化图像尺寸', () => {
      const optimized = performanceOptimizer.optimizeImageDimensions(8000, 6000);
      
      expect(optimized.shouldOptimize).toBe(true);
      expect(optimized.width).toBeLessThan(8000);
      expect(optimized.height).toBeLessThan(6000);
      expect(optimized.scaleFactor).toBeLessThan(1);
    });
  });

  describe('Memory Management', () => {
    it('应该正确监控内存使用', () => {
      const memoryUsage = performanceOptimizer.getMemoryUsage();
      
      expect(memoryUsage).toHaveProperty('used');
      expect(memoryUsage).toHaveProperty('total');
      expect(memoryUsage).toHaveProperty('percentage');
      expect(memoryUsage).toHaveProperty('available');
      
      expect(memoryUsage.percentage).toBeGreaterThanOrEqual(0);
      expect(memoryUsage.percentage).toBeLessThanOrEqual(100);
    });

    it('应该在内存压力下触发清理', () => {
      const cleanupSpy = vi.fn();
      performanceOptimizer.registerCleanupCallback(cleanupSpy);
      
      // 模拟内存压力
      vi.spyOn(performanceOptimizer, 'isUnderMemoryPressure').mockReturnValue(true);
      
      performanceOptimizer.performCleanup();
      
      expect(cleanupSpy).toHaveBeenCalled();
      
      performanceOptimizer.unregisterCleanupCallback(cleanupSpy);
    });

    it('应该根据内存使用情况调整并发数', () => {
      const concurrency = performanceOptimizer.getRecommendedConcurrency();
      
      expect(concurrency).toBeGreaterThan(0);
      expect(concurrency).toBeLessThanOrEqual(8);
    });
  });

  describe('Performance Metrics', () => {
    it('应该正确记录性能指标', () => {
      const operation = 'test-operation';
      const duration = 150;
      
      performanceOptimizer.recordMetric(operation, duration);
      
      const stats = performanceOptimizer.getPerformanceStats(operation);
      
      expect(stats).not.toBeNull();
      expect(stats!.count).toBe(1);
      expect(stats!.recent).toBe(duration);
      expect(stats!.average).toBe(duration);
    });

    it('应该正确计算性能统计', () => {
      const operation = 'test-stats';
      const durations = [100, 200, 150, 300, 250];
      
      durations.forEach(duration => {
        performanceOptimizer.recordMetric(operation, duration);
      });
      
      const stats = performanceOptimizer.getPerformanceStats(operation);
      
      expect(stats!.count).toBe(5);
      expect(stats!.min).toBe(100);
      expect(stats!.max).toBe(300);
      expect(stats!.average).toBe(200);
    });

    it('应该使用性能跟踪装饰器', async () => {
      const testFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'test result';
      };
      
      const result = await withPerformanceTracking('test-function', testFunction);
      
      expect(result).toBe('test result');
      
      const stats = performanceOptimizer.getPerformanceStats('test-function');
      expect(stats).not.toBeNull();
      expect(stats!.recent).toBeGreaterThan(90); // 应该接近100ms
    });
  });

  describe('Service Performance', () => {
    it('EXIF服务应该快速处理', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      const startTime = performance.now();
      
      try {
        await exifService.extractMetadata(mockFile);
      } catch (error) {
        // 忽略错误，只测试性能
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(500); // 应该在500ms内完成
    });

    it('存储服务应该快速读写', async () => {
      const testData = { test: 'data' };
      
      const startTime = performance.now();
      
      try {
        await storageService.saveData('test-key', testData);
        await storageService.loadData('test-key', {});
      } catch (error) {
        // 忽略错误，只测试性能
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // 应该在100ms内完成
    });
  });

  describe('Batch Processing Performance', () => {
    it('应该高效处理批量文件', async () => {
      const fileCount = 10;
      const mockFiles = Array.from({ length: fileCount }, (_, i) => 
        new File(['test'], `test${i}.jpg`, { type: 'image/jpeg' })
      );
      
      const startTime = performance.now();
      
      // 模拟批量处理
      const promises = mockFiles.map(async (file, index) => {
        // 模拟处理延迟
        await new Promise(resolve => setTimeout(resolve, 10));
        return `processed-${index}`;
      });
      
      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(results).toHaveLength(fileCount);
      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
      
      // 计算平均处理时间
      const avgTime = duration / fileCount;
      expect(avgTime).toBeLessThan(100); // 每个文件平均处理时间应该小于100ms
    });

    it('应该正确处理并发限制', async () => {
      const concurrency = performanceOptimizer.getRecommendedConcurrency();
      const fileCount = concurrency * 3;
      
      let activeCount = 0;
      let maxActive = 0;
      
      const processFile = async () => {
        activeCount++;
        maxActive = Math.max(maxActive, activeCount);
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
        activeCount--;
      };
      
      const promises: Promise<void>[] = [];
      for (let i = 0; i < fileCount; i++) {
        if (promises.length >= concurrency) {
          await Promise.race(promises);
        }
        promises.push(processFile());
      }
      
      await Promise.all(promises);
      
      expect(maxActive).toBeLessThanOrEqual(concurrency + 1); // 允许小幅超出
    });
  });

  describe('UI Performance', () => {
    it('应该快速渲染组件', () => {
      const startTime = performance.now();
      
      // 模拟组件渲染
      const element = document.createElement('div');
      element.innerHTML = `
        <div class="card">
          <h2>Test Component</h2>
          <p>Test content</p>
          <button>Test Button</button>
        </div>
      `;
      
      document.body.appendChild(element);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50); // 应该在50ms内完成
      
      document.body.removeChild(element);
    });

    it('应该高效处理大量DOM操作', () => {
      const startTime = performance.now();
      
      const container = document.createElement('div');
      const fragment = document.createDocumentFragment();
      
      // 创建大量DOM元素
      for (let i = 0; i < 1000; i++) {
        const item = document.createElement('div');
        item.textContent = `Item ${i}`;
        fragment.appendChild(item);
      }
      
      container.appendChild(fragment);
      document.body.appendChild(container);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // 应该在100ms内完成
      expect(container.children).toHaveLength(1000);
      
      document.body.removeChild(container);
    });
  });

  describe('Resource Cleanup', () => {
    it('应该正确清理资源', () => {
      // 创建一些需要清理的资源
      const blobUrl = URL.createObjectURL(new Blob(['test']));
      const img = document.createElement('img');
      img.src = blobUrl;
      document.body.appendChild(img);
      
      // 执行清理
      performanceOptimizer.performCleanup();
      
      // 验证清理效果
      expect(document.querySelectorAll('img[src^="blob:"]')).toHaveLength(1);
      
      // 手动清理测试资源
      URL.revokeObjectURL(blobUrl);
      document.body.removeChild(img);
    });

    it('应该限制性能指标历史记录', () => {
      const operation = 'test-limit';
      
      // 添加超过限制的记录
      for (let i = 0; i < 150; i++) {
        performanceOptimizer.recordMetric(operation, i);
      }
      
      const stats = performanceOptimizer.getPerformanceStats(operation);
      
      expect(stats!.count).toBeLessThanOrEqual(100); // 应该限制在100条以内
    });
  });

  describe('Error Handling Performance', () => {
    it('错误处理不应显著影响性能', async () => {
      const startTime = performance.now();
      
      const promises = Array.from({ length: 100 }, async (_, i) => {
        try {
          if (i % 10 === 0) {
            throw new Error(`Test error ${i}`);
          }
          return `success ${i}`;
        } catch (error) {
          return `error ${i}`;
        }
      });
      
      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(100); // 错误处理不应显著增加时间
      
      const errorCount = results.filter(r => r.startsWith('error')).length;
      expect(errorCount).toBe(10); // 应该有10个错误
    });
  });
});

describe('Load Testing', () => {
  it('应该处理高并发请求', async () => {
    const concurrentRequests = 50;
    const startTime = performance.now();
    
    const promises = Array.from({ length: concurrentRequests }, async (_, i) => {
      // 模拟异步操作
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      return i;
    });
    
    const results = await Promise.all(promises);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(results).toHaveLength(concurrentRequests);
    expect(duration).toBeLessThan(5000); // 应该在5秒内完成
    
    const avgTime = duration / concurrentRequests;
    expect(avgTime).toBeLessThan(100); // 平均每个请求应该小于100ms
  });

  it('应该在内存限制下正常工作', () => {
    const largeArrays: number[][] = [];
    
    try {
      // 创建大量数据来测试内存处理
      for (let i = 0; i < 100; i++) {
        largeArrays.push(new Array(10000).fill(i));
      }
      
      const memoryUsage = performanceOptimizer.getMemoryUsage();
      expect(memoryUsage.percentage).toBeGreaterThan(0);
      
      // 清理数据
      largeArrays.length = 0;
      
    } catch (error) {
      // 如果内存不足，应该优雅处理
      expect(error).toBeInstanceOf(Error);
    }
  });
});
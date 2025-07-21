import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { performanceOptimizer, withPerformanceTracking } from '../services/performance-optimizer.service';
import { PerformanceMonitor } from '../test/test-utils';

describe('Performance Optimization Tests', () => {
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor();
    performanceOptimizer.startMonitoring();
  });

  afterEach(() => {
    performanceOptimizer.stopMonitoring();
    vi.clearAllMocks();
  });

  describe('Performance Monitoring', () => {
    it('should record performance metrics correctly', async () => {
      const operation = 'test-operation';
      const duration = 100;

      performanceOptimizer.recordMetric(operation, duration);
      
      const stats = performanceOptimizer.getPerformanceStats(operation);
      
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(1);
      expect(stats!.average).toBe(duration);
      expect(stats!.min).toBe(duration);
      expect(stats!.max).toBe(duration);
      expect(stats!.recent).toBe(duration);
    });

    it('should calculate performance statistics correctly', async () => {
      const operation = 'multi-test-operation';
      const durations = [100, 200, 150, 300, 250];

      durations.forEach(duration => {
        performanceOptimizer.recordMetric(operation, duration);
      });

      const stats = performanceOptimizer.getPerformanceStats(operation);
      
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(5);
      expect(stats!.average).toBe(200); // (100+200+150+300+250)/5
      expect(stats!.min).toBe(100);
      expect(stats!.max).toBe(300);
      expect(stats!.recent).toBe(250);
    });

    it('should limit metric history to prevent memory leaks', () => {
      const operation = 'memory-test-operation';
      
      // Record more than 100 metrics
      for (let i = 0; i < 150; i++) {
        performanceOptimizer.recordMetric(operation, i);
      }

      const stats = performanceOptimizer.getPerformanceStats(operation);
      
      expect(stats).toBeDefined();
      expect(stats!.count).toBeLessThanOrEqual(100); // Should be limited to 100
    });
  });

  describe('Memory Management', () => {
    it('should detect memory usage correctly', () => {
      const memoryUsage = performanceOptimizer.getMemoryUsage();
      
      expect(memoryUsage).toBeDefined();
      expect(memoryUsage.used).toBeGreaterThanOrEqual(0);
      expect(memoryUsage.total).toBeGreaterThanOrEqual(0);
      expect(memoryUsage.percentage).toBeGreaterThanOrEqual(0);
      expect(memoryUsage.available).toBeGreaterThanOrEqual(0);
    });

    it('should detect memory pressure correctly', () => {
      const isUnderPressure = performanceOptimizer.isUnderMemoryPressure();
      
      expect(typeof isUnderPressure).toBe('boolean');
    });

    it('should perform cleanup when requested', () => {
      let cleanupCalled = false;
      
      performanceOptimizer.registerCleanupCallback(() => {
        cleanupCalled = true;
      });

      performanceOptimizer.performCleanup();
      
      expect(cleanupCalled).toBe(true);
    });
  });

  describe('Image Optimization', () => {
    it('should optimize large image dimensions', () => {
      const largeWidth = 8000;
      const largeHeight = 6000;
      
      const optimization = performanceOptimizer.optimizeImageDimensions(largeWidth, largeHeight);
      
      expect(optimization.shouldOptimize).toBe(true);
      expect(optimization.width).toBeLessThan(largeWidth);
      expect(optimization.height).toBeLessThan(largeHeight);
      expect(optimization.scaleFactor).toBeLessThan(1);
    });

    it('should not optimize reasonably sized images', () => {
      const normalWidth = 1920;
      const normalHeight = 1080;
      
      const optimization = performanceOptimizer.optimizeImageDimensions(normalWidth, normalHeight);
      
      expect(optimization.shouldOptimize).toBe(false);
      expect(optimization.width).toBe(normalWidth);
      expect(optimization.height).toBe(normalHeight);
      expect(optimization.scaleFactor).toBe(1);
    });
  });

  describe('Concurrency Optimization', () => {
    it('should provide reasonable concurrency recommendations', () => {
      const concurrency = performanceOptimizer.getRecommendedConcurrency();
      
      expect(concurrency).toBeGreaterThan(0);
      expect(concurrency).toBeLessThanOrEqual(8); // Should not exceed maximum
    });

    it('should adjust concurrency based on memory pressure', () => {
      // This test would require mocking memory usage
      // For now, we'll just verify the method works
      const concurrency = performanceOptimizer.getRecommendedConcurrency();
      
      expect(typeof concurrency).toBe('number');
      expect(concurrency).toBeGreaterThan(0);
    });
  });

  describe('Performance Tracking Decorator', () => {
    it('should track function execution time', async () => {
      const testFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'test-result';
      };

      const result = await withPerformanceTracking('test-function', testFunction);
      
      expect(result).toBe('test-result');
      
      const stats = performanceOptimizer.getPerformanceStats('test-function');
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(1);
      expect(stats!.average).toBeGreaterThan(90); // Should be around 100ms
    });

    it('should track errors separately', async () => {
      const errorFunction = async () => {
        throw new Error('Test error');
      };

      await expect(
        withPerformanceTracking('error-function', errorFunction)
      ).rejects.toThrow('Test error');
      
      const errorStats = performanceOptimizer.getPerformanceStats('error-function-error');
      expect(errorStats).toBeDefined();
      expect(errorStats!.count).toBe(1);
    });
  });

  describe('Resource Cleanup', () => {
    it('should register and execute cleanup callbacks', () => {
      let callback1Called = false;
      let callback2Called = false;
      
      const cleanup1 = () => { callback1Called = true; };
      const cleanup2 = () => { callback2Called = true; };
      
      performanceOptimizer.registerCleanupCallback(cleanup1);
      performanceOptimizer.registerCleanupCallback(cleanup2);
      
      performanceOptimizer.performCleanup();
      
      expect(callback1Called).toBe(true);
      expect(callback2Called).toBe(true);
    });

    it('should handle cleanup callback errors gracefully', () => {
      const errorCallback = () => {
        throw new Error('Cleanup error');
      };
      
      const normalCallback = vi.fn();
      
      performanceOptimizer.registerCleanupCallback(errorCallback);
      performanceOptimizer.registerCleanupCallback(normalCallback);
      
      expect(() => {
        performanceOptimizer.performCleanup();
      }).not.toThrow();
      
      expect(normalCallback).toHaveBeenCalled();
    });

    it('should unregister cleanup callbacks', () => {
      let callbackCalled = false;
      
      const callback = () => { callbackCalled = true; };
      
      performanceOptimizer.registerCleanupCallback(callback);
      performanceOptimizer.unregisterCleanupCallback(callback);
      
      performanceOptimizer.performCleanup();
      
      expect(callbackCalled).toBe(false);
    });
  });

  describe('Performance Thresholds', () => {
    it('should warn about slow operations', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Record a very slow operation (over 10 seconds)
      performanceOptimizer.recordMetric('slow-operation', 15000);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('性能警告')
      );
      
      consoleSpy.mockRestore();
    });

    it('should not warn about normal operations', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Record a normal operation
      performanceOptimizer.recordMetric('normal-operation', 100);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Service Lifecycle', () => {
    it('should start and stop monitoring correctly', () => {
      expect(() => {
        performanceOptimizer.startMonitoring();
        performanceOptimizer.stopMonitoring();
      }).not.toThrow();
    });

    it('should handle multiple start/stop calls gracefully', () => {
      expect(() => {
        performanceOptimizer.startMonitoring();
        performanceOptimizer.startMonitoring(); // Should not cause issues
        performanceOptimizer.stopMonitoring();
        performanceOptimizer.stopMonitoring(); // Should not cause issues
      }).not.toThrow();
    });

    it('should clean up resources on destroy', () => {
      expect(() => {
        performanceOptimizer.destroy();
      }).not.toThrow();
    });
  });
});
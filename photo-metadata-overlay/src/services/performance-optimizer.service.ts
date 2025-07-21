/**
 * 性能优化服务
 * 负责监控和优化应用程序性能，包括内存管理、资源清理和性能监控
 */
export class PerformanceOptimizerService {
  private memoryCheckInterval: number | null = null;
  private performanceMetrics: Map<string, number[]> = new Map();
  private resourceCleanupCallbacks: Set<() => void> = new Set();
  private isMonitoring: boolean = false;

  // 性能阈值配置
  private readonly thresholds = {
    memoryUsagePercent: 80, // 内存使用率阈值
    maxCacheSize: 50 * 1024 * 1024, // 最大缓存大小 (50MB)
    maxProcessingTime: 10000, // 最大处理时间 (10秒)
    gcTriggerThreshold: 0.85, // 触发垃圾回收的内存使用率
  };

  constructor() {
    this.setupPerformanceMonitoring();
    this.setupMemoryPressureHandling();
  }

  /**
   * 开始性能监控
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    
    // 每30秒检查一次内存使用情况
    this.memoryCheckInterval = window.setInterval(() => {
      this.checkMemoryUsage();
    }, 30000);

    console.log('性能监控已启动');
  }

  /**
   * 停止性能监控
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }

    console.log('性能监控已停止');
  }

  /**
   * 记录性能指标
   * @param operation 操作名称
   * @param duration 持续时间（毫秒）
   */
  recordMetric(operation: string, duration: number): void {
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, []);
    }
    
    const metrics = this.performanceMetrics.get(operation)!;
    metrics.push(duration);
    
    // 只保留最近100次记录
    if (metrics.length > 100) {
      metrics.shift();
    }

    // 检查是否超过性能阈值
    if (duration > this.thresholds.maxProcessingTime) {
      console.warn(`性能警告: ${operation} 耗时 ${duration}ms，超过阈值 ${this.thresholds.maxProcessingTime}ms`);
    }
  }

  /**
   * 获取性能统计信息
   * @param operation 操作名称
   * @returns 性能统计
   */
  getPerformanceStats(operation: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    recent: number;
  } | null {
    const metrics = this.performanceMetrics.get(operation);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    return {
      count: metrics.length,
      average: metrics.reduce((a, b) => a + b, 0) / metrics.length,
      min: Math.min(...metrics),
      max: Math.max(...metrics),
      recent: metrics[metrics.length - 1],
    };
  }

  /**
   * 获取所有性能统计信息
   */
  getAllPerformanceStats(): { [operation: string]: any } {
    const stats: { [operation: string]: any } = {};
    
    for (const [operation] of this.performanceMetrics) {
      stats[operation] = this.getPerformanceStats(operation);
    }
    
    return stats;
  }

  /**
   * 注册资源清理回调
   * @param callback 清理回调函数
   */
  registerCleanupCallback(callback: () => void): void {
    this.resourceCleanupCallbacks.add(callback);
  }

  /**
   * 取消注册资源清理回调
   * @param callback 清理回调函数
   */
  unregisterCleanupCallback(callback: () => void): void {
    this.resourceCleanupCallbacks.delete(callback);
  }

  /**
   * 执行资源清理
   */
  performCleanup(): void {
    console.log('执行资源清理...');
    
    // 执行所有注册的清理回调
    this.resourceCleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('资源清理回调执行失败:', error);
      }
    });

    // 清理性能指标历史数据
    this.cleanupPerformanceMetrics();

    // 尝试触发垃圾回收
    this.triggerGarbageCollection();

    console.log('资源清理完成');
  }

  /**
   * 获取当前内存使用情况
   */
  getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
    available: number;
  } {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const used = memInfo.usedJSHeapSize;
      const total = memInfo.totalJSHeapSize;
      const limit = memInfo.jsHeapSizeLimit;
      
      return {
        used,
        total,
        percentage: (used / limit) * 100,
        available: limit - used,
      };
    }
    
    return {
      used: 0,
      total: 0,
      percentage: 0,
      available: 0,
    };
  }

  /**
   * 检查系统是否处于内存压力状态
   */
  isUnderMemoryPressure(): boolean {
    const memoryUsage = this.getMemoryUsage();
    return memoryUsage.percentage > this.thresholds.memoryUsagePercent;
  }

  /**
   * 优化图像处理参数
   * @param originalWidth 原始宽度
   * @param originalHeight 原始高度
   * @returns 优化后的尺寸
   */
  optimizeImageDimensions(originalWidth: number, originalHeight: number): {
    width: number;
    height: number;
    scaleFactor: number;
    shouldOptimize: boolean;
  } {
    const memoryUsage = this.getMemoryUsage();
    const maxDimension = this.calculateMaxDimension(memoryUsage.percentage);
    
    let width = originalWidth;
    let height = originalHeight;
    let scaleFactor = 1;
    let shouldOptimize = false;

    // 如果图像尺寸超过推荐值，进行缩放
    if (Math.max(originalWidth, originalHeight) > maxDimension) {
      if (originalWidth > originalHeight) {
        scaleFactor = maxDimension / originalWidth;
        width = maxDimension;
        height = Math.round(originalHeight * scaleFactor);
      } else {
        scaleFactor = maxDimension / originalHeight;
        height = maxDimension;
        width = Math.round(originalWidth * scaleFactor);
      }
      shouldOptimize = true;
    }

    return {
      width,
      height,
      scaleFactor,
      shouldOptimize,
    };
  }

  /**
   * 获取推荐的并发处理数量
   */
  getRecommendedConcurrency(): number {
    const memoryUsage = this.getMemoryUsage();
    const cpuCores = navigator.hardwareConcurrency || 4;
    
    // 根据内存使用情况调整并发数
    if (memoryUsage.percentage > 70) {
      return Math.max(1, Math.floor(cpuCores / 4));
    } else if (memoryUsage.percentage > 50) {
      return Math.max(2, Math.floor(cpuCores / 2));
    } else {
      return Math.min(cpuCores, 8); // 最多8个并发
    }
  }

  /**
   * 设置性能监控
   */
  private setupPerformanceMonitoring(): void {
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // 页面隐藏时执行清理
        this.performCleanup();
      } else {
        // 页面显示时开始监控
        this.startMonitoring();
      }
    });

    // 监听页面卸载事件
    window.addEventListener('beforeunload', () => {
      this.stopMonitoring();
      this.performCleanup();
    });
  }

  /**
   * 设置内存压力处理
   */
  private setupMemoryPressureHandling(): void {
    // 如果支持内存压力事件，监听它
    if ('memory' in performance) {
      // 定期检查内存使用情况
      this.startMonitoring();
    }
  }

  /**
   * 检查内存使用情况
   */
  private checkMemoryUsage(): void {
    const memoryUsage = this.getMemoryUsage();
    
    if (memoryUsage.percentage > this.thresholds.gcTriggerThreshold * 100) {
      console.warn(`内存使用率过高: ${memoryUsage.percentage.toFixed(1)}%`);
      this.performCleanup();
    }
    
    // 记录内存使用指标
    this.recordMetric('memory-usage', memoryUsage.percentage);
  }

  /**
   * 清理性能指标历史数据
   */
  private cleanupPerformanceMetrics(): void {
    // 只保留最近的指标数据
    for (const [operation, metrics] of this.performanceMetrics) {
      if (metrics.length > 50) {
        this.performanceMetrics.set(operation, metrics.slice(-50));
      }
    }
  }

  /**
   * 尝试触发垃圾回收
   */
  private triggerGarbageCollection(): void {
    // 在支持的环境中触发垃圾回收
    if ('gc' in window && typeof (window as any).gc === 'function') {
      try {
        (window as any).gc();
        console.log('手动触发垃圾回收');
      } catch (error) {
        console.warn('无法手动触发垃圾回收:', error);
      }
    }
  }

  /**
   * 根据内存使用情况计算最大图像尺寸
   * @param memoryPercentage 内存使用百分比
   * @returns 推荐的最大尺寸
   */
  private calculateMaxDimension(memoryPercentage: number): number {
    if (memoryPercentage > 80) {
      return 2048; // 高内存压力时限制为2K
    } else if (memoryPercentage > 60) {
      return 3072; // 中等内存压力时限制为3K
    } else if (memoryPercentage > 40) {
      return 4096; // 低内存压力时限制为4K
    } else {
      return 6144; // 内存充足时允许6K
    }
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.stopMonitoring();
    this.performanceMetrics.clear();
    this.resourceCleanupCallbacks.clear();
  }
}

// 导出单例实例
export const performanceOptimizer = new PerformanceOptimizerService();

// 性能装饰器，用于自动记录函数执行时间
export function performanceTrack(operation: string) {
  return function (target: any, _propertyName: string, descriptor?: PropertyDescriptor) {
    if (!descriptor) {
      // Handle case where descriptor is undefined
      return target;
    }
    
    const method = descriptor.value;
    if (typeof method !== 'function') {
      return descriptor;
    }

    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now();
      
      try {
        const result = await method.apply(this, args);
        const duration = performance.now() - startTime;
        performanceOptimizer.recordMetric(operation, duration);
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        performanceOptimizer.recordMetric(`${operation}-error`, duration);
        throw error;
      }
    };

    return descriptor;
  };
}

// 性能监控工具函数
export async function withPerformanceTracking<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await fn();
    const duration = performance.now() - startTime;
    performanceOptimizer.recordMetric(operation, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    performanceOptimizer.recordMetric(`${operation}-error`, duration);
    throw error;
  }
}
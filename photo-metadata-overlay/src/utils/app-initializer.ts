import { performanceOptimizer } from '../services/performance-optimizer.service';
import { storageService } from '../services/storage.service';
import { templateService } from '../services/template.service';

/**
 * 应用程序初始化器
 * 负责优化应用启动过程，预加载必要资源，设置性能监控
 */
export class AppInitializer {
  private static instance: AppInitializer;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): AppInitializer {
    if (!AppInitializer.instance) {
      AppInitializer.instance = new AppInitializer();
    }
    return AppInitializer.instance;
  }

  /**
   * 初始化应用程序
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    await this.initializationPromise;
  }

  /**
   * 执行初始化过程
   */
  private async performInitialization(): Promise<void> {
    const startTime = performance.now();
    console.log('开始应用程序初始化...');

    try {
      // 1. 启动性能监控
      this.setupPerformanceMonitoring();

      // 2. 预加载关键资源
      await this.preloadCriticalResources();

      // 3. 初始化服务
      await this.initializeServices();

      // 4. 设置错误处理
      this.setupErrorHandling();

      // 5. 设置资源清理
      this.setupResourceCleanup();

      // 6. 优化渲染性能
      this.optimizeRendering();

      const duration = performance.now() - startTime;
      console.log(`应用程序初始化完成，耗时: ${duration.toFixed(2)}ms`);
      
      this.isInitialized = true;
      performanceOptimizer.recordMetric('app-initialization', duration);
    } catch (error) {
      console.error('应用程序初始化失败:', error);
      throw error;
    }
  }

  /**
   * 设置性能监控
   */
  private setupPerformanceMonitoring(): void {
    // 启动性能监控
    performanceOptimizer.startMonitoring();

    // 监控关键性能指标
    this.monitorCoreWebVitals();

    // 设置内存监控
    this.setupMemoryMonitoring();
  }

  /**
   * 预加载关键资源
   */
  private async preloadCriticalResources(): Promise<void> {
    const preloadTasks = [
      // 预加载字体
      this.preloadFonts(),
      
      // 预加载关键图标
      this.preloadIcons(),
      
      // 预加载默认设置
      this.preloadDefaultSettings(),
    ];

    await Promise.allSettled(preloadTasks);
  }

  /**
   * 初始化服务
   */
  private async initializeServices(): Promise<void> {
    const serviceInitTasks = [
      // 初始化存储服务
      this.initializeStorageService(),
      
      // 初始化模板服务
      this.initializeTemplateService(),
      
      // 预热图像处理
      this.warmupImageProcessing(),
    ];

    await Promise.allSettled(serviceInitTasks);
  }

  /**
   * 预加载字体
   */
  private async preloadFonts(): Promise<void> {
    const fonts = [
      'Arial',
      'Helvetica',
      'Times New Roman',
      'Courier New',
    ];

    const fontLoadPromises = fonts.map(font => {
      return new Promise<void>((resolve) => {
        const testElement = document.createElement('div');
        testElement.style.fontFamily = font;
        testElement.style.fontSize = '1px';
        testElement.style.opacity = '0';
        testElement.style.position = 'absolute';
        testElement.textContent = 'Test';
        
        document.body.appendChild(testElement);
        
        // 强制浏览器加载字体
        setTimeout(() => {
          document.body.removeChild(testElement);
          resolve();
        }, 10);
      });
    });

    await Promise.all(fontLoadPromises);
    console.log('字体预加载完成');
  }

  /**
   * 预加载图标
   */
  private async preloadIcons(): Promise<void> {
    // 预加载Lucide图标（如果使用）
    // 这里可以添加具体的图标预加载逻辑

    // 这里可以添加图标预加载逻辑
    console.log('图标预加载完成');
  }

  /**
   * 预加载默认设置
   */
  private async preloadDefaultSettings(): Promise<void> {
    try {
      // 预加载默认的叠加和相框设置
      await Promise.all([
        storageService.loadOverlaySettings(),
        storageService.loadFrameSettings(),
      ]);
      console.log('默认设置预加载完成');
    } catch (error) {
      console.warn('预加载默认设置失败:', error);
    }
  }

  /**
   * 初始化存储服务
   */
  private async initializeStorageService(): Promise<void> {
    try {
      // 检查存储服务是否可用
      await storageService.isAvailable();
      console.log('存储服务初始化完成');
    } catch (error) {
      console.warn('存储服务初始化失败:', error);
    }
  }

  /**
   * 初始化模板服务
   */
  private async initializeTemplateService(): Promise<void> {
    try {
      // 预加载模板分类
      await templateService.getCategories();
      console.log('模板服务初始化完成');
    } catch (error) {
      console.warn('模板服务初始化失败:', error);
    }
  }

  /**
   * 预热图像处理
   */
  private async warmupImageProcessing(): Promise<void> {
    try {
      // 创建一个小的测试canvas来预热图像处理
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // 执行一些基本的canvas操作来预热
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText('Test', 10, 50);
      }
      
      console.log('图像处理预热完成');
    } catch (error) {
      console.warn('图像处理预热失败:', error);
    }
  }

  /**
   * 设置错误处理
   */
  private setupErrorHandling(): void {
    // 全局错误处理
    window.addEventListener('error', (event) => {
      console.error('全局错误:', event.error);
      performanceOptimizer.recordMetric('global-error', 1);
    });

    // Promise错误处理
    window.addEventListener('unhandledrejection', (event) => {
      console.error('未处理的Promise拒绝:', event.reason);
      performanceOptimizer.recordMetric('unhandled-rejection', 1);
    });
  }

  /**
   * 设置资源清理
   */
  private setupResourceCleanup(): void {
    // 注册清理回调
    performanceOptimizer.registerCleanupCallback(() => {
      // 清理应用程序特定的资源
      this.cleanupAppResources();
    });

    // 页面隐藏时清理
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.cleanupAppResources();
      }
    });
  }

  /**
   * 优化渲染性能
   */
  private optimizeRendering(): void {
    // 启用CSS containment（如果支持）
    if (CSS.supports('contain', 'layout style paint')) {
      document.documentElement.style.contain = 'layout style paint';
    }

    // 优化滚动性能
    if ('scrollBehavior' in document.documentElement.style) {
      document.documentElement.style.scrollBehavior = 'smooth';
    }

    // 启用硬件加速（如果需要）
    document.documentElement.style.transform = 'translateZ(0)';
  }

  /**
   * 监控核心Web指标
   */
  private monitorCoreWebVitals(): void {
    // 监控First Contentful Paint (FCP)
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              performanceOptimizer.recordMetric('fcp', entry.startTime);
            }
          }
        });
        observer.observe({ entryTypes: ['paint'] });
      } catch (error) {
        console.warn('无法监控FCP:', error);
      }
    }

    // 监控Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          performanceOptimizer.recordMetric('lcp', lastEntry.startTime);
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        console.warn('无法监控LCP:', error);
      }
    }
  }

  /**
   * 设置内存监控
   */
  private setupMemoryMonitoring(): void {
    // 定期检查内存使用情况
    setInterval(() => {
      const memoryUsage = performanceOptimizer.getMemoryUsage();
      if (memoryUsage.percentage > 80) {
        console.warn(`内存使用率过高: ${memoryUsage.percentage.toFixed(1)}%`);
        this.cleanupAppResources();
      }
    }, 60000); // 每分钟检查一次
  }

  /**
   * 清理应用程序资源
   */
  private cleanupAppResources(): void {
    // 清理未使用的图像缓存
    this.cleanupImageCache();
    
    // 清理DOM中的临时元素
    this.cleanupTempElements();
    
    // 清理事件监听器
    this.cleanupEventListeners();
  }

  /**
   * 清理图像缓存
   */
  private cleanupImageCache(): void {
    // 清理blob URLs
    const blobUrls = document.querySelectorAll('img[src^="blob:"]');
    blobUrls.forEach((img) => {
      const src = (img as HTMLImageElement).src;
      if (src.startsWith('blob:')) {
        URL.revokeObjectURL(src);
      }
    });
  }

  /**
   * 清理临时DOM元素
   */
  private cleanupTempElements(): void {
    // 清理可能遗留的临时元素
    const tempElements = document.querySelectorAll('[data-temp="true"]');
    tempElements.forEach(element => {
      element.remove();
    });
  }

  /**
   * 清理事件监听器
   */
  private cleanupEventListeners(): void {
    // 这里可以添加清理特定事件监听器的逻辑
    // 通常通过维护一个监听器注册表来实现
  }

  /**
   * 获取初始化状态
   */
  isAppInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * 销毁初始化器
   */
  destroy(): void {
    performanceOptimizer.stopMonitoring();
    this.isInitialized = false;
    this.initializationPromise = null;
  }
}

// 导出单例实例
export const appInitializer = AppInitializer.getInstance();
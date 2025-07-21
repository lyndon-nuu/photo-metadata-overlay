import { BrandLogoService } from '../types';

/**
 * 品牌Logo服务实现
 * 提供相机品牌Logo的获取和管理功能
 */
export class BrandLogoServiceImpl implements BrandLogoService {
  private logoCache = new Map<string, string>();
  private loadingPromises = new Map<string, Promise<string | null>>();

  // 支持的品牌列表
  private readonly supportedBrands = [
    'canon', 'nikon', 'sony', 'fujifilm', 'olympus', 'panasonic',
    'leica', 'pentax', 'ricoh', 'hasselblad', 'mamiya', 'phase-one',
    'sigma', 'tamron', 'zeiss', 'apple', 'samsung', 'huawei', 'xiaomi',
    'oneplus', 'google', 'lg', 'motorola', 'oppo', 'vivo', 'realme'
  ];

  // 品牌名称标准化映射
  private readonly brandNameMap: Record<string, string> = {
    // 相机品牌
    'canon': 'canon',
    'nikon': 'nikon', 
    'sony': 'sony',
    'fujifilm': 'fujifilm',
    'fuji': 'fujifilm',
    'olympus': 'olympus',
    'panasonic': 'panasonic',
    'leica': 'leica',
    'pentax': 'pentax',
    'ricoh': 'ricoh',
    'hasselblad': 'hasselblad',
    'mamiya': 'mamiya',
    'phase one': 'phase-one',
    'phaseone': 'phase-one',
    'sigma': 'sigma',
    'tamron': 'tamron',
    'zeiss': 'zeiss',
    
    // 手机品牌
    'apple': 'apple',
    'samsung': 'samsung',
    'huawei': 'huawei',
    'xiaomi': 'xiaomi',
    'oneplus': 'oneplus',
    'google': 'google',
    'lg': 'lg',
    'motorola': 'motorola',
    'oppo': 'oppo',
    'vivo': 'vivo',
    'realme': 'realme',
  };

  /**
   * 根据品牌名称获取Logo URL
   * @param brandName 品牌名称
   * @returns Promise<string | null> Logo URL或null
   */
  async getBrandLogo(brandName: string): Promise<string | null> {
    if (!brandName) return null;

    const normalizedBrand = this.normalizeBrandName(brandName);
    if (!normalizedBrand) return null;

    // 检查缓存
    if (this.logoCache.has(normalizedBrand)) {
      return this.logoCache.get(normalizedBrand) || null;
    }

    // 检查是否正在加载
    if (this.loadingPromises.has(normalizedBrand)) {
      return this.loadingPromises.get(normalizedBrand) || null;
    }

    // 开始加载Logo
    const loadingPromise = this.loadBrandLogo(normalizedBrand);
    this.loadingPromises.set(normalizedBrand, loadingPromise);

    try {
      const logoUrl = await loadingPromise;
      this.logoCache.set(normalizedBrand, logoUrl || '');
      return logoUrl;
    } finally {
      this.loadingPromises.delete(normalizedBrand);
    }
  }

  /**
   * 检查品牌是否支持Logo显示
   * @param brandName 品牌名称
   * @returns boolean 是否支持
   */
  isBrandSupported(brandName: string): boolean {
    const normalizedBrand = this.normalizeBrandName(brandName);
    return normalizedBrand !== null && this.supportedBrands.includes(normalizedBrand);
  }

  /**
   * 获取所有支持的品牌列表
   * @returns string[] 支持的品牌列表
   */
  getSupportedBrands(): string[] {
    return [...this.supportedBrands];
  }

  /**
   * 清除Logo缓存
   * @param brandName 可选的品牌名称，如果不提供则清除所有缓存
   */
  clearCache(brandName?: string): void {
    if (brandName) {
      const normalizedBrand = this.normalizeBrandName(brandName);
      if (normalizedBrand) {
        this.logoCache.delete(normalizedBrand);
        this.loadingPromises.delete(normalizedBrand);
      }
    } else {
      this.logoCache.clear();
      this.loadingPromises.clear();
    }
  }

  /**
   * 预加载常用品牌的Logo
   * @param brands 要预加载的品牌列表，如果不提供则预加载所有支持的品牌
   */
  async preloadLogos(brands?: string[]): Promise<void> {
    const brandsToLoad = brands || this.supportedBrands;
    const loadPromises = brandsToLoad.map(brand => this.getBrandLogo(brand));
    
    try {
      await Promise.allSettled(loadPromises);
    } catch (error) {
      console.warn('预加载品牌Logo时发生错误:', error);
    }
  }

  /**
   * 标准化品牌名称
   * @param brandName 原始品牌名称
   * @returns string | null 标准化后的品牌名称
   */
  private normalizeBrandName(brandName: string): string | null {
    if (!brandName || typeof brandName !== 'string') return null;

    const normalized = brandName.toLowerCase().trim();
    return this.brandNameMap[normalized] || null;
  }

  /**
   * 加载品牌Logo
   * @param normalizedBrand 标准化的品牌名称
   * @returns Promise<string | null> Logo URL
   */
  private async loadBrandLogo(normalizedBrand: string): Promise<string | null> {
    try {
      // 尝试从本地资源加载
      const localLogoUrl = await this.loadLocalLogo(normalizedBrand);
      if (localLogoUrl) {
        return localLogoUrl;
      }

      // 尝试从CDN加载
      const cdnLogoUrl = await this.loadCdnLogo(normalizedBrand);
      if (cdnLogoUrl) {
        return cdnLogoUrl;
      }

      // 生成文字Logo作为降级方案
      return this.generateTextLogo(normalizedBrand);

    } catch (error) {
      console.warn(`加载品牌Logo失败: ${normalizedBrand}`, error);
      return this.generateTextLogo(normalizedBrand);
    }
  }

  /**
   * 从本地资源加载Logo
   * @param brandName 品牌名称
   * @returns Promise<string | null> Logo URL
   */
  private async loadLocalLogo(brandName: string): Promise<string | null> {
    try {
      // 尝试加载SVG格式
      const svgPath = `/src/assets/logos/${brandName}.svg`;
      const response = await fetch(svgPath);
      if (response.ok) {
        const svgContent = await response.text();
        return `data:image/svg+xml;base64,${btoa(svgContent)}`;
      }

      // 尝试加载PNG格式
      const pngPath = `/src/assets/logos/${brandName}.png`;
      const pngResponse = await fetch(pngPath);
      if (pngResponse.ok) {
        return pngPath;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 从CDN加载Logo
   * @param brandName 品牌名称
   * @returns Promise<string | null> Logo URL
   */
  private async loadCdnLogo(brandName: string): Promise<string | null> {
    // 在测试环境中跳过CDN加载
    if (typeof window === 'undefined' || (typeof process !== 'undefined' && process.env.NODE_ENV === 'test')) {
      return null;
    }

    try {
      // 使用免费的Logo CDN服务
      const cdnUrls = [
        `https://logo.clearbit.com/${brandName}.com`,
      ];

      for (const url of cdnUrls) {
        try {
          // 创建一个Image元素来测试URL是否可用
          const img = new Image();
          const isLoaded = await new Promise<boolean>((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
            
            // 设置超时
            setTimeout(() => resolve(false), 3000);
          });
          
          if (isLoaded) {
            return url;
          }
        } catch (error) {
          continue;
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 生成文字Logo作为降级方案
   * @param brandName 品牌名称
   * @returns string 文字Logo的Data URL
   */
  private generateTextLogo(brandName: string): string {
    // 创建Canvas生成文字Logo
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return '';
    }

    // 设置Canvas尺寸
    canvas.width = 120;
    canvas.height = 40;

    // 设置样式
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制边框
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // 绘制文字
    ctx.fillStyle = '#495057';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const displayName = this.getDisplayName(brandName);
    ctx.fillText(displayName, canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL('image/png');
  }

  /**
   * 获取品牌的显示名称
   * @param brandName 标准化的品牌名称
   * @returns string 显示名称
   */
  private getDisplayName(brandName: string): string {
    const displayNames: Record<string, string> = {
      'canon': 'Canon',
      'nikon': 'Nikon',
      'sony': 'Sony',
      'fujifilm': 'FUJIFILM',
      'olympus': 'Olympus',
      'panasonic': 'Panasonic',
      'leica': 'Leica',
      'pentax': 'PENTAX',
      'ricoh': 'RICOH',
      'hasselblad': 'Hasselblad',
      'mamiya': 'Mamiya',
      'phase-one': 'Phase One',
      'sigma': 'SIGMA',
      'tamron': 'TAMRON',
      'zeiss': 'ZEISS',
      'apple': 'Apple',
      'samsung': 'Samsung',
      'huawei': 'HUAWEI',
      'xiaomi': 'Xiaomi',
      'oneplus': 'OnePlus',
      'google': 'Google',
      'lg': 'LG',
      'motorola': 'Motorola',
      'oppo': 'OPPO',
      'vivo': 'vivo',
      'realme': 'realme',
    };

    return displayNames[brandName] || brandName.toUpperCase();
  }
}

// 导出单例实例
export const brandLogoService = new BrandLogoServiceImpl();
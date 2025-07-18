import { ImageProcessingService, PhotoMetadata, OverlaySettings, FrameSettings } from '../types';
import { extractDisplayableMetadata } from '../utils/data-models.utils';
import { brandLogoService } from './brand-logo.service';

/**
 * 图像处理服务实现
 * 提供图像加载、叠加处理、相框效果和导出功能
 */
export class ImageProcessingServiceImpl implements ImageProcessingService {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('无法创建 Canvas 2D 上下文');
    }
    this.ctx = context;
    
    // 设置高质量渲染
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  /**
   * 从文件加载图像
   * @param file 图像文件
   * @returns Promise<HTMLImageElement> 加载的图像元素
   */
  async loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        reject(new Error(`不支持的文件类型: ${file.type}。请使用图像文件。`));
        return;
      }

      // 验证文件大小 (限制为50MB)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        reject(new Error(`文件过大: ${(file.size / 1024 / 1024).toFixed(1)}MB。最大支持50MB。`));
        return;
      }

      console.log(`正在加载图像: ${file.name}, 类型: ${file.type}, 大小: ${(file.size / 1024).toFixed(1)}KB`);

      const img = new Image();
      const url = URL.createObjectURL(file);

      // 设置超时处理
      const timeout = setTimeout(() => {
        URL.revokeObjectURL(url);
        reject(new Error(`图像加载超时: ${file.name}。请检查文件是否完整。`));
      }, 30000); // 30秒超时

      img.onload = () => {
        clearTimeout(timeout);
        console.log(`图像加载成功: ${file.name}, 尺寸: ${img.naturalWidth}x${img.naturalHeight}`);
        URL.revokeObjectURL(url);
        resolve(img);
      };

      img.onerror = (event) => {
        clearTimeout(timeout);
        console.error(`图像加载失败: ${file.name}`, event);
        URL.revokeObjectURL(url);
        reject(new Error(`无法加载图像: ${file.name}。可能的原因：文件损坏、格式不支持或浏览器限制。`));
      };

      img.src = url;
    });
  }

  /**
   * 应用元数据叠加到图像
   * @param image 原始图像
   * @param metadata 照片元数据
   * @param settings 叠加设置
   * @returns Promise<HTMLCanvasElement> 处理后的Canvas
   */
  async applyOverlay(
    image: HTMLImageElement,
    metadata: PhotoMetadata,
    settings: OverlaySettings
  ): Promise<HTMLCanvasElement> {
    // 设置Canvas尺寸与原图相同
    this.canvas.width = image.naturalWidth;
    this.canvas.height = image.naturalHeight;

    // 清空Canvas并绘制原图
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(image, 0, 0);

    // 提取要显示的元数据
    const displayData = extractDisplayableMetadata(metadata, settings.displayItems);
    
    if (Object.keys(displayData).length === 0) {
      // 如果没有要显示的数据，直接返回原图
      return this.canvas;
    }

    // 应用叠加效果
    await this.renderOverlay(displayData, settings);

    return this.canvas;
  }

  /**
   * 应用相框效果
   * @param canvas 输入Canvas
   * @param frameSettings 相框设置
   * @returns Promise<HTMLCanvasElement> 处理后的Canvas
   */
  async applyFrame(
    canvas: HTMLCanvasElement,
    frameSettings: FrameSettings
  ): Promise<HTMLCanvasElement> {
    if (!frameSettings.enabled) {
      return canvas;
    }

    const originalWidth = canvas.width;
    const originalHeight = canvas.height;
    const frameWidth = frameSettings.width;

    // 创建新的Canvas，尺寸包含相框
    const framedCanvas = document.createElement('canvas');
    const framedCtx = framedCanvas.getContext('2d');
    
    if (!framedCtx) {
      throw new Error('无法创建相框Canvas上下文');
    }

    framedCanvas.width = originalWidth + frameWidth * 2;
    framedCanvas.height = originalHeight + frameWidth * 2;

    // 设置高质量渲染
    framedCtx.imageSmoothingEnabled = true;
    framedCtx.imageSmoothingQuality = 'high';

    // 根据相框样式渲染
    await this.renderFrame(framedCtx, framedCanvas.width, framedCanvas.height, frameSettings);

    // 绘制原图到相框中心
    framedCtx.drawImage(canvas, frameWidth, frameWidth);

    return framedCanvas;
  }

  /**
   * 导出图像为Blob
   * @param canvas 要导出的Canvas
   * @param format 导出格式
   * @param quality 图像质量 (0-1)
   * @returns Promise<Blob> 导出的图像数据
   */
  async exportImage(
    canvas: HTMLCanvasElement,
    format: 'jpeg' | 'png',
    quality: number = 0.9
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('图像导出失败'));
          }
        },
        mimeType,
        quality
      );
    });
  }

  /**
   * 渲染元数据叠加
   * @param displayData 要显示的数据
   * @param settings 叠加设置
   */
  private async renderOverlay(
    displayData: Record<string, string>,
    settings: OverlaySettings
  ): Promise<void> {
    const { font, background, position } = settings;
    
    // 准备文本内容
    const textLines = this.prepareTextLines(displayData);
    
    // 获取品牌Logo（如果需要显示）
    let brandLogo: HTMLImageElement | null = null;
    if (settings.displayItems.brandLogo && displayData.brand) {
      try {
        const logoUrl = await brandLogoService.getBrandLogo(displayData.brand);
        if (logoUrl) {
          brandLogo = await this.loadLogoImage(logoUrl);
        }
      } catch (error) {
        console.warn('加载品牌Logo失败:', error);
      }
    }

    // 如果没有文本和Logo要显示，直接返回
    if (textLines.length === 0 && !brandLogo) return;

    // 设置字体
    this.ctx.font = `${font.weight} ${font.size}px ${font.family}`;
    this.ctx.textBaseline = 'top';

    // 计算文本和Logo的总尺寸
    const contentMetrics = this.calculateContentMetrics(textLines, brandLogo);
    const overlayWidth = contentMetrics.width + background.padding * 2;
    const overlayHeight = contentMetrics.height + background.padding * 2;

    // 计算叠加位置
    const overlayPosition = this.calculateOverlayPosition(
      position,
      overlayWidth,
      overlayHeight
    );

    // 绘制背景
    if (background.color && background.opacity > 0) {
      this.renderOverlayBackground(
        overlayPosition.x,
        overlayPosition.y,
        overlayWidth,
        overlayHeight,
        background
      );
    }

    // 绘制内容（Logo和文本）
    await this.renderOverlayContent(
      overlayPosition.x + background.padding,
      overlayPosition.y + background.padding,
      textLines,
      brandLogo,
      font
    );
  }

  /**
   * 准备文本行
   * @param displayData 显示数据
   * @returns string[] 文本行数组
   */
  private prepareTextLines(displayData: Record<string, string>): string[] {
    const lines: string[] = [];
    
    // 按优先级排序显示项目
    const priorityOrder = ['brand', 'model', 'aperture', 'shutterSpeed', 'iso', 'timestamp', 'location'];
    
    priorityOrder.forEach(key => {
      if (displayData[key]) {
        lines.push(displayData[key]);
      }
    });

    // 添加其他未在优先级列表中的项目
    Object.entries(displayData).forEach(([key, value]) => {
      if (!priorityOrder.includes(key) && value) {
        lines.push(value);
      }
    });

    return lines;
  }

  /**
   * 计算文本尺寸
   * @param textLines 文本行
   * @returns 文本尺寸信息
   */
  private calculateTextMetrics(textLines: string[]): { width: number; height: number } {
    let maxWidth = 0;
    
    textLines.forEach(line => {
      const metrics = this.ctx.measureText(line);
      maxWidth = Math.max(maxWidth, metrics.width);
    });

    const height = textLines.length * (parseInt(this.ctx.font) + 4) - 4; // 减去最后一行的行间距

    return { width: maxWidth, height };
  }

  /**
   * 计算叠加位置
   * @param position 位置设置
   * @param overlayWidth 叠加宽度
   * @param overlayHeight 叠加高度
   * @returns 叠加位置坐标
   */
  private calculateOverlayPosition(
    position: OverlaySettings['position'],
    overlayWidth: number,
    overlayHeight: number
  ): { x: number; y: number } {
    const margin = 20; // 边距
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;

    switch (position) {
      case 'top-left':
        return { x: margin, y: margin };
      case 'top-right':
        return { x: canvasWidth - overlayWidth - margin, y: margin };
      case 'bottom-left':
        return { x: margin, y: canvasHeight - overlayHeight - margin };
      case 'bottom-right':
        return { 
          x: canvasWidth - overlayWidth - margin, 
          y: canvasHeight - overlayHeight - margin 
        };
      default:
        return { x: margin, y: canvasHeight - overlayHeight - margin };
    }
  }

  /**
   * 渲染叠加背景
   * @param x X坐标
   * @param y Y坐标
   * @param width 宽度
   * @param height 高度
   * @param background 背景设置
   */
  private renderOverlayBackground(
    x: number,
    y: number,
    width: number,
    height: number,
    background: OverlaySettings['background']
  ): void {
    this.ctx.save();
    
    // 设置透明度
    this.ctx.globalAlpha = background.opacity;
    
    // 设置背景颜色
    this.ctx.fillStyle = background.color;
    
    // 绘制圆角矩形背景
    if (background.borderRadius > 0) {
      this.drawRoundedRect(x, y, width, height, background.borderRadius);
      this.ctx.fill();
    } else {
      this.ctx.fillRect(x, y, width, height);
    }
    
    this.ctx.restore();
  }

  /**
   * 绘制圆角矩形
   * @param x X坐标
   * @param y Y坐标
   * @param width 宽度
   * @param height 高度
   * @param radius 圆角半径
   */
  private drawRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  /**
   * 渲染相框效果
   * @param ctx Canvas上下文
   * @param width Canvas宽度
   * @param height Canvas高度
   * @param frameSettings 相框设置
   */
  private async renderFrame(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    frameSettings: FrameSettings
  ): Promise<void> {
    ctx.save();
    
    // 设置透明度
    ctx.globalAlpha = frameSettings.opacity;
    
    switch (frameSettings.style) {
      case 'simple':
        await this.renderSimpleFrame(ctx, width, height, frameSettings);
        break;
      case 'shadow':
        await this.renderShadowFrame(ctx, width, height, frameSettings);
        break;
      case 'film':
        await this.renderFilmFrame(ctx, width, height, frameSettings);
        break;
      case 'polaroid':
        await this.renderPolaroidFrame(ctx, width, height, frameSettings);
        break;
      case 'vintage':
        await this.renderVintageFrame(ctx, width, height, frameSettings);
        break;
      default:
        await this.renderSimpleFrame(ctx, width, height, frameSettings);
    }
    
    ctx.restore();
  }

  /**
   * 渲染简单边框
   */
  private async renderSimpleFrame(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    frameSettings: FrameSettings
  ): Promise<void> {
    ctx.fillStyle = frameSettings.color;
    
    const frameWidth = frameSettings.width;
    const cornerRadius = frameSettings.customProperties?.cornerRadius || 0;
    
    if (cornerRadius > 0) {
      // 绘制圆角边框
      ctx.beginPath();
      // 外边框
      this.drawRoundedRectPath(ctx, 0, 0, width, height, cornerRadius);
      // 内边框（反向）
      this.drawRoundedRectPath(
        ctx, 
        frameWidth, 
        frameWidth, 
        width - frameWidth * 2, 
        height - frameWidth * 2, 
        Math.max(0, cornerRadius - frameWidth),
        true
      );
      ctx.fill('evenodd');
    } else {
      // 绘制直角边框
      ctx.fillRect(0, 0, width, height);
      ctx.clearRect(frameWidth, frameWidth, width - frameWidth * 2, height - frameWidth * 2);
    }
  }

  /**
   * 渲染阴影边框
   */
  private async renderShadowFrame(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    frameSettings: FrameSettings
  ): Promise<void> {
    const shadowBlur = frameSettings.customProperties?.shadowBlur || 10;
    const shadowOffset = frameSettings.customProperties?.shadowOffset || { x: 0, y: 5 };
    
    // 绘制阴影
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetX = shadowOffset.x;
    ctx.shadowOffsetY = shadowOffset.y;
    
    // 先绘制简单边框
    await this.renderSimpleFrame(ctx, width, height, frameSettings);
    
    ctx.restore();
  }

  /**
   * 渲染胶片风格边框
   */
  private async renderFilmFrame(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    frameSettings: FrameSettings
  ): Promise<void> {
    const frameWidth = frameSettings.width;
    
    // 绘制黑色背景
    ctx.fillStyle = frameSettings.color;
    ctx.fillRect(0, 0, width, height);
    
    // 清除中心区域
    ctx.clearRect(frameWidth, frameWidth, width - frameWidth * 2, height - frameWidth * 2);
    
    // 绘制胶片孔
    const holeSize = Math.min(frameWidth * 0.3, 8);
    const holeSpacing = holeSize * 2;
    
    ctx.fillStyle = '#000000';
    
    // 顶部和底部的孔
    for (let x = holeSpacing; x < width - holeSpacing; x += holeSpacing) {
      // 顶部孔
      ctx.fillRect(x - holeSize / 2, frameWidth / 2 - holeSize / 2, holeSize, holeSize);
      // 底部孔
      ctx.fillRect(x - holeSize / 2, height - frameWidth / 2 - holeSize / 2, holeSize, holeSize);
    }
  }

  /**
   * 渲染宝丽来风格边框
   */
  private async renderPolaroidFrame(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    frameSettings: FrameSettings
  ): Promise<void> {
    const frameWidth = frameSettings.width;
    const bottomFrameWidth = frameWidth * 1.5; // 底部边框更宽
    
    // 绘制白色背景
    ctx.fillStyle = frameSettings.color;
    ctx.fillRect(0, 0, width, height);
    
    // 清除图片区域
    ctx.clearRect(
      frameWidth, 
      frameWidth, 
      width - frameWidth * 2, 
      height - frameWidth - bottomFrameWidth
    );
    
    // 添加轻微的阴影效果
    const shadowBlur = frameSettings.customProperties?.shadowBlur || 15;
    const shadowOffset = frameSettings.customProperties?.shadowOffset || { x: 0, y: 8 };
    
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetX = shadowOffset.x;
    ctx.shadowOffsetY = shadowOffset.y;
    
    // 重新绘制边框以应用阴影
    ctx.fillStyle = frameSettings.color;
    ctx.fillRect(0, 0, width, height);
    
    ctx.restore();
    
    // 再次清除图片区域
    ctx.clearRect(
      frameWidth, 
      frameWidth, 
      width - frameWidth * 2, 
      height - frameWidth - bottomFrameWidth
    );
  }

  /**
   * 渲染复古风格边框
   */
  private async renderVintageFrame(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    frameSettings: FrameSettings
  ): Promise<void> {
    const frameWidth = frameSettings.width;
    
    // 创建渐变效果
    const gradient = ctx.createLinearGradient(0, 0, frameWidth, frameWidth);
    gradient.addColorStop(0, frameSettings.color);
    gradient.addColorStop(0.5, this.lightenColor(frameSettings.color, 20));
    gradient.addColorStop(1, this.darkenColor(frameSettings.color, 20));
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // 清除中心区域
    ctx.clearRect(frameWidth, frameWidth, width - frameWidth * 2, height - frameWidth * 2);
    
    // 添加装饰性的内边框
    const innerBorderWidth = 2;
    ctx.strokeStyle = this.darkenColor(frameSettings.color, 30);
    ctx.lineWidth = innerBorderWidth;
    ctx.strokeRect(
      frameWidth - innerBorderWidth / 2, 
      frameWidth - innerBorderWidth / 2, 
      width - frameWidth * 2 + innerBorderWidth, 
      height - frameWidth * 2 + innerBorderWidth
    );
  }

  /**
   * 绘制圆角矩形路径
   */
  private drawRoundedRectPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    counterClockwise: boolean = false
  ): void {
    if (counterClockwise) {
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + height);
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x + width, y);
      ctx.lineTo(x + radius, y);
      ctx.quadraticCurveTo(x, y, x, y + radius);
      ctx.lineTo(x, y + height - radius);
      ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
      ctx.lineTo(x + width - radius, y + height);
      ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
      ctx.lineTo(x + width, y + radius);
      ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
    } else {
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
    }
  }

  /**
   * 颜色变亮
   */
  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  /**
   * 颜色变暗
   */
  private darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
      (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
      (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
  }

  /**
   * 加载Logo图像
   * @param logoUrl Logo URL
   * @returns Promise<HTMLImageElement> Logo图像元素
   */
  private async loadLogoImage(logoUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('无法加载Logo图像'));
      
      // 设置跨域属性
      img.crossOrigin = 'anonymous';
      img.src = logoUrl;
      
      // 设置超时
      setTimeout(() => {
        reject(new Error('Logo加载超时'));
      }, 5000);
    });
  }

  /**
   * 计算内容（文本和Logo）的总尺寸
   * @param textLines 文本行
   * @param brandLogo 品牌Logo图像
   * @returns 内容尺寸信息
   */
  private calculateContentMetrics(
    textLines: string[], 
    brandLogo: HTMLImageElement | null
  ): { width: number; height: number } {
    // 计算文本尺寸
    const textMetrics = this.calculateTextMetrics(textLines);
    
    // 计算Logo尺寸
    let logoWidth = 0;
    let logoHeight = 0;
    
    if (brandLogo) {
      // Logo高度与字体大小相匹配
      const fontSize = parseInt(this.ctx.font);
      logoHeight = fontSize * 1.2; // 稍微大一点
      logoWidth = (brandLogo.naturalWidth / brandLogo.naturalHeight) * logoHeight;
    }
    
    // 如果有Logo和文本，需要考虑它们的布局
    if (brandLogo && textLines.length > 0) {
      // Logo在顶部，文本在下方
      const totalWidth = Math.max(textMetrics.width, logoWidth);
      const totalHeight = logoHeight + 8 + textMetrics.height; // 8px间距
      return { width: totalWidth, height: totalHeight };
    } else if (brandLogo) {
      // 只有Logo
      return { width: logoWidth, height: logoHeight };
    } else {
      // 只有文本
      return textMetrics;
    }
  }

  /**
   * 渲染叠加内容（Logo和文本）
   * @param x 起始X坐标
   * @param y 起始Y坐标
   * @param textLines 文本行
   * @param brandLogo 品牌Logo图像
   * @param font 字体设置
   */
  private async renderOverlayContent(
    x: number,
    y: number,
    textLines: string[],
    brandLogo: HTMLImageElement | null,
    font: OverlaySettings['font']
  ): Promise<void> {
    let currentY = y;
    
    // 绘制Logo（如果存在）
    if (brandLogo) {
      const fontSize = parseInt(this.ctx.font);
      const logoHeight = fontSize * 1.2;
      const logoWidth = (brandLogo.naturalWidth / brandLogo.naturalHeight) * logoHeight;
      
      // 居中绘制Logo
      const logoX = x + (this.calculateTextMetrics(textLines).width - logoWidth) / 2;
      
      try {
        this.ctx.drawImage(brandLogo, logoX, currentY, logoWidth, logoHeight);
        currentY += logoHeight + 8; // Logo下方留8px间距
      } catch (error) {
        console.warn('绘制Logo失败:', error);
      }
    }
    
    // 绘制文本
    if (textLines.length > 0) {
      this.ctx.fillStyle = font.color;
      
      textLines.forEach(line => {
        this.ctx.fillText(line, x, currentY);
        currentY += font.size + 4; // 行间距
      });
    }
  }
}

// 导出单例实例
export const imageProcessingService = new ImageProcessingServiceImpl();
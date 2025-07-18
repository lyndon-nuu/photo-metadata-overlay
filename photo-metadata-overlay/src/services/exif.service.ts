import exifr from 'exifr';
import { ExifData, ExifService } from '../types';
import { SUPPORTED_IMAGE_FORMATS } from '../constants/design-tokens';

/**
 * EXIF数据读取服务
 * 支持从图片文件中提取相机元数据信息
 */
export class ExifServiceImpl implements ExifService {
  /**
   * 从文件中提取EXIF元数据
   * @param file 图片文件
   * @returns Promise<ExifData> EXIF数据
   */
  async extractMetadata(file: File): Promise<ExifData> {
    try {
      // 检查文件格式是否支持
      if (!this.isSupported(file.type)) {
        throw new Error(`Unsupported file format: ${file.type}`);
      }

      // 使用exifr库提取EXIF数据
      const rawExif = await exifr.parse(file, {
        // 配置要提取的数据
        tiff: true,
        exif: true,
        gps: true,
        iptc: false,
        icc: false,
        jfif: false,
        ihdr: false,
        // 合并所有数据到一个对象
        mergeOutput: true,
        // 转换GPS坐标为十进制格式
        translateKeys: true,
        translateValues: true,
        reviveValues: true,
      });

      // 如果没有EXIF数据，返回空对象
      if (!rawExif) {
        return {};
      }

      // 转换为标准化的ExifData格式
      return this.normalizeExifData(rawExif);
    } catch (error) {
      console.warn('Failed to extract EXIF data:', error);
      // 不抛出错误，返回空对象以确保应用不会崩溃
      return {};
    }
  }

  /**
   * 检查文件格式是否支持EXIF数据提取
   * @param mimeType 文件MIME类型
   * @returns boolean 是否支持
   */
  isSupported(mimeType: string): boolean {
    return SUPPORTED_IMAGE_FORMATS.includes(
      mimeType as (typeof SUPPORTED_IMAGE_FORMATS)[number]
    );
  }

  /**
   * 验证图片文件是否有效
   * @param file 图片文件
   * @returns boolean 是否有效
   */
  validateImageFile(file: File): boolean {
    // Check file type
    if (!this.isSupported(file.type)) {
      return false;
    }
    
    // Check file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return false;
    }
    
    // Check file extension
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.bmp'];
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    return validExtensions.includes(extension);
  }

  /**
   * 将原始EXIF数据标准化为ExifData格式
   * @param rawExif 原始EXIF数据
   * @returns ExifData 标准化的EXIF数据
   */
  private normalizeExifData(rawExif: Record<string, unknown>): ExifData {
    const exifData: ExifData = {};

    // 相机信息
    if (rawExif.Make) {
      exifData.make = this.cleanString(rawExif.Make);
    }
    if (rawExif.Model) {
      exifData.model = this.cleanString(rawExif.Model);
    }
    if (rawExif.LensModel || rawExif.LensInfo) {
      exifData.lens = this.cleanString(rawExif.LensModel || rawExif.LensInfo);
    }

    // 拍摄参数
    const focalLength = this.toNumber(rawExif.FocalLength);
    if (focalLength) {
      exifData.focalLength = `${focalLength}mm`;
    }
    
    const aperture = this.toNumber(rawExif.FNumber || rawExif.ApertureValue);
    if (aperture) {
      exifData.aperture = `f/${aperture}`;
    }
    
    const exposureTime = this.toNumber(rawExif.ExposureTime || rawExif.ShutterSpeedValue);
    if (exposureTime) {
      exifData.shutterSpeed = this.formatShutterSpeed(exposureTime);
    }
    
    const iso = this.toNumber(rawExif.ISO || rawExif.ISOSpeedRatings);
    if (iso) {
      exifData.iso = `ISO ${iso}`;
    }

    // 拍摄模式
    const exposureMode = this.toNumber(rawExif.ExposureMode);
    if (exposureMode !== undefined) {
      exifData.exposureMode = this.getExposureMode(exposureMode);
    }
    
    const meteringMode = this.toNumber(rawExif.MeteringMode);
    if (meteringMode !== undefined) {
      exifData.meteringMode = this.getMeteringMode(meteringMode);
    }
    
    const whiteBalance = this.toNumber(rawExif.WhiteBalance);
    if (whiteBalance !== undefined) {
      exifData.whiteBalance = this.getWhiteBalance(whiteBalance);
    }
    
    const flash = this.toNumber(rawExif.Flash);
    if (flash !== undefined) {
      exifData.flash = this.getFlashMode(flash);
    }

    // 日期时间
    const dateTime = this.toDateString(rawExif.DateTime);
    if (dateTime) {
      exifData.dateTime = dateTime;
    }
    
    const dateTimeOriginal = this.toDateString(rawExif.DateTimeOriginal);
    if (dateTimeOriginal) {
      exifData.dateTimeOriginal = dateTimeOriginal;
    }
    
    const dateTimeDigitized = this.toDateString(rawExif.DateTimeDigitized);
    if (dateTimeDigitized) {
      exifData.dateTimeDigitized = dateTimeDigitized;
    }

    // GPS信息
    const latitude = this.toNumber(rawExif.latitude);
    const longitude = this.toNumber(rawExif.longitude);
    if (latitude !== undefined && longitude !== undefined) {
      exifData.gps = {
        latitude,
        longitude,
      };
      
      const altitude = this.toNumber(rawExif.GPSAltitude);
      if (altitude !== undefined) {
        exifData.gps.altitude = altitude;
      }
      
      const direction = this.toNumber(rawExif.GPSImgDirection);
      if (direction !== undefined) {
        exifData.gps.direction = direction;
      }
    }

    // 图像属性
    const colorSpace = this.toNumber(rawExif.ColorSpace);
    if (colorSpace !== undefined) {
      exifData.colorSpace = this.getColorSpace(colorSpace);
    }
    
    const orientation = this.toNumber(rawExif.Orientation);
    if (orientation !== undefined) {
      exifData.orientation = orientation;
    }
    
    const xResolution = this.toNumber(rawExif.XResolution);
    if (xResolution !== undefined) {
      exifData.xResolution = xResolution;
    }
    
    const yResolution = this.toNumber(rawExif.YResolution);
    if (yResolution !== undefined) {
      exifData.yResolution = yResolution;
    }
    
    const resolutionUnit = this.toNumber(rawExif.ResolutionUnit);
    if (resolutionUnit !== undefined) {
      exifData.resolutionUnit = this.getResolutionUnit(resolutionUnit);
    }

    // 附加元数据
    if (rawExif.Software) {
      exifData.software = this.cleanString(rawExif.Software);
    }
    if (rawExif.Artist) {
      exifData.artist = this.cleanString(rawExif.Artist);
    }
    if (rawExif.Copyright) {
      exifData.copyright = this.cleanString(rawExif.Copyright);
    }
    if (rawExif.ImageDescription) {
      exifData.imageDescription = this.cleanString(rawExif.ImageDescription);
    }

    return exifData;
  }

  /**
   * 清理字符串，移除多余的空白字符
   */
  private cleanString(str: unknown): string {
    if (typeof str === 'string') {
      return str.trim().replace(/\0/g, '');
    }
    if (str != null) {
      return str.toString().trim().replace(/\0/g, '');
    }
    return '';
  }

  /**
   * 安全地转换为数字
   */
  private toNumber(value: unknown): number | undefined {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? undefined : num;
    }
    return undefined;
  }

  /**
   * 安全地转换为日期字符串
   */
  private toDateString(value: unknown): string | undefined {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string') {
      try {
        return new Date(value).toISOString();
      } catch {
        return value;
      }
    }
    return undefined;
  }

  /**
   * 格式化快门速度
   */
  private formatShutterSpeed(exposureTime: number): string {
    if (exposureTime >= 1) {
      return `${exposureTime}s`;
    } else {
      const denominator = Math.round(1 / exposureTime);
      return `1/${denominator}`;
    }
  }

  /**
   * 获取曝光模式描述
   */
  private getExposureMode(mode: number): string {
    const modes = {
      0: 'Auto',
      1: 'Manual',
      2: 'Auto bracket',
    };
    return modes[mode as keyof typeof modes] || 'Unknown';
  }

  /**
   * 获取测光模式描述
   */
  private getMeteringMode(mode: number): string {
    const modes = {
      0: 'Unknown',
      1: 'Average',
      2: 'Center-weighted average',
      3: 'Spot',
      4: 'Multi-spot',
      5: 'Pattern',
      6: 'Partial',
    };
    return modes[mode as keyof typeof modes] || 'Unknown';
  }

  /**
   * 获取白平衡描述
   */
  private getWhiteBalance(wb: number): string {
    const modes = {
      0: 'Auto',
      1: 'Manual',
    };
    return modes[wb as keyof typeof modes] || 'Unknown';
  }

  /**
   * 获取闪光灯模式描述
   */
  private getFlashMode(flash: number): string {
    if (flash === 0) return 'No flash';
    if (flash & 0x01) return 'Flash fired';
    return 'Flash did not fire';
  }

  /**
   * 获取色彩空间描述
   */
  private getColorSpace(colorSpace: number): string {
    const spaces = {
      1: 'sRGB',
      65535: 'Uncalibrated',
    };
    return spaces[colorSpace as keyof typeof spaces] || 'Unknown';
  }

  /**
   * 获取分辨率单位描述
   */
  private getResolutionUnit(unit: number): string {
    const units = {
      1: 'None',
      2: 'Inches',
      3: 'Centimeters',
    };
    return units[unit as keyof typeof units] || 'Unknown';
  }
}

// 导出单例实例
export const exifService = new ExifServiceImpl();

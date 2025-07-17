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
    if (rawExif.FocalLength) {
      exifData.focalLength = `${rawExif.FocalLength}mm`;
    }
    if (rawExif.FNumber || rawExif.ApertureValue) {
      const aperture = rawExif.FNumber || rawExif.ApertureValue;
      exifData.aperture = `f/${aperture}`;
    }
    if (rawExif.ExposureTime || rawExif.ShutterSpeedValue) {
      const exposureTime = rawExif.ExposureTime || rawExif.ShutterSpeedValue;
      exifData.shutterSpeed = this.formatShutterSpeed(exposureTime);
    }
    if (rawExif.ISO || rawExif.ISOSpeedRatings) {
      const iso = rawExif.ISO || rawExif.ISOSpeedRatings;
      exifData.iso = `ISO ${iso}`;
    }

    // 拍摄模式
    if (rawExif.ExposureMode !== undefined) {
      exifData.exposureMode = this.getExposureMode(rawExif.ExposureMode);
    }
    if (rawExif.MeteringMode !== undefined) {
      exifData.meteringMode = this.getMeteringMode(rawExif.MeteringMode);
    }
    if (rawExif.WhiteBalance !== undefined) {
      exifData.whiteBalance = this.getWhiteBalance(rawExif.WhiteBalance);
    }
    if (rawExif.Flash !== undefined) {
      exifData.flash = this.getFlashMode(rawExif.Flash);
    }

    // 日期时间
    if (rawExif.DateTime) {
      exifData.dateTime = rawExif.DateTime.toISOString();
    }
    if (rawExif.DateTimeOriginal) {
      exifData.dateTimeOriginal = rawExif.DateTimeOriginal.toISOString();
    }
    if (rawExif.DateTimeDigitized) {
      exifData.dateTimeDigitized = rawExif.DateTimeDigitized.toISOString();
    }

    // GPS信息
    if (rawExif.latitude && rawExif.longitude) {
      exifData.gps = {
        latitude: rawExif.latitude,
        longitude: rawExif.longitude,
      };
      if (rawExif.GPSAltitude) {
        exifData.gps.altitude = rawExif.GPSAltitude;
      }
      if (rawExif.GPSImgDirection) {
        exifData.gps.direction = rawExif.GPSImgDirection;
      }
    }

    // 图像属性
    if (rawExif.ColorSpace !== undefined) {
      exifData.colorSpace = this.getColorSpace(rawExif.ColorSpace);
    }
    if (rawExif.Orientation !== undefined) {
      exifData.orientation = rawExif.Orientation;
    }
    if (rawExif.XResolution) {
      exifData.xResolution = rawExif.XResolution;
    }
    if (rawExif.YResolution) {
      exifData.yResolution = rawExif.YResolution;
    }
    if (rawExif.ResolutionUnit !== undefined) {
      exifData.resolutionUnit = this.getResolutionUnit(rawExif.ResolutionUnit);
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
  private cleanString(str: string): string {
    return str?.toString().trim().replace(/\0/g, '') || '';
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

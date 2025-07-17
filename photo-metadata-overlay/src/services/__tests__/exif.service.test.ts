import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExifServiceImpl } from '../exif.service';

// Mock exifr
vi.mock('exifr', () => ({
  default: {
    parse: vi.fn(),
  },
}));

describe('ExifService', () => {
  let exifService: ExifServiceImpl;

  beforeEach(() => {
    exifService = new ExifServiceImpl();
    vi.clearAllMocks();
  });

  describe('isSupported', () => {
    it('should return true for supported image formats', () => {
      expect(exifService.isSupported('image/jpeg')).toBe(true);
      expect(exifService.isSupported('image/png')).toBe(true);
      expect(exifService.isSupported('image/tiff')).toBe(true);
    });

    it('should return false for unsupported formats', () => {
      expect(exifService.isSupported('text/plain')).toBe(false);
      expect(exifService.isSupported('application/pdf')).toBe(false);
    });
  });

  describe('extractMetadata', () => {
    it('should extract basic camera information', async () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const mockExifData = {
        Make: 'Canon',
        Model: 'EOS R5',
        LensModel: 'RF24-70mm F2.8 L IS USM',
        FocalLength: 50,
        FNumber: 2.8,
        ExposureTime: 0.008,
        ISO: 400,
      };

      const exifr = await import('exifr');
      vi.mocked(exifr.default.parse).mockResolvedValue(mockExifData);

      const result = await exifService.extractMetadata(mockFile);

      expect(result.make).toBe('Canon');
      expect(result.model).toBe('EOS R5');
      expect(result.lens).toBe('RF24-70mm F2.8 L IS USM');
      expect(result.focalLength).toBe('50mm');
      expect(result.aperture).toBe('f/2.8');
      expect(result.shutterSpeed).toBe('1/125');
      expect(result.iso).toBe('ISO 400');
    });

    it('should handle GPS data correctly', async () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const mockExifData = {
        latitude: 37.7749,
        longitude: -122.4194,
        GPSAltitude: 100,
        GPSImgDirection: 45,
      };

      const exifr = await import('exifr');
      vi.mocked(exifr.default.parse).mockResolvedValue(mockExifData);

      const result = await exifService.extractMetadata(mockFile);

      expect(result.gps).toEqual({
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: 100,
        direction: 45,
      });
    });

    it('should handle date/time information', async () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const testDate = new Date('2023-01-01T12:00:00Z');
      const mockExifData = {
        DateTime: testDate,
        DateTimeOriginal: testDate,
        DateTimeDigitized: testDate,
      };

      const exifr = await import('exifr');
      vi.mocked(exifr.default.parse).mockResolvedValue(mockExifData);

      const result = await exifService.extractMetadata(mockFile);

      expect(result.dateTime).toBe(testDate.toISOString());
      expect(result.dateTimeOriginal).toBe(testDate.toISOString());
      expect(result.dateTimeDigitized).toBe(testDate.toISOString());
    });

    it('should return empty object when no EXIF data is available', async () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });

      const exifr = await import('exifr');
      vi.mocked(exifr.default.parse).mockResolvedValue(null);

      const result = await exifService.extractMetadata(mockFile);

      expect(result).toEqual({});
    });

    it('should handle errors gracefully', async () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });

      const exifr = await import('exifr');
      vi.mocked(exifr.default.parse).mockRejectedValue(
        new Error('Parse error')
      );

      const result = await exifService.extractMetadata(mockFile);

      expect(result).toEqual({});
    });

    it('should return empty object for unsupported file types', async () => {
      const mockFile = new File([''], 'test.txt', { type: 'text/plain' });

      const result = await exifService.extractMetadata(mockFile);

      expect(result).toEqual({});
    });

    it('should format shutter speed correctly', async () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });

      // Test fast shutter speed
      const exifr = await import('exifr');
      vi.mocked(exifr.default.parse).mockResolvedValue({
        ExposureTime: 0.004, // 1/250
      });

      let result = await exifService.extractMetadata(mockFile);
      expect(result.shutterSpeed).toBe('1/250');

      // Test slow shutter speed
      vi.mocked(exifr.default.parse).mockResolvedValue({
        ExposureTime: 2, // 2 seconds
      });

      result = await exifService.extractMetadata(mockFile);
      expect(result.shutterSpeed).toBe('2s');
    });

    it('should handle exposure modes correctly', async () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const mockExifData = {
        ExposureMode: 1, // Manual
        MeteringMode: 3, // Spot
        WhiteBalance: 0, // Auto
        Flash: 1, // Flash fired
      };

      const exifr = await import('exifr');
      vi.mocked(exifr.default.parse).mockResolvedValue(mockExifData);

      const result = await exifService.extractMetadata(mockFile);

      expect(result.exposureMode).toBe('Manual');
      expect(result.meteringMode).toBe('Spot');
      expect(result.whiteBalance).toBe('Auto');
      expect(result.flash).toBe('Flash fired');
    });
  });
});

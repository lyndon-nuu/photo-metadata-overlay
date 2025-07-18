import { describe, it, expect } from 'vitest';
import {
  createDefaultOverlaySettings,
  validateOverlaySettings,
  createDefaultFrameSettings,
  validateFrameSettings,
  createAppError,
  createProcessingError,
  extractDisplayableMetadata,
  isValidImageFile,
  isValidFileExtension,
} from '../data-models.utils';
import { OverlaySettings, FrameSettings, PhotoMetadata } from '../../types/index';

describe('Data Models Utils', () => {
  describe('createDefaultOverlaySettings', () => {
    it('should create default overlay settings', () => {
      const settings = createDefaultOverlaySettings();

      expect(settings.position).toBe('bottom-left');
      expect(settings.font.family).toBe('Inter');
      expect(settings.font.size).toBe(14);
      expect(settings.font.color).toBe('#ffffff');
      expect(settings.font.weight).toBe('normal');
      expect(settings.background.opacity).toBe(0.8);
      expect(settings.displayItems.brand).toBe(true);
      expect(settings.displayItems.model).toBe(true);
    });
  });

  describe('validateOverlaySettings', () => {
    it('should validate and fix invalid font size', () => {
      const invalidSettings: Partial<OverlaySettings> = {
        font: { family: 'Arial', size: 100, color: '#000', weight: 'bold' }
      };

      const validated = validateOverlaySettings(invalidSettings);
      expect(validated.font.size).toBe(72); // Should be clamped to max
    });

    it('should validate and fix invalid opacity', () => {
      const invalidSettings: Partial<OverlaySettings> = {
        background: { color: '#000', opacity: 2, padding: 10, borderRadius: 5 }
      };

      const validated = validateOverlaySettings(invalidSettings);
      expect(validated.background.opacity).toBe(1); // Should be clamped to max
    });

    it('should use defaults for missing properties', () => {
      const partialSettings: Partial<OverlaySettings> = {
        position: 'top-right'
      };

      const validated = validateOverlaySettings(partialSettings);
      expect(validated.position).toBe('top-right');
      expect(validated.font.family).toBe('Inter'); // Should use default
    });
  });

  describe('createDefaultFrameSettings', () => {
    it('should create default frame settings', () => {
      const settings = createDefaultFrameSettings();

      expect(settings.enabled).toBe(false);
      expect(settings.style).toBe('simple');
      expect(settings.color).toBe('#ffffff');
      expect(settings.width).toBe(20);
      expect(settings.opacity).toBe(1);
      expect(settings.customProperties?.shadowBlur).toBe(10);
      expect(settings.customProperties?.shadowOffset?.x).toBe(0);
      expect(settings.customProperties?.shadowOffset?.y).toBe(5);
    });
  });

  describe('validateFrameSettings', () => {
    it('should validate and fix negative width', () => {
      const invalidSettings: Partial<FrameSettings> = {
        width: -10
      };

      const validated = validateFrameSettings(invalidSettings);
      expect(validated.width).toBe(0); // Should be clamped to min
    });

    it('should validate and fix invalid opacity', () => {
      const invalidSettings: Partial<FrameSettings> = {
        opacity: 1.5
      };

      const validated = validateFrameSettings(invalidSettings);
      expect(validated.opacity).toBe(1); // Should be clamped to max
    });
  });

  describe('createAppError', () => {
    it('should create app error with correct properties', () => {
      const error = createAppError('FILE_NOT_FOUND', 'Custom message', 'Details', 'test.jpg');

      expect(error.code).toBe('FILE_NOT_FOUND');
      expect(error.message).toBe('Custom message');
      expect(error.details).toBe('Details');
      expect(error.fileName).toBe('test.jpg');
      expect(error.severity).toBe('high');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should use default message when none provided', () => {
      const error = createAppError('MEMORY_ERROR');

      expect(error.message).toBe('Insufficient memory to process this image');
      expect(error.severity).toBe('critical');
    });
  });

  describe('createProcessingError', () => {
    it('should create processing error with step information', () => {
      const error = createProcessingError('test.jpg', 'exif_extraction', 'EXIF_READ_ERROR');

      expect(error.fileName).toBe('test.jpg');
      expect(error.step).toBe('exif_extraction');
      expect(error.code).toBe('EXIF_READ_ERROR');
      expect(error.retryCount).toBe(0);
    });
  });

  describe('extractDisplayableMetadata', () => {
    it('should extract selected metadata fields', () => {
      const mockMetadata: PhotoMetadata = {
        fileName: 'test.jpg',
        filePath: '/path/test.jpg',
        fileSize: 1000,
        dimensions: { width: 1920, height: 1080 },
        createdAt: new Date(),
        modifiedAt: new Date(),
        mimeType: 'image/jpeg',
        exif: {
          make: 'Canon',
          model: 'EOS R5',
          aperture: 'f/2.8',
          shutterSpeed: '1/125',
          iso: 'ISO 400',
          dateTimeOriginal: '2023-01-01T12:00:00Z',
          gps: {
            latitude: 40.7128,
            longitude: -74.0060
          }
        }
      };

      const displayItems = {
        brand: true,
        model: true,
        aperture: false,
        shutterSpeed: true,
        iso: false,
        timestamp: false,
        location: true,
        brandLogo: false,
      };

      const result = extractDisplayableMetadata(mockMetadata, displayItems);

      expect(result.brand).toBe('Canon');
      expect(result.model).toBe('EOS R5');
      expect(result.shutterSpeed).toBe('1/125');
      expect(result.location).toContain('40.7128°N');
      expect(result.aperture).toBeUndefined(); // Should not be included
      expect(result.iso).toBeUndefined(); // Should not be included
    });

    it('should return empty object when no exif data', () => {
      const mockMetadata: PhotoMetadata = {
        fileName: 'test.jpg',
        filePath: '/path/test.jpg',
        fileSize: 1000,
        dimensions: { width: 1920, height: 1080 },
        createdAt: new Date(),
        modifiedAt: new Date(),
        mimeType: 'image/jpeg',
        // No exif data
      };

      const displayItems = {
        brand: true,
        model: true,
        aperture: true,
        shutterSpeed: true,
        iso: true,
        timestamp: true,
        location: true,
        brandLogo: true,
      };

      const result = extractDisplayableMetadata(mockMetadata, displayItems);
      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('isValidImageFile', () => {
    it('should return true for valid image files', () => {
      const jpegFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const pngFile = new File([''], 'test.png', { type: 'image/png' });

      expect(isValidImageFile(jpegFile)).toBe(true);
      expect(isValidImageFile(pngFile)).toBe(true);
    });

    it('should return false for invalid file types', () => {
      const textFile = new File([''], 'test.txt', { type: 'text/plain' });
      const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });

      expect(isValidImageFile(textFile)).toBe(false);
      expect(isValidImageFile(pdfFile)).toBe(false);
    });
  });

  describe('isValidFileExtension', () => {
    it('should return true for valid extensions', () => {
      expect(isValidFileExtension('photo.jpg')).toBe(true);
      expect(isValidFileExtension('image.PNG')).toBe(true);
      expect(isValidFileExtension('pic.jpeg')).toBe(true);
    });

    it('should return false for invalid extensions', () => {
      expect(isValidFileExtension('document.txt')).toBe(false);
      expect(isValidFileExtension('file.pdf')).toBe(false);
      expect(isValidFileExtension('noextension')).toBe(false);
    });
  });
});
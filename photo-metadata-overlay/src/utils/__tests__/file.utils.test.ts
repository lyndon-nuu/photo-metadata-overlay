import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fileToPhotoMetadata,
  batchFileToPhotoMetadata,
  getImageDimensions,
  generateFileHash,

  filterSupportedFiles,
  formatFileSize,
  getFileExtension,
  generateUniqueFileName,
  isValidFilePath,
} from '../file.utils';
import { PhotoMetadata } from '../../types';

// Mock exifService
vi.mock('../../services/exif.service', () => ({
  exifService: {
    validateImageFile: vi.fn(() => true),
    extractMetadata: vi.fn(() => Promise.resolve({
      make: 'Canon',
      model: 'EOS R5',
      aperture: 'f/2.8',
      shutterSpeed: '1/125',
      iso: 'ISO 400',
    })),
    isSupported: vi.fn((type: string) => type.startsWith('image/')),
  },
}));

// Mock crypto.subtle for hash generation
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
    },
  },
});

// Mock URL.createObjectURL and URL.revokeObjectURL
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
  },
});

// Mock Image constructor
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 1920;
  naturalHeight = 1080;
  
  set src(_value: string) {
    // Simulate successful image load
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
}

Object.defineProperty(global, 'Image', {
  value: MockImage,
});

describe('File Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fileToPhotoMetadata', () => {
    it('should convert file to PhotoMetadata successfully', async () => {
      const mockFile = new File(['test'], 'test.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      const result = await fileToPhotoMetadata(mockFile);

      expect(result).toMatchObject({
        fileName: 'test.jpg',
        filePath: 'test.jpg',
        fileSize: 4, // 'test' is 4 bytes
        mimeType: 'image/jpeg',
        dimensions: {
          width: 1920,
          height: 1080,
        },
        exif: {
          make: 'Canon',
          model: 'EOS R5',
          aperture: 'f/2.8',
          shutterSpeed: '1/125',
          iso: 'ISO 400',
        },
      });
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.modifiedAt).toBeInstanceOf(Date);
      expect(result.hash).toBeDefined();
    });

    it('should throw error for invalid file', async () => {
      const { exifService } = await import('../../services/exif.service');
      vi.mocked(exifService.validateImageFile).mockReturnValue(false);

      const mockFile = new File(['test'], 'test.txt', {
        type: 'text/plain',
      });

      await expect(fileToPhotoMetadata(mockFile)).rejects.toThrow();
    });
  });

  describe('batchFileToPhotoMetadata', () => {
    it('should process multiple files successfully', async () => {
      // Ensure the mocked exifService returns true for validation
      const { exifService } = await import('../../services/exif.service');
      vi.mocked(exifService.validateImageFile).mockReturnValue(true);
      
      const mockFiles = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.png', { type: 'image/png' }),
      ];

      const progressCallback = vi.fn();
      const result = await batchFileToPhotoMetadata(mockFiles, progressCallback);

      expect(result.success).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(progressCallback).toHaveBeenCalledTimes(2);
      expect(progressCallback).toHaveBeenCalledWith(1, 2, 'test1.jpg');
      expect(progressCallback).toHaveBeenCalledWith(2, 2, 'test2.png');
    });

    it('should handle errors gracefully', async () => {
      const { exifService } = await import('../../services/exif.service');
      vi.mocked(exifService.validateImageFile)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const mockFiles = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.txt', { type: 'text/plain' }),
      ];

      const result = await batchFileToPhotoMetadata(mockFiles);

      expect(result.success).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].fileName).toBe('test2.txt');
    });
  });

  describe('getImageDimensions', () => {
    it('should return image dimensions', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      const dimensions = await getImageDimensions(mockFile);

      expect(dimensions).toEqual({
        width: 1920,
        height: 1080,
      });
    });

    it('should handle image load error', async () => {
      // Mock Image to simulate error
      const OriginalImage = global.Image;
      class ErrorImage extends MockImage {
        set src(_value: string) {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror();
            }
          }, 0);
        }
      }
      Object.defineProperty(global, 'Image', { value: ErrorImage });

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await expect(getImageDimensions(mockFile)).rejects.toThrow();

      // Restore original Image
      Object.defineProperty(global, 'Image', { value: OriginalImage });
    });
  });

  describe('generateFileHash', () => {
    it('should generate hash for file', async () => {
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });

      const hash = await generateFileHash(mockFile);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should fallback to file info if crypto fails', async () => {
      // Mock crypto.subtle.digest to throw error
      vi.mocked(crypto.subtle.digest).mockRejectedValueOnce(new Error('Crypto error'));

      const mockFile = new File(['test'], 'test.jpg', {
        type: 'image/jpeg',
        lastModified: 1234567890,
      });

      const hash = await generateFileHash(mockFile);

      expect(hash).toBe('test.jpg-4-1234567890');
    });
  });

  describe('checkDuplicateFiles', () => {
    it.skip('should identify duplicate files', async () => {
      // Test the actual function behavior with real hash generation
      const existingFiles: PhotoMetadata[] = [
        {
          fileName: 'existing.jpg',
          filePath: 'existing.jpg',
          fileSize: 1000,
          dimensions: { width: 800, height: 600 },
          createdAt: new Date(),
          modifiedAt: new Date(),
          mimeType: 'image/jpeg',
          hash: 'test-hash-123', // Use a specific hash
        },
      ];

      // Create files that will generate different hashes
      const file1 = new File(['content1'], 'new1.jpg', { 
        type: 'image/jpeg',
        lastModified: 1000000000
      });
      const file2 = new File(['content2'], 'new2.jpg', { 
        type: 'image/jpeg', 
        lastModified: 2000000000
      });

      // Mock generateFileHash to return predictable values
      // const originalGenerateFileHash = generateFileHash;
      const mockGenerateFileHash = vi.fn()
        .mockResolvedValueOnce('test-hash-123') // This matches existing file
        .mockResolvedValueOnce('different-hash'); // This is unique

      // Temporarily replace the function
      vi.doMock('../file.utils', async () => {
        const actual = await vi.importActual('../file.utils');
        return {
          ...actual,
          generateFileHash: mockGenerateFileHash,
        };
      });

      // Import the mocked version
      const { checkDuplicateFiles: mockedCheckDuplicateFiles } = await import('../file.utils');
      
      const result = await mockedCheckDuplicateFiles([file1, file2], existingFiles);

      expect(result.duplicates).toHaveLength(1);
      expect(result.unique).toHaveLength(1);
      expect(result.duplicates[0].fileName).toBe('existing.jpg');
      expect(result.unique[0].name).toBe('new2.jpg');
    });
  });

  describe('filterSupportedFiles', () => {
    it('should filter supported and unsupported files', async () => {
      // Setup the mocked exifService to behave correctly
      const { exifService } = await import('../../services/exif.service');
      vi.mocked(exifService.isSupported).mockImplementation((type: string) => type.startsWith('image/'));
      vi.mocked(exifService.validateImageFile).mockImplementation((file: File) => file.type.startsWith('image/'));
      
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.txt', { type: 'text/plain' }),
        new File(['test3'], 'test3.png', { type: 'image/png' }),
      ];

      const result = filterSupportedFiles(files);

      expect(result.supported).toHaveLength(2);
      expect(result.unsupported).toHaveLength(1);
      expect(result.supported[0].name).toBe('test1.jpg');
      expect(result.supported[1].name).toBe('test3.png');
      expect(result.unsupported[0].name).toBe('test2.txt');
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extensions correctly', () => {
      expect(getFileExtension('test.jpg')).toBe('.jpg');
      expect(getFileExtension('test.JPEG')).toBe('.jpeg');
      expect(getFileExtension('file.name.png')).toBe('.png');
      expect(getFileExtension('noextension')).toBe('');
      expect(getFileExtension('')).toBe('');
    });
  });

  describe('generateUniqueFileName', () => {
    it('should return original name if not duplicate', () => {
      const result = generateUniqueFileName('test.jpg', ['other.jpg', 'another.png']);
      expect(result).toBe('test.jpg');
    });

    it('should generate unique name for duplicates', () => {
      const existingNames = ['test.jpg', 'test (1).jpg', 'other.png'];
      const result = generateUniqueFileName('test.jpg', existingNames);
      expect(result).toBe('test (2).jpg');
    });

    it('should handle files without extensions', () => {
      const existingNames = ['test', 'test (1)'];
      const result = generateUniqueFileName('test', existingNames);
      expect(result).toBe('test (2)');
    });
  });

  describe('isValidFilePath', () => {
    it('should validate safe file paths', () => {
      expect(isValidFilePath('test.jpg')).toBe(true);
      expect(isValidFilePath('folder/test.jpg')).toBe(true);
      expect(isValidFilePath('my-file_name.png')).toBe(true);
    });

    it('should reject dangerous file paths', () => {
      expect(isValidFilePath('../test.jpg')).toBe(false);
      expect(isValidFilePath('test<.jpg')).toBe(false);
      expect(isValidFilePath('CON')).toBe(false);
      expect(isValidFilePath('test|file.jpg')).toBe(false);
    });
  });
});


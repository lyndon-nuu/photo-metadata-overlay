import {
  OverlaySettings,
  FrameSettings,
  ProcessingSettings,
  ProcessingStatus,
  PhotoMetadata,
  ExifData,
  AppError,
  ProcessingError,
  ErrorCode,
  UserFriendlyMessage,
} from '../types/index';
import {
  DEFAULT_OVERLAY_SETTINGS,
  DEFAULT_FRAME_SETTINGS,
  DEFAULT_PROCESSING_SETTINGS,
  DEFAULT_PROCESSING_STATUS,
  ERROR_MESSAGES,
} from '../constants/design-tokens';

// Overlay settings utilities
export const createDefaultOverlaySettings = (): OverlaySettings => ({
  ...DEFAULT_OVERLAY_SETTINGS,
});

export const validateOverlaySettings = (settings: Partial<OverlaySettings>): OverlaySettings => {
  return {
    position: settings.position || DEFAULT_OVERLAY_SETTINGS.position,
    font: {
      family: settings.font?.family || DEFAULT_OVERLAY_SETTINGS.font.family,
      size: Math.max(8, Math.min(72, settings.font?.size || DEFAULT_OVERLAY_SETTINGS.font.size)),
      color: settings.font?.color || DEFAULT_OVERLAY_SETTINGS.font.color,
      weight: settings.font?.weight || DEFAULT_OVERLAY_SETTINGS.font.weight,
    },
    background: {
      color: settings.background?.color || DEFAULT_OVERLAY_SETTINGS.background.color,
      opacity: Math.max(0, Math.min(1, settings.background?.opacity || DEFAULT_OVERLAY_SETTINGS.background.opacity)),
      padding: Math.max(0, settings.background?.padding || DEFAULT_OVERLAY_SETTINGS.background.padding),
      borderRadius: Math.max(0, settings.background?.borderRadius || DEFAULT_OVERLAY_SETTINGS.background.borderRadius),
    },
    displayItems: {
      brand: settings.displayItems?.brand ?? DEFAULT_OVERLAY_SETTINGS.displayItems.brand,
      model: settings.displayItems?.model ?? DEFAULT_OVERLAY_SETTINGS.displayItems.model,
      aperture: settings.displayItems?.aperture ?? DEFAULT_OVERLAY_SETTINGS.displayItems.aperture,
      shutterSpeed: settings.displayItems?.shutterSpeed ?? DEFAULT_OVERLAY_SETTINGS.displayItems.shutterSpeed,
      iso: settings.displayItems?.iso ?? DEFAULT_OVERLAY_SETTINGS.displayItems.iso,
      timestamp: settings.displayItems?.timestamp ?? DEFAULT_OVERLAY_SETTINGS.displayItems.timestamp,
      location: settings.displayItems?.location ?? DEFAULT_OVERLAY_SETTINGS.displayItems.location,
      brandLogo: settings.displayItems?.brandLogo ?? DEFAULT_OVERLAY_SETTINGS.displayItems.brandLogo,
    },
  };
};

// Frame settings utilities
export const createDefaultFrameSettings = (): FrameSettings => ({
  ...DEFAULT_FRAME_SETTINGS,
  customProperties: { ...DEFAULT_FRAME_SETTINGS.customProperties },
});

export const validateFrameSettings = (settings: Partial<FrameSettings>): FrameSettings => {
  return {
    enabled: settings.enabled ?? DEFAULT_FRAME_SETTINGS.enabled,
    style: settings.style || DEFAULT_FRAME_SETTINGS.style,
    color: settings.color || DEFAULT_FRAME_SETTINGS.color,
    width: Math.max(0, settings.width || DEFAULT_FRAME_SETTINGS.width),
    opacity: Math.max(0, Math.min(1, settings.opacity || DEFAULT_FRAME_SETTINGS.opacity)),
    customProperties: {
      shadowBlur: Math.max(0, settings.customProperties?.shadowBlur || DEFAULT_FRAME_SETTINGS.customProperties?.shadowBlur || 0),
      shadowOffset: {
        x: settings.customProperties?.shadowOffset?.x || DEFAULT_FRAME_SETTINGS.customProperties?.shadowOffset?.x || 0,
        y: settings.customProperties?.shadowOffset?.y || DEFAULT_FRAME_SETTINGS.customProperties?.shadowOffset?.y || 0,
      },
      cornerRadius: Math.max(0, settings.customProperties?.cornerRadius || DEFAULT_FRAME_SETTINGS.customProperties?.cornerRadius || 0),
    },
  };
};

// Processing settings utilities
export const createDefaultProcessingSettings = (
  overlaySettings: OverlaySettings,
  frameSettings: FrameSettings
): ProcessingSettings => ({
  overlaySettings,
  frameSettings,
  ...DEFAULT_PROCESSING_SETTINGS,
});

export const validateProcessingSettings = (settings: Partial<ProcessingSettings>): ProcessingSettings => {
  return {
    overlaySettings: settings.overlaySettings || createDefaultOverlaySettings(),
    frameSettings: settings.frameSettings || createDefaultFrameSettings(),
    exportFormat: settings.exportFormat || DEFAULT_PROCESSING_SETTINGS.exportFormat,
    exportQuality: Math.max(0.1, Math.min(1, settings.exportQuality || DEFAULT_PROCESSING_SETTINGS.exportQuality)),
    outputPath: settings.outputPath || DEFAULT_PROCESSING_SETTINGS.outputPath,
    preserveOriginal: settings.preserveOriginal ?? DEFAULT_PROCESSING_SETTINGS.preserveOriginal,
    addSuffix: settings.addSuffix ?? DEFAULT_PROCESSING_SETTINGS.addSuffix,
    suffix: settings.suffix || DEFAULT_PROCESSING_SETTINGS.suffix,
  };
};

// Processing status utilities
export const createDefaultProcessingStatus = (): ProcessingStatus => ({
  ...DEFAULT_PROCESSING_STATUS,
  errors: [],
});

export const updateProcessingProgress = (
  status: ProcessingStatus,
  progress: number,
  currentFile?: string
): ProcessingStatus => ({
  ...status,
  progress: Math.max(0, Math.min(100, progress)),
  currentFile,
});

export const addProcessingError = (
  status: ProcessingStatus,
  error: ProcessingError
): ProcessingStatus => ({
  ...status,
  errors: [...status.errors, error],
});

// Error handling utilities
export const createAppError = (
  code: ErrorCode,
  message?: string,
  details?: string,
  fileName?: string
): AppError => ({
  code,
  message: message || ERROR_MESSAGES[code] || 'Unknown error occurred',
  details,
  timestamp: new Date(),
  severity: getSeverityForErrorCode(code),
  fileName,
});

export const createProcessingError = (
  fileName: string,
  step: ProcessingError['step'],
  code: ErrorCode,
  message?: string,
  details?: string
): ProcessingError => ({
  ...createAppError(code, message, details, fileName),
  fileName,
  step,
  retryCount: 0,
});

export const getSeverityForErrorCode = (code: ErrorCode): AppError['severity'] => {
  switch (code) {
    case 'MEMORY_ERROR':
    case 'CANVAS_ERROR':
      return 'critical';
    case 'FILE_NOT_FOUND':
    case 'ACCESS_DENIED':
    case 'EXPORT_ERROR':
      return 'high';
    case 'EXIF_READ_ERROR':
    case 'IMAGE_PROCESSING_ERROR':
    case 'TIMEOUT_ERROR':
      return 'medium';
    case 'FONT_LOAD_ERROR':
    case 'LOGO_LOAD_ERROR':
    case 'UNSUPPORTED_FORMAT':
      return 'low';
    default:
      return 'medium';
  }
};

export const createUserFriendlyMessage = (error: AppError): UserFriendlyMessage => {
  const baseMessage = error.message;
  let action: string | undefined;

  switch (error.code) {
    case 'FILE_NOT_FOUND':
      action = 'Please check if the file still exists';
      break;
    case 'ACCESS_DENIED':
      action = 'Please check file permissions';
      break;
    case 'UNSUPPORTED_FORMAT':
      action = 'Please use JPEG, PNG, or other supported formats';
      break;
    case 'MEMORY_ERROR':
      action = 'Try processing smaller images or restart the application';
      break;
    case 'EXPORT_ERROR':
      action = 'Please check available disk space and try again';
      break;
  }

  return {
    message: baseMessage,
    severity: error.severity === 'critical' ? 'error' : error.severity === 'high' ? 'error' : 'warning',
    action,
    dismissible: error.severity !== 'critical',
  };
};

// Photo metadata utilities
export const extractDisplayableMetadata = (
  metadata: PhotoMetadata,
  displayItems: OverlaySettings['displayItems']
): Record<string, string> => {
  const result: Record<string, string> = {};
  const exif = metadata.exif;

  if (!exif) return result;

  if (displayItems.brand && exif.make) {
    result.brand = exif.make;
  }

  if (displayItems.model && exif.model) {
    result.model = exif.model;
  }

  if (displayItems.aperture && exif.aperture) {
    result.aperture = exif.aperture;
  }

  if (displayItems.shutterSpeed && exif.shutterSpeed) {
    result.shutterSpeed = exif.shutterSpeed;
  }

  if (displayItems.iso && exif.iso) {
    result.iso = exif.iso;
  }

  if (displayItems.timestamp && exif.dateTimeOriginal) {
    result.timestamp = formatDateTime(exif.dateTimeOriginal);
  }

  if (displayItems.location && exif.gps) {
    result.location = formatGpsLocation(exif.gps);
  }

  return result;
};

export const formatDateTime = (dateTimeString: string): string => {
  try {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  } catch {
    return dateTimeString;
  }
};

export const formatGpsLocation = (gps: ExifData['gps']): string => {
  if (!gps) return '';
  
  const lat = Math.abs(gps.latitude).toFixed(4);
  const lng = Math.abs(gps.longitude).toFixed(4);
  const latDir = gps.latitude >= 0 ? 'N' : 'S';
  const lngDir = gps.longitude >= 0 ? 'E' : 'W';
  
  return `${lat}°${latDir}, ${lng}°${lngDir}`;
};

// Validation utilities
export const isValidImageFile = (file: File): boolean => {
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/tiff',
    'image/bmp',
  ];
  
  return validTypes.includes(file.type);
};

export const getFileExtension = (fileName: string): string => {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot !== -1 ? fileName.substring(lastDot).toLowerCase() : '';
};

export const isValidFileExtension = (fileName: string): boolean => {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.bmp'];
  const extension = getFileExtension(fileName);
  return validExtensions.includes(extension);
};

// Deep clone utilities for immutable updates
export const cloneOverlaySettings = (settings: OverlaySettings): OverlaySettings => ({
  ...settings,
  font: { ...settings.font },
  background: { ...settings.background },
  displayItems: { ...settings.displayItems },
});

export const cloneFrameSettings = (settings: FrameSettings): FrameSettings => ({
  ...settings,
  customProperties: settings.customProperties ? { 
    ...settings.customProperties,
    shadowOffset: settings.customProperties.shadowOffset ? 
      { ...settings.customProperties.shadowOffset } : undefined,
  } : undefined,
});

export const cloneProcessingSettings = (settings: ProcessingSettings): ProcessingSettings => ({
  ...settings,
  overlaySettings: cloneOverlaySettings(settings.overlaySettings),
  frameSettings: cloneFrameSettings(settings.frameSettings),
});
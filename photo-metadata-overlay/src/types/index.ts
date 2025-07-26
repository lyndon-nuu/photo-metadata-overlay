// Photo metadata types
export interface PhotoMetadata {
  fileName: string;
  filePath: string;
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
  };
  exif?: ExifData;
  createdAt: Date;
  modifiedAt: Date;
  mimeType: string;
  hash?: string; // For duplicate detection
}

// File with metadata for UI components
export interface FileWithMetadata {
  file: File;
  metadata: PhotoMetadata;
}

export interface ExifData {
  // Camera information
  make?: string; // Camera manufacturer
  model?: string; // Camera model
  lens?: string; // Lens model

  // Shooting parameters
  focalLength?: string; // e.g., "50mm"
  aperture?: string; // e.g., "f/2.8"
  shutterSpeed?: string; // e.g., "1/125"
  iso?: string; // e.g., "ISO 400"
  exposureMode?: string;
  meteringMode?: string;
  whiteBalance?: string;
  flash?: string;

  // Date and time
  dateTime?: string;
  dateTimeOriginal?: string;
  dateTimeDigitized?: string;

  // GPS information
  gps?: {
    latitude: number;
    longitude: number;
    altitude?: number;
    direction?: number;
  };

  // Image properties
  colorSpace?: string;
  orientation?: number;
  xResolution?: number;
  yResolution?: number;
  resolutionUnit?: string;

  // Additional metadata
  software?: string;
  artist?: string;
  copyright?: string;
  imageDescription?: string;
}

// Overlay settings types (aligned with design document)
export interface OverlaySettings {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  font: {
    family: string;
    size: number;
    color: string;
    weight: 'normal' | 'bold';
  };
  background: {
    color: string;
    opacity: number;
    padding: number;
    borderRadius: number;
  };
  displayItems: {
    brand: boolean;
    model: boolean;
    aperture: boolean;
    shutterSpeed: boolean;
    iso: boolean;
    timestamp: boolean;
    location: boolean;
    brandLogo: boolean;
  };
}

// Legacy overlay config for backward compatibility
export interface OverlayConfig {
  id: string;
  name: string;
  template: OverlayTemplate;
  position: Position;
  style: OverlayStyle;
  fields: MetadataField[];
}

export interface OverlayTemplate {
  id: string;
  name: string;
  layout: 'horizontal' | 'vertical' | 'grid';
  background: BackgroundStyle;
}

export interface Position {
  x: number;
  y: number;
  anchor: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

export interface OverlayStyle {
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
  padding: number;
  borderRadius: number;
  opacity: number;
  shadow: boolean;
}

export interface BackgroundStyle {
  type: 'solid' | 'gradient' | 'transparent';
  color: string;
  gradient?: {
    from: string;
    to: string;
    direction: number;
  };
}

export interface MetadataField {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  format?: string;
}

// Frame settings types (aligned with design document)
export interface FrameSettings {
  enabled: boolean;
  style: 'simple' | 'shadow' | 'film' | 'polaroid' | 'vintage';
  color: string;
  width: number;
  opacity: number;
  customProperties?: {
    shadowBlur?: number;
    shadowOffset?: { x: number; y: number };
    cornerRadius?: number;
  };
}

// Image processing settings
export interface ImageProcessingSettings {
  // 分辨率设置
  preserveOriginalResolution: boolean; // 保持原始分辨率
  maxDimension: number; // 最大尺寸限制（像素）
  
  // 质量设置
  jpegQuality: number; // JPEG质量 (1-100)
  pngCompression: number; // PNG压缩级别 (0-9)
  
  // 性能设置
  enableCache: boolean; // 启用缓存
  maxCacheSize: number; // 最大缓存数量
  
  // 内存管理
  enableMemoryOptimization: boolean; // 启用内存优化
  memoryThreshold: number; // 内存阈值 (0-1)
}

// Legacy frame types for backward compatibility
export interface LegacyFrameSettings {
  id: string;
  name: string;
  enabled: boolean;
  style: FrameStyle;
  dimensions: FrameDimensions;
}

export interface FrameStyle {
  type: 'simple' | 'shadow' | 'film' | 'polaroid' | 'vintage';
  color: string;
  width: number;
  opacity: number;
  borderRadius?: number;
  shadow?: ShadowSettings;
}

export interface FrameDimensions {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ShadowSettings {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
}

// Error handling types (comprehensive error system)
export interface AppError {
  code: ErrorCode;
  message: string;
  details?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fileName?: string;
  stack?: string;
}

export type ErrorCode =
  | 'FILE_NOT_FOUND'
  | 'FILE_READ_ERROR'
  | 'INVALID_FILE_FORMAT'
  | 'EXIF_READ_ERROR'
  | 'IMAGE_PROCESSING_ERROR'
  | 'EXPORT_ERROR'
  | 'STORAGE_ERROR'
  | 'NETWORK_ERROR'
  | 'ACCESS_DENIED'
  | 'UNSUPPORTED_FORMAT'
  | 'MEMORY_ERROR'
  | 'TIMEOUT_ERROR'
  | 'CANVAS_ERROR'
  | 'FONT_LOAD_ERROR'
  | 'LOGO_LOAD_ERROR'
  | 'UNKNOWN_ERROR';

// File processing errors
export interface FileError extends AppError {
  fileName: string;
  filePath: string;
  fileSize?: number;
}

export interface ProcessingError extends AppError {
  fileName: string;
  step: ProcessingStep;
  retryCount?: number;
}

export type ProcessingStep = 
  | 'file_validation'
  | 'exif_extraction'
  | 'image_loading'
  | 'overlay_application'
  | 'frame_application'
  | 'export'
  | 'save';

// User-friendly error messages
export interface UserFriendlyMessage {
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  action?: string;
  dismissible?: boolean;
}

// Processing status types (aligned with design document)
export interface ProcessingStatus {
  isProcessing: boolean;
  currentFile?: string;
  progress: number;
  totalFiles: number;
  completedFiles: number;
  errors: ProcessingError[];
}

export interface ProcessProgress {
  taskId: string;
  fileName: string;
  progress: number;
  status: ProcessingTaskStatus;
  error?: ProcessingError;
}

export interface ProcessingResults {
  totalFiles: number;
  successCount: number;
  errorCount: number;
  errors: ProcessingError[];
  duration: number;
  outputPath?: string;
}

export type ProcessingTaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Processing settings
export interface ProcessingSettings {
  overlaySettings: OverlaySettings;
  frameSettings: FrameSettings;
  exportFormat: 'jpeg' | 'png';
  exportQuality: number;
  outputPath: string;
  preserveOriginal: boolean;
  addSuffix: boolean;
  suffix: string;
}

// Application state types
export interface AppState {
  currentPhoto: PhotoMetadata | null;
  overlaySettings: OverlaySettings | null;
  frameSettings: FrameSettings | null;
  isPreviewMode: boolean;
  isLoading: boolean;
  error: AppError | null;
  selectedFiles: PhotoMetadata[];
  processingQueue: ProcessingTask[];
  processingStatus: ProcessingStatus;
}

export interface ProcessingTask {
  id: string;
  photo: PhotoMetadata;
  settings: ProcessingSettings;
  status: ProcessingTaskStatus;
  progress: number;
  error?: ProcessingError;
  startTime?: Date;
  endTime?: Date;
  outputPath?: string;
}

// Settings and configuration types
export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  defaultExportFormat: 'jpeg' | 'png';
  defaultExportQuality: number;
  autoSave: boolean;
  recentTemplates: string[];
  shortcuts: KeyboardShortcuts;
}

export interface KeyboardShortcuts {
  openFile: string;
  exportImage: string;
  togglePreview: string;
  undo: string;
  redo: string;
  save: string;
}

// UI component props
export interface PhotoViewerProps {
  photo: PhotoMetadata;
  overlayConfig?: OverlayConfig;
  frameSettings?: FrameSettings;
  onPhotoChange: (photo: PhotoMetadata) => void;
  onZoomChange?: (zoom: number) => void;
  onPositionChange?: (x: number, y: number) => void;
}

export interface OverlayEditorProps {
  config: OverlayConfig;
  onChange: (config: OverlayConfig) => void;
  onPreview?: (config: OverlayConfig) => void;
}

export interface FrameEditorProps {
  settings: FrameSettings;
  onChange: (settings: FrameSettings) => void;
  onPreview?: (settings: FrameSettings) => void;
}

export interface MetadataDisplayProps {
  metadata: PhotoMetadata;
  config: OverlayConfig;
  className?: string;
}

export interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string[];
  multiple?: boolean;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
}

export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

export interface BatchProcessorProps {
  tasks: ProcessingTask[];
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onTaskRemove: (taskId: string) => void;
}

// Backend API types (matching Rust types)
export interface BackendPhotoMetadata {
  camera: {
    make?: string;
    model?: string;
  };
  settings: {
    aperture?: string;
    shutter_speed?: string;
    iso?: number;
    focal_length?: string;
  };
  timestamp?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface BackendOverlaySettings {
  position: 'TopLeft' | 'TopRight' | 'BottomLeft' | 'BottomRight';
  font: {
    family: string;
    size: number;
    color: string;
    weight: 'Normal' | 'Bold';
  };
  background: {
    color: string;
    opacity: number;
    padding: number;
    border_radius: number;
  };
  display_items: {
    brand: boolean;
    model: boolean;
    aperture: boolean;
    shutter_speed: boolean;
    iso: boolean;
    timestamp: boolean;
    location: boolean;
    brand_logo: boolean;
  };
}

export interface BackendFrameSettings {
  enabled: boolean;
  style: 'Simple' | 'Shadow' | 'Film' | 'Polaroid' | 'Vintage';
  color: string;
  width: number;
  opacity: number;
  custom_properties?: Record<string, any>;
}

export interface BackendProcessingSettings {
  overlay_settings: BackendOverlaySettings;
  frame_settings: BackendFrameSettings;
  output_format: 'Jpeg' | 'Png';
  quality: number;
}

export interface BackendProcessedImageInfo {
  input_path: string;
  output_path: string;
  original_size: number;
  processed_size: number;
  processing_time_ms: number;
}

export interface BackendBatchProcessingResult {
  total_files: number;
  successful: BackendProcessedImageInfo[];
  failed: BackendProcessingError[];
  total_time_ms: number;
}

export interface BackendProcessingError {
  file_path: string;
  error_message: string;
  error_type: 'FileNotFound' | 'InvalidFormat' | 'ExifReadError' | 'ImageProcessingError' | 'OutputError' | 'PermissionDenied';
}

export interface BackendPreviewSettings {
  max_width: number;
  max_height: number;
  overlay_settings: BackendOverlaySettings;
  frame_settings: BackendFrameSettings;
}

// Tauri API wrapper functions
export interface TauriAPI {
  greet(name: string): Promise<string>;
  extractMetadata(filePath: string): Promise<BackendPhotoMetadata>;
  validateImageFile(filePath: string): Promise<boolean>;
  processImage(
    inputPath: string,
    metadata: BackendPhotoMetadata,
    overlaySettings: BackendOverlaySettings,
    frameSettings: BackendFrameSettings,
    outputPath: string,
    quality: number
  ): Promise<BackendProcessedImageInfo>;
  batchProcessImages(
    imagePaths: string[],
    settings: BackendProcessingSettings,
    outputDir: string
  ): Promise<BackendBatchProcessingResult>;
  generatePreview(
    imagePath: string,
    settings: BackendPreviewSettings
  ): Promise<number[]>; // Vec<u8> as number array
  saveProcessedImage(
    inputPath: string,
    metadata: BackendPhotoMetadata,
    overlaySettings: BackendOverlaySettings,
    frameSettings: BackendFrameSettings,
    quality: number
  ): Promise<string>; // Returns saved file path
}

// Service interfaces
export interface ExifService {
  extractMetadata(file: File): Promise<ExifData>;
  isSupported(mimeType: string): boolean;
  validateImageFile(file: File): boolean;
}

export interface ImageProcessingService {
  loadImage(file: File): Promise<HTMLImageElement>;
  applyOverlay(
    image: HTMLImageElement,
    metadata: PhotoMetadata,
    settings: OverlaySettings
  ): Promise<HTMLCanvasElement>;
  applyFrame(
    canvas: HTMLCanvasElement,
    frameSettings: FrameSettings
  ): Promise<HTMLCanvasElement>;
  exportImage(
    canvas: HTMLCanvasElement,
    format: 'jpeg' | 'png',
    quality?: number
  ): Promise<Blob>;
}

export interface BrandLogoService {
  getBrandLogo(brandName: string): Promise<string | null>;
  isBrandSupported(brandName: string): boolean;
  getSupportedBrands(): string[];
  clearCache(brandName?: string): void;
  preloadLogos(brands?: string[]): Promise<void>;
}

export interface StorageService {
  saveSettings(settings: UserSettings): Promise<void>;
  loadSettings(): Promise<UserSettings>;
  saveOverlaySettings(settings: OverlaySettings): Promise<void>;
  loadOverlaySettings(): Promise<OverlaySettings>;
  saveFrameSettings(settings: FrameSettings): Promise<void>;
  loadFrameSettings(): Promise<FrameSettings>;
  saveTemplate(template: OverlayConfig): Promise<void>;
  loadTemplates(): Promise<OverlayConfig[]>;
  deleteTemplate(id: string): Promise<void>;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

// Event types
export interface FileSelectedEvent {
  files: File[];
  source: 'drop' | 'click' | 'paste' | 'file-input';
}

export interface OverlayChangeEvent {
  config: OverlayConfig;
  field: keyof OverlayConfig;
  oldValue: unknown;
  newValue: unknown;
}

export interface ProcessingProgressEvent {
  taskId: string;
  progress: number;
  status: ProcessingTask['status'];
  error?: AppError;
}

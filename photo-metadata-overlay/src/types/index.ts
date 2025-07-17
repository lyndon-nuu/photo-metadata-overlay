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

// Overlay configuration types
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

// Frame settings types
export interface FrameSettings {
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

// Error handling types
export interface AppError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
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
  | 'UNKNOWN_ERROR';

// Application state types
export interface AppState {
  currentPhoto: PhotoMetadata | null;
  overlayConfig: OverlayConfig | null;
  frameSettings: FrameSettings | null;
  isPreviewMode: boolean;
  isLoading: boolean;
  error: AppError | null;
  selectedFiles: PhotoMetadata[];
  processingQueue: ProcessingTask[];
}

export interface ProcessingTask {
  id: string;
  photo: PhotoMetadata;
  overlayConfig: OverlayConfig;
  frameSettings?: FrameSettings;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: AppError;
  startTime?: Date;
  endTime?: Date;
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

// Service interfaces
export interface ExifService {
  extractMetadata(file: File): Promise<ExifData>;
  isSupported(mimeType: string): boolean;
}

export interface ImageProcessingService {
  loadImage(file: File): Promise<HTMLImageElement>;
  applyOverlay(
    image: HTMLImageElement,
    overlay: OverlayConfig,
    frame?: FrameSettings
  ): Promise<HTMLCanvasElement>;
  exportImage(
    canvas: HTMLCanvasElement,
    format: 'jpeg' | 'png',
    quality?: number
  ): Promise<Blob>;
}

export interface StorageService {
  saveSettings(settings: UserSettings): Promise<void>;
  loadSettings(): Promise<UserSettings>;
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
  source: 'drop' | 'click' | 'paste';
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

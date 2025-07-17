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
}

export interface ExifData {
  camera?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
  dateTime?: string;
  gps?: {
    latitude: number;
    longitude: number;
  };
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

// Application state types
export interface AppState {
  currentPhoto: PhotoMetadata | null;
  overlayConfig: OverlayConfig | null;
  isPreviewMode: boolean;
  isLoading: boolean;
  error: string | null;
}

// UI component props
export interface PhotoViewerProps {
  photo: PhotoMetadata;
  overlayConfig?: OverlayConfig;
  onPhotoChange: (photo: PhotoMetadata) => void;
}

export interface OverlayEditorProps {
  config: OverlayConfig;
  onChange: (config: OverlayConfig) => void;
}

export interface MetadataDisplayProps {
  metadata: PhotoMetadata;
  config: OverlayConfig;
}

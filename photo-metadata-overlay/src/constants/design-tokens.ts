import { DesignTokens } from '../types/design-system';

// Design tokens constants
export const DESIGN_TOKENS: DesignTokens = {
  colors: {
    primary: '#1890ff',
    secondary: '#52c41a',
    accent: '#722ed1',
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    info: '#1890ff',
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e8e8e8',
      300: '#d9d9d9',
      400: '#bfbfbf',
      500: '#8c8c8c',
      600: '#595959',
      700: '#434343',
      800: '#262626',
      900: '#1f1f1f',
    },
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '96px',
  },
  borderRadius: {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '50%',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
  },
  animations: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

// Predefined overlay templates
export const DEFAULT_OVERLAY_TEMPLATES = [
  {
    id: 'minimal',
    name: 'Minimal',
    layout: 'horizontal' as const,
    background: {
      type: 'solid' as const,
      color: 'rgba(0, 0, 0, 0.7)',
    },
  },
  {
    id: 'detailed',
    name: 'Detailed',
    layout: 'vertical' as const,
    background: {
      type: 'gradient' as const,
      color: 'transparent',
      gradient: {
        from: 'rgba(0, 0, 0, 0.8)',
        to: 'rgba(0, 0, 0, 0.4)',
        direction: 180,
      },
    },
  },
  {
    id: 'grid',
    name: 'Grid Layout',
    layout: 'grid' as const,
    background: {
      type: 'solid' as const,
      color: 'rgba(255, 255, 255, 0.9)',
    },
  },
] as const;

// Default frame styles
export const DEFAULT_FRAME_STYLES = [
  {
    id: 'simple',
    name: 'Simple Border',
    type: 'simple' as const,
    color: '#ffffff',
    width: 20,
    opacity: 1,
  },
  {
    id: 'shadow',
    name: 'Drop Shadow',
    type: 'shadow' as const,
    color: '#ffffff',
    width: 30,
    opacity: 1,
    shadow: {
      enabled: true,
      color: 'rgba(0, 0, 0, 0.3)',
      blur: 20,
      offsetX: 0,
      offsetY: 10,
      opacity: 0.3,
    },
  },
  {
    id: 'film',
    name: 'Film Strip',
    type: 'film' as const,
    color: '#2c2c2c',
    width: 40,
    opacity: 1,
  },
  {
    id: 'polaroid',
    name: 'Polaroid',
    type: 'polaroid' as const,
    color: '#f8f8f8',
    width: 50,
    opacity: 1,
    borderRadius: 8,
  },
  {
    id: 'vintage',
    name: 'Vintage',
    type: 'vintage' as const,
    color: '#d4af37',
    width: 25,
    opacity: 0.9,
    borderRadius: 4,
  },
] as const;

// Supported file formats
export const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/tiff',
  'image/bmp',
] as const;

export const SUPPORTED_FILE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.tiff',
  '.tif',
  '.bmp',
] as const;

// Export formats
export const EXPORT_FORMATS = [
  { value: 'jpeg', label: 'JPEG', extension: '.jpg' },
  { value: 'png', label: 'PNG', extension: '.png' },
] as const;

// Quality presets
export const QUALITY_PRESETS = [
  { value: 0.6, label: 'Low (60%)' },
  { value: 0.8, label: 'Medium (80%)' },
  { value: 0.9, label: 'High (90%)' },
  { value: 1.0, label: 'Maximum (100%)' },
] as const;

// Common camera brands for logo display
export const CAMERA_BRANDS = [
  'Canon',
  'Nikon',
  'Sony',
  'Fujifilm',
  'Olympus',
  'Panasonic',
  'Leica',
  'Pentax',
  'Hasselblad',
  'Phase One',
] as const;

// Default keyboard shortcuts
export const DEFAULT_SHORTCUTS = {
  openFile: 'Ctrl+O',
  exportImage: 'Ctrl+E',
  togglePreview: 'Space',
  undo: 'Ctrl+Z',
  redo: 'Ctrl+Y',
  save: 'Ctrl+S',
} as const;

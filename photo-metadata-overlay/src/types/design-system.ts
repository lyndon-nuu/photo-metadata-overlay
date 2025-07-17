// Design system types and constants

// Color palette
export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  neutral: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
}

// Typography
export interface Typography {
  fontFamily: {
    sans: string[];
    mono: string[];
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

// Spacing system
export interface Spacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
}

// Border radius
export interface BorderRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

// Shadows
export interface Shadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  inner: string;
}

// Animation durations
export interface AnimationDurations {
  fast: number;
  normal: number;
  slow: number;
}

// Breakpoints
export interface Breakpoints {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

// Design tokens interface
export interface DesignTokens {
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
  animations: AnimationDurations;
  breakpoints: Breakpoints;
}

// Component variants
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type InputVariant = 'default' | 'filled' | 'outline';
export type InputSize = 'sm' | 'md' | 'lg';

export type CardVariant = 'default' | 'elevated' | 'outlined';

// Theme types
export type ThemeMode = 'light' | 'dark' | 'auto';

export interface Theme {
  mode: ThemeMode;
  tokens: DesignTokens;
}

// Component state types
export type ComponentState =
  | 'default'
  | 'hover'
  | 'active'
  | 'focus'
  | 'disabled';

// Layout types
export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type JustifyContent =
  | 'start'
  | 'end'
  | 'center'
  | 'between'
  | 'around'
  | 'evenly';
export type AlignItems = 'start' | 'end' | 'center' | 'baseline' | 'stretch';

export interface FlexProps {
  direction?: FlexDirection;
  justify?: JustifyContent;
  align?: AlignItems;
  wrap?: boolean;
  gap?: keyof Spacing;
}

// Grid types
export interface GridProps {
  columns?: number;
  rows?: number;
  gap?: keyof Spacing;
  columnGap?: keyof Spacing;
  rowGap?: keyof Spacing;
}

// Responsive types
export type ResponsiveValue<T> =
  | T
  | {
      sm?: T;
      md?: T;
      lg?: T;
      xl?: T;
      '2xl'?: T;
    };

// Icon types
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconVariant = 'outline' | 'filled' | 'duotone';

export interface IconProps {
  size?: IconSize;
  variant?: IconVariant;
  color?: string;
  className?: string;
}

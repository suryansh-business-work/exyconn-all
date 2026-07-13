export interface LogoSettings {
  scale: number;
  rotation: number;
  x: number;
  y: number;
  backgroundColor: string;
  transparent: boolean;
  borderRadius: number;
  boxShadow: number; // Box shadow blur radius (0 = no shadow)
  padding: number; // Padding percentage (0-50)
  brightness: number; // Image brightness (0-200, default 100)
  contrast: number; // Image contrast (0-200, default 100)
  grayscale: number; // Grayscale percentage (0-100, default 0)
}

export interface CanvasSize {
  width: number;
  height: number;
  label: string;
  category: 'favicon' | 'icon' | 'logo' | 'splash';
}

export interface CustomSize {
  id: string;
  width: number;
  height: number;
  label: string;
}

export type ExportFormat = 'png' | 'jpg' | 'webp' | 'ico';
export type ApplyScope =
  | 'all'
  | 'favicon'
  | 'favicon-all'
  | 'icon'
  | 'icon-all'
  | 'logo'
  | 'logo-all'
  | 'splash'
  | 'splash-all'
  | 'custom'
  | 'custom-all'
  | string;

export interface ScopeOption {
  value: string;
  label: string;
  emoji: string;
  group?: string;
  indent?: boolean;
}

export const SCOPE_OPTIONS: ScopeOption[] = [
  { value: 'all', label: 'All Sizes', emoji: '🎯' },
  { value: 'favicon-all', label: 'All Favicons', emoji: '📌', group: 'Favicons' },
  { value: 'favicon-16', label: '16×16', emoji: '  ', indent: true },
  { value: 'favicon-32', label: '32×32', emoji: '  ', indent: true },
  { value: 'favicon-48', label: '48×48', emoji: '  ', indent: true },
  { value: 'icon-all', label: 'All Icons', emoji: '🎨', group: 'Icons' },
  { value: 'icon-48', label: '48×48', emoji: '  ', indent: true },
  { value: 'icon-64', label: '64×64', emoji: '  ', indent: true },
  { value: 'icon-72', label: '72×72', emoji: '  ', indent: true },
  { value: 'icon-96', label: '96×96', emoji: '  ', indent: true },
  { value: 'icon-128', label: '128×128', emoji: '  ', indent: true },
  { value: 'icon-144', label: '144×144', emoji: '  ', indent: true },
  { value: 'icon-152', label: '152×152', emoji: '  ', indent: true },
  { value: 'icon-192', label: '192×192', emoji: '  ', indent: true },
  { value: 'icon-256', label: '256×256', emoji: '  ', indent: true },
  { value: 'icon-384', label: '384×384', emoji: '  ', indent: true },
  { value: 'icon-512', label: '512×512', emoji: '  ', indent: true },
  { value: 'icon-1024', label: '1024×1024', emoji: '  ', indent: true },
  { value: 'icon-2048', label: '2048×2048', emoji: '  ', indent: true },
  { value: 'logo-all', label: 'All Logos', emoji: '📐', group: 'Logos' },
  { value: 'logo-128', label: '128×128', emoji: '  ', indent: true },
  { value: 'logo-256', label: '256×256', emoji: '  ', indent: true },
  { value: 'logo-512', label: '512×512', emoji: '  ', indent: true },
  { value: 'logo-1024', label: '1024×1024', emoji: '  ', indent: true },
  { value: 'logo-2048', label: '2048×2048', emoji: '  ', indent: true },
  { value: 'logo-4096', label: '4096×4096', emoji: '  ', indent: true },
  { value: 'splash-all', label: 'All Splash Screens', emoji: '📱', group: 'Splash Screens' },
  // Android Splash
  { value: 'splash-480x800', label: '480×800 (Android mdpi)', emoji: '  ', indent: true },
  { value: 'splash-720x1280', label: '720×1280 (Android hdpi)', emoji: '  ', indent: true },
  { value: 'splash-1080x1920', label: '1080×1920 (Android xhdpi)', emoji: '  ', indent: true },
  { value: 'splash-1440x2560', label: '1440×2560 (Android xxhdpi)', emoji: '  ', indent: true },
  { value: 'splash-2160x3840', label: '2160×3840 (Android xxxhdpi)', emoji: '  ', indent: true },
  // iOS Splash
  { value: 'splash-640x1136', label: '640×1136 (iPhone SE)', emoji: '  ', indent: true },
  { value: 'splash-750x1334', label: '750×1334 (iPhone 8)', emoji: '  ', indent: true },
  { value: 'splash-1125x2436', label: '1125×2436 (iPhone X/XS)', emoji: '  ', indent: true },
  { value: 'splash-1242x2688', label: '1242×2688 (iPhone XS Max)', emoji: '  ', indent: true },
  { value: 'splash-1170x2532', label: '1170×2532 (iPhone 12/13)', emoji: '  ', indent: true },
  { value: 'splash-1284x2778', label: '1284×2778 (iPhone 12/13 Pro Max)', emoji: '  ', indent: true },
  { value: 'splash-1290x2796', label: '1290×2796 (iPhone 14 Pro Max)', emoji: '  ', indent: true },
  // iPad/Tablet Splash
  { value: 'splash-1536x2048', label: '1536×2048 (iPad)', emoji: '  ', indent: true },
  { value: 'splash-1668x2224', label: '1668×2224 (iPad Pro 10.5")', emoji: '  ', indent: true },
  { value: 'splash-1668x2388', label: '1668×2388 (iPad Pro 11")', emoji: '  ', indent: true },
  { value: 'splash-2048x2732', label: '2048×2732 (iPad Pro 12.9")', emoji: '  ', indent: true },
  // Android Tablet
  { value: 'splash-800x1280', label: '800×1280 (Android Tablet)', emoji: '  ', indent: true },
  { value: 'splash-1200x1920', label: '1200×1920 (Android Tablet HD)', emoji: '  ', indent: true },
  { value: 'splash-1600x2560', label: '1600×2560 (Android Tablet QHD)', emoji: '  ', indent: true },
  { value: 'custom-all', label: 'All Custom Sizes', emoji: '✏️', group: 'Custom' },
];

export const FAVICON_SIZES: CanvasSize[] = [
  { width: 16, height: 16, label: '16×16', category: 'favicon' },
  { width: 32, height: 32, label: '32×32', category: 'favicon' },
  { width: 48, height: 48, label: '48×48', category: 'favicon' },
];

export const ICON_SIZES: CanvasSize[] = [
  { width: 48, height: 48, label: '48×48', category: 'icon' },
  { width: 64, height: 64, label: '64×64', category: 'icon' },
  { width: 72, height: 72, label: '72×72', category: 'icon' },
  { width: 96, height: 96, label: '96×96', category: 'icon' },
  { width: 128, height: 128, label: '128×128', category: 'icon' },
  { width: 144, height: 144, label: '144×144', category: 'icon' },
  { width: 152, height: 152, label: '152×152', category: 'icon' },
  { width: 192, height: 192, label: '192×192', category: 'icon' },
  { width: 256, height: 256, label: '256×256', category: 'icon' },
  { width: 384, height: 384, label: '384×384', category: 'icon' },
  { width: 512, height: 512, label: '512×512', category: 'icon' },
  { width: 1024, height: 1024, label: '1024×1024', category: 'icon' },
  { width: 2048, height: 2048, label: '2048×2048', category: 'icon' },
];

export const LOGO_SIZES: CanvasSize[] = [
  { width: 128, height: 128, label: '128×128', category: 'logo' },
  { width: 256, height: 256, label: '256×256', category: 'logo' },
  { width: 512, height: 512, label: '512×512', category: 'logo' },
  { width: 1024, height: 1024, label: '1024×1024', category: 'logo' },
  { width: 2048, height: 2048, label: '2048×2048', category: 'logo' },
  { width: 4096, height: 4096, label: '4096×4096', category: 'logo' },
];

// Splash Screen Sizes - Android, iOS, and Tablet
export const SPLASH_SIZES: CanvasSize[] = [
  // Android Splash Screens
  { width: 480, height: 800, label: '480×800 (Android mdpi)', category: 'splash' },
  { width: 720, height: 1280, label: '720×1280 (Android hdpi)', category: 'splash' },
  { width: 1080, height: 1920, label: '1080×1920 (Android xhdpi)', category: 'splash' },
  { width: 1440, height: 2560, label: '1440×2560 (Android xxhdpi)', category: 'splash' },
  { width: 2160, height: 3840, label: '2160×3840 (Android xxxhdpi)', category: 'splash' },
  // iOS Splash Screens
  { width: 640, height: 1136, label: '640×1136 (iPhone SE)', category: 'splash' },
  { width: 750, height: 1334, label: '750×1334 (iPhone 8)', category: 'splash' },
  { width: 1125, height: 2436, label: '1125×2436 (iPhone X/XS)', category: 'splash' },
  { width: 1242, height: 2688, label: '1242×2688 (iPhone XS Max)', category: 'splash' },
  { width: 1170, height: 2532, label: '1170×2532 (iPhone 12/13)', category: 'splash' },
  { width: 1284, height: 2778, label: '1284×2778 (iPhone 12/13 Pro Max)', category: 'splash' },
  { width: 1290, height: 2796, label: '1290×2796 (iPhone 14 Pro Max)', category: 'splash' },
  // iPad/Tablet Splash Screens
  { width: 1536, height: 2048, label: '1536×2048 (iPad)', category: 'splash' },
  { width: 1668, height: 2224, label: '1668×2224 (iPad Pro 10.5")', category: 'splash' },
  { width: 1668, height: 2388, label: '1668×2388 (iPad Pro 11")', category: 'splash' },
  { width: 2048, height: 2732, label: '2048×2732 (iPad Pro 12.9")', category: 'splash' },
  // Android Tablet Splash Screens
  { width: 800, height: 1280, label: '800×1280 (Android Tablet)', category: 'splash' },
  { width: 1200, height: 1920, label: '1200×1920 (Android Tablet HD)', category: 'splash' },
  { width: 1600, height: 2560, label: '1600×2560 (Android Tablet QHD)', category: 'splash' },
];

export const ALL_SIZES: CanvasSize[] = [...FAVICON_SIZES, ...ICON_SIZES, ...LOGO_SIZES, ...SPLASH_SIZES];

// Legacy support
export const CANVAS_SIZES = ALL_SIZES;

export const DEFAULT_SETTINGS: LogoSettings = {
  scale: 1,
  rotation: 0,
  x: 0,
  y: 0,
  backgroundColor: '#ffffff',
  transparent: true,
  borderRadius: 0,
  boxShadow: 0,
  padding: 10,
  brightness: 100,
  contrast: 100,
  grayscale: 0,
};

export const DEFAULT_CUSTOM_SIZES: CustomSize[] = [];

// Contrast ratio utilities for accessibility
export const calculateLuminance = (hex: string): number => {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const calculateContrastRatio = (color1: string, color2: string): number => {
  const lum1 = calculateLuminance(color1);
  const lum2 = calculateLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
};

export const getContrastRating = (
  ratio: number
): { rating: string; color: string; passes: { aa: boolean; aaLarge: boolean; aaa: boolean; aaaLarge: boolean } } => {
  const passes = {
    aa: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaa: ratio >= 7,
    aaaLarge: ratio >= 4.5,
  };

  if (ratio >= 7) return { rating: 'Excellent (AAA)', color: '#4caf50', passes };
  if (ratio >= 4.5) return { rating: 'Good (AA)', color: '#8bc34a', passes };
  if (ratio >= 3) return { rating: 'Large Text Only', color: '#ff9800', passes };
  return { rating: 'Poor Contrast', color: '#f44336', passes };
};

// Undo/Redo types
export interface ImageHistoryState {
  image: string;
  timestamp: number;
}

export const MAX_HISTORY_STEPS = 5;

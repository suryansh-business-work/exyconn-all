export type ResizeFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export interface Dimensions {
  width: number;
  height: number;
}

export interface ResizeOptions {
  width: number;
  height: number;
  format: ResizeFormat;
  quality?: number;
}

export interface SizePreset {
  label: string;
  width: number;
  height: number;
}

export const PERCENT_PRESETS = [25, 50, 75];

export const SIZE_PRESETS: SizePreset[] = [
  { label: 'HD 1280×720', width: 1280, height: 720 },
  { label: 'Full HD 1920×1080', width: 1920, height: 1080 },
  { label: 'Square 1080×1080', width: 1080, height: 1080 },
  { label: 'Thumbnail 300×300', width: 300, height: 300 },
];

export const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const EXTENSIONS: Record<ResizeFormat, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const scaleByPercent = (original: Dimensions, percent: number): Dimensions => ({
  width: Math.max(1, Math.round((original.width * percent) / 100)),
  height: Math.max(1, Math.round((original.height * percent) / 100)),
});

export const lockedHeight = (original: Dimensions, width: number): number =>
  Math.max(1, Math.round((width * original.height) / original.width));

export const lockedWidth = (original: Dimensions, height: number): number =>
  Math.max(1, Math.round((height * original.width) / original.height));

export const outputFileName = (name: string, format: ResizeFormat, dims: Dimensions): string => {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  return `${base}-${dims.width}x${dims.height}.${EXTENSIONS[format]}`;
};

export const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read ${file.name}.`));
    };
    img.src = url;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Image encoding failed.'));
    }, type, quality);
  });

export const resizeImage = async (file: File, options: ResizeOptions): Promise<Blob> => {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = options.width;
  canvas.height = options.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');
  if (options.format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, options.width, options.height);
  }
  ctx.drawImage(img, 0, 0, options.width, options.height);
  return canvasToBlob(canvas, options.format, options.quality ?? 0.92);
};

export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

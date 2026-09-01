export interface Adjustments {
  brightness: number;
  contrast: number;
  saturate: number;
  grayscale: number;
  sepia: number;
  hueRotate: number;
  blur: number;
}

export type ExportFormat = 'png' | 'jpeg';

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  grayscale: 0,
  sepia: 0,
  hueRotate: 0,
  blur: 0,
};

export interface SliderConfig {
  key: keyof Adjustments;
  label: string;
  min: number;
  max: number;
  unit: string;
}

/** Slider configuration for each CSS filter adjustment. */
export const SLIDER_CONFIGS: SliderConfig[] = [
  { key: 'brightness', label: 'Brightness', min: 0, max: 200, unit: '%' },
  { key: 'contrast', label: 'Contrast', min: 0, max: 200, unit: '%' },
  { key: 'saturate', label: 'Saturation', min: 0, max: 200, unit: '%' },
  { key: 'grayscale', label: 'Grayscale', min: 0, max: 100, unit: '%' },
  { key: 'sepia', label: 'Sepia', min: 0, max: 100, unit: '%' },
  { key: 'hueRotate', label: 'Hue Rotate', min: -180, max: 180, unit: 'deg' },
  { key: 'blur', label: 'Blur', min: 0, max: 20, unit: 'px' },
];

/** Build the CSS/canvas filter string for the given adjustments. */
export const buildFilter = (a: Adjustments): string =>
  `brightness(${a.brightness}%) contrast(${a.contrast}%) saturate(${a.saturate}%) ` +
  `grayscale(${a.grayscale}%) sepia(${a.sepia}%) hue-rotate(${a.hueRotate}deg) blur(${a.blur}px)`;

export const isDefault = (a: Adjustments): boolean =>
  (Object.keys(DEFAULT_ADJUSTMENTS) as (keyof Adjustments)[]).every((k) => a[k] === DEFAULT_ADJUSTMENTS[k]);

export const editedFileName = (original: string, format: ExportFormat): string => {
  const base = original.replace(/\.[^.]+$/, '') || 'image';
  const ext = format === 'jpeg' ? 'jpg' : 'png';
  return `edited-${base}.${ext}`;
};

export const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image.'));
    img.src = src;
  });

/** Draw the image onto the canvas with the filter applied. `background` fills first (for JPG). */
export const drawFiltered = (image: HTMLImageElement, canvas: HTMLCanvasElement, filter: string, background?: string): void => {
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.filter = filter;
  ctx.drawImage(image, 0, 0);
};

export const canvasToBlob = (canvas: HTMLCanvasElement, mime: string): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to export image.'));
      },
      mime,
      0.92,
    );
  });

export const exportImage = async (src: string, adjustments: Adjustments, format: ExportFormat): Promise<Blob> => {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');
  const background = format === 'jpeg' ? '#ffffff' : undefined;
  drawFiltered(image, canvas, buildFilter(adjustments), background);
  return canvasToBlob(canvas, `image/${format}`);
};

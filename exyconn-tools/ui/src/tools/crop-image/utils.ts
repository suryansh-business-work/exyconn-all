import type { Area } from 'react-easy-crop';

export interface AspectPreset {
  label: string;
  value?: number;
}

/** Aspect-ratio presets for the crop box. `value` omitted = free (image's own ratio). */
export const ASPECT_PRESETS: AspectPreset[] = [
  { label: 'Free' },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '3:4', value: 3 / 4 },
  { label: '9:16', value: 9 / 16 },
];

/** Canvas can only encode png/jpeg/webp — anything else (gif, svg…) exports as png. */
export const outputMime = (inputMime: string): string => {
  const supported = new Set(['image/png', 'image/jpeg', 'image/webp']);
  return supported.has(inputMime) ? inputMime : 'image/png';
};

export const mimeToExt = (mime: string): string => {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
};

export const cropFileName = (original: string, mime: string): string => {
  const base = original.replace(/\.[^.]+$/, '') || 'image';
  return `cropped-${base}.${mimeToExt(mime)}`;
};

/** Keep the crop area inside the image bounds and round to whole pixels. */
export const clampCropArea = (area: Area, imageWidth: number, imageHeight: number): Area => {
  const x = Math.max(0, Math.min(Math.round(area.x), imageWidth - 1));
  const y = Math.max(0, Math.min(Math.round(area.y), imageHeight - 1));
  const width = Math.max(1, Math.min(Math.round(area.width), imageWidth - x));
  const height = Math.max(1, Math.min(Math.round(area.height), imageHeight - y));
  return { x, y, width, height };
};

export const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image.'));
    img.src = src;
  });

export const drawCroppedImage = (image: CanvasImageSource, area: Area, canvas: HTMLCanvasElement): void => {
  canvas.width = area.width;
  canvas.height = area.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
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

export const getCroppedBlob = async (src: string, area: Area, mime: string): Promise<Blob> => {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');
  drawCroppedImage(image, clampCropArea(area, image.naturalWidth, image.naturalHeight), canvas);
  return canvasToBlob(canvas, mime);
};

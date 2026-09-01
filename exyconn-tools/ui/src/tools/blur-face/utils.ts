export type BlurMode = 'pixelate' | 'blur';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Region extends Rect {
  id: string;
}

export const MIN_REGION_SIZE = 8;

export const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const normalizeRect = (x1: number, y1: number, x2: number, y2: number): Rect => ({
  x: Math.min(x1, x2),
  y: Math.min(y1, y2),
  width: Math.abs(x2 - x1),
  height: Math.abs(y2 - y1),
});

export const clampRegion = (rect: Rect, imageWidth: number, imageHeight: number): Rect | null => {
  const x = Math.max(0, Math.round(rect.x));
  const y = Math.max(0, Math.round(rect.y));
  const width = Math.min(imageWidth, Math.round(rect.x + rect.width)) - x;
  const height = Math.min(imageHeight, Math.round(rect.y + rect.height)) - y;
  if (width < MIN_REGION_SIZE || height < MIN_REGION_SIZE) return null;
  return { x, y, width, height };
};

export interface CanvasSizeLike {
  width: number;
  height: number;
  getBoundingClientRect: () => { left: number; top: number; width: number; height: number };
}

export const canvasPoint = (canvas: CanvasSizeLike, clientX: number, clientY: number): { x: number; y: number } => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
  const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
  return {
    x: Math.min(canvas.width, Math.max(0, (clientX - rect.left) * scaleX)),
    y: Math.min(canvas.height, Math.max(0, (clientY - rect.top) * scaleY)),
  };
};

export const pixelSizeForIntensity = (intensity: number): number =>
  Math.min(64, Math.max(2, Math.round(intensity)));

export const blurRadiusForIntensity = (intensity: number): number =>
  Math.min(32, Math.max(1, Math.round(intensity / 2)));

const blurPass = (
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
  horizontal: boolean,
): void => {
  const count = radius * 2 + 1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let d = -radius; d <= radius; d++) {
        const sx = horizontal ? Math.min(width - 1, Math.max(0, x + d)) : x;
        const sy = horizontal ? y : Math.min(height - 1, Math.max(0, y + d));
        const i = (sy * width + sx) * 4;
        r += src[i];
        g += src[i + 1];
        b += src[i + 2];
        a += src[i + 3];
      }
      const o = (y * width + x) * 4;
      dst[o] = r / count;
      dst[o + 1] = g / count;
      dst[o + 2] = b / count;
      dst[o + 3] = a / count;
    }
  }
};

export const boxBlurImageData = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number,
): Uint8ClampedArray => {
  const result = new Uint8ClampedArray(data);
  if (radius < 1 || width < 1 || height < 1) return result;
  const temp = new Uint8ClampedArray(data.length);
  blurPass(result, temp, width, height, radius, true);
  blurPass(temp, result, width, height, radius, false);
  return result;
};

const pixelateRegion = (ctx: CanvasRenderingContext2D, region: Rect, pixelSize: number): void => {
  const cols = Math.max(1, Math.ceil(region.width / pixelSize));
  const rows = Math.max(1, Math.ceil(region.height / pixelSize));
  const temp = document.createElement('canvas');
  temp.width = cols;
  temp.height = rows;
  const tempCtx = temp.getContext('2d');
  if (!tempCtx) throw new Error('Canvas is not supported in this browser.');
  tempCtx.imageSmoothingEnabled = false;
  tempCtx.drawImage(ctx.canvas, region.x, region.y, region.width, region.height, 0, 0, cols, rows);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(temp, 0, 0, cols, rows, region.x, region.y, region.width, region.height);
  ctx.imageSmoothingEnabled = true;
};

const blurRegion = (ctx: CanvasRenderingContext2D, region: Rect, radius: number): void => {
  const imageData = ctx.getImageData(region.x, region.y, region.width, region.height);
  const blurred = boxBlurImageData(imageData.data, region.width, region.height, radius);
  imageData.data.set(blurred);
  ctx.putImageData(imageData, region.x, region.y);
};

export const applyRegionEffect = (
  ctx: CanvasRenderingContext2D,
  region: Rect,
  mode: BlurMode,
  intensity: number,
): void => {
  if (mode === 'pixelate') {
    pixelateRegion(ctx, region, pixelSizeForIntensity(intensity));
  } else {
    blurRegion(ctx, region, blurRadiusForIntensity(intensity));
  }
};

export const renderRedacted = (
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  regions: readonly Rect[],
  mode: BlurMode,
  intensity: number,
): CanvasRenderingContext2D => {
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');
  ctx.drawImage(image, 0, 0);
  for (const region of regions) applyRegionEffect(ctx, region, mode, intensity);
  return ctx;
};

export const drawRegionOutlines = (
  ctx: CanvasRenderingContext2D,
  regions: readonly Rect[],
  draft: Rect | null,
  color: string,
): void => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, Math.round(ctx.canvas.width / 400));
  for (const region of regions) ctx.strokeRect(region.x, region.y, region.width, region.height);
  if (draft) {
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(draft.x, draft.y, draft.width, draft.height);
  }
  ctx.restore();
};

export const outputFileName = (name: string): string => {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  return `${base}-blurred.png`;
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

export const downloadCanvas = (canvas: HTMLCanvasElement, fileName: string): Promise<void> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Image encoding failed.'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    }, 'image/png');
  });

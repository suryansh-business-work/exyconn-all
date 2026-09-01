export type WatermarkPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export type WatermarkMode = 'text' | 'image';

/** The 9-position placement grid, in visual (row-major) order. */
export const POSITIONS: { id: WatermarkPosition; label: string }[] = [
  { id: 'top-left', label: 'Top left' },
  { id: 'top-center', label: 'Top center' },
  { id: 'top-right', label: 'Top right' },
  { id: 'middle-left', label: 'Middle left' },
  { id: 'middle-center', label: 'Center' },
  { id: 'middle-right', label: 'Middle right' },
  { id: 'bottom-left', label: 'Bottom left' },
  { id: 'bottom-center', label: 'Bottom center' },
  { id: 'bottom-right', label: 'Bottom right' },
];

export interface TextWatermarkOptions {
  text: string;
  fontSize: number;
  color: string;
  opacity: number;
  position: WatermarkPosition;
  tile: boolean;
}

export interface ImageWatermarkOptions {
  /** Watermark width as a percentage of the base image width. */
  scale: number;
  opacity: number;
  position: WatermarkPosition;
}

export const MARGIN = 16;

/** Top-left coordinates that place an item of itemW×itemH at `position` inside canvasW×canvasH. */
export const anchorPoint = (
  position: WatermarkPosition,
  canvasW: number,
  canvasH: number,
  itemW: number,
  itemH: number,
): { x: number; y: number } => {
  const [row, col] = position.split('-');
  let x = MARGIN;
  if (col === 'center') x = (canvasW - itemW) / 2;
  if (col === 'right') x = canvasW - itemW - MARGIN;
  let y = MARGIN;
  if (row === 'middle') y = (canvasH - itemH) / 2;
  if (row === 'bottom') y = canvasH - itemH - MARGIN;
  return { x, y };
};

/** Grid of origins that tiles an area of canvasW×canvasH with the given steps. */
export const tileOrigins = (canvasW: number, canvasH: number, stepX: number, stepY: number): { x: number; y: number }[] => {
  const points: { x: number; y: number }[] = [];
  for (let y = 0; y < canvasH; y += stepY) {
    for (let x = 0; x < canvasW; x += stepX) {
      points.push({ x, y });
    }
  }
  return points;
};

export const drawTextWatermark = (ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number, opts: TextWatermarkOptions): void => {
  ctx.save();
  ctx.globalAlpha = opts.opacity;
  ctx.fillStyle = opts.color;
  ctx.font = `${opts.fontSize}px sans-serif`;
  ctx.textBaseline = 'top';
  const textW = ctx.measureText(opts.text).width;
  if (opts.tile) {
    tileOrigins(canvasW, canvasH, textW + opts.fontSize * 2, opts.fontSize * 3).forEach((p) => ctx.fillText(opts.text, p.x, p.y));
  } else {
    const { x, y } = anchorPoint(opts.position, canvasW, canvasH, textW, opts.fontSize);
    ctx.fillText(opts.text, x, y);
  }
  ctx.restore();
};

export const drawImageWatermark = (
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  watermark: HTMLImageElement,
  opts: ImageWatermarkOptions,
): void => {
  const width = (canvasW * opts.scale) / 100;
  const height = width * (watermark.naturalHeight / watermark.naturalWidth);
  const { x, y } = anchorPoint(opts.position, canvasW, canvasH, width, height);
  ctx.save();
  ctx.globalAlpha = opts.opacity;
  ctx.drawImage(watermark, x, y, width, height);
  ctx.restore();
};

export const watermarkedFileName = (original: string): string => {
  const base = original.replace(/\.[^.]+$/, '') || 'image';
  return `watermarked-${base}.png`;
};

export const loadImageFromFile = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image.'));
    };
    img.src = url;
  });

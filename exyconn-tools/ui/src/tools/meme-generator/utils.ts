export interface MemeOptions {
  topText: string;
  bottomText: string;
  uppercase: boolean;
  /** Distance of the top caption from the top edge, as % of image height (0–30). */
  topPadding: number;
  /** Distance of the bottom caption from the bottom edge, as % of image height (0–30). */
  bottomPadding: number;
}

export const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']);

export const MIN_FONT_SIZE = 12;

export const prepareCaption = (text: string, uppercase: boolean): string =>
  (uppercase ? text.toUpperCase() : text).trim();

export const memeFont = (size: number): string => `bold ${size}px Impact, "Arial Black", sans-serif`;

export const memeFileName = (name: string): string => {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  return `${base}-meme.png`;
};

/**
 * Shrinks the font size until the measured text fits maxWidth (or minSize is
 * reached). `measure` returns the rendered width of `text` at a font size.
 */
export const fitFontSize = (
  measure: (text: string, fontSize: number) => number,
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize: number = MIN_FONT_SIZE,
): number => {
  let size = maxSize;
  while (size > minSize && measure(text, size) > maxWidth) size -= 2;
  return Math.max(size, minSize);
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

const drawCaption = (
  ctx: CanvasRenderingContext2D,
  text: string,
  canvasWidth: number,
  y: number,
  baseline: CanvasTextBaseline,
): void => {
  const maxWidth = canvasWidth * 0.9;
  const measure = (t: string, fontSize: number): number => {
    ctx.font = memeFont(fontSize);
    return ctx.measureText(t).width;
  };
  const size = fitFontSize(measure, text, maxWidth, Math.max(MIN_FONT_SIZE, Math.floor(canvasWidth / 8)));
  ctx.font = memeFont(size);
  ctx.textAlign = 'center';
  ctx.textBaseline = baseline;
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, Math.floor(size / 12));
  ctx.strokeStyle = '#000000';
  ctx.fillStyle = '#ffffff';
  ctx.strokeText(text, canvasWidth / 2, y);
  ctx.fillText(text, canvasWidth / 2, y);
};

export const drawMeme = (canvas: HTMLCanvasElement, img: HTMLImageElement, options: MemeOptions): void => {
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser.');
  ctx.drawImage(img, 0, 0, width, height);
  const top = prepareCaption(options.topText, options.uppercase);
  const bottom = prepareCaption(options.bottomText, options.uppercase);
  if (top) drawCaption(ctx, top, width, (height * options.topPadding) / 100, 'top');
  if (bottom) drawCaption(ctx, bottom, width, height - (height * options.bottomPadding) / 100, 'bottom');
};

export const canvasToPngBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Image encoding failed.'));
    }, 'image/png');
  });

export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

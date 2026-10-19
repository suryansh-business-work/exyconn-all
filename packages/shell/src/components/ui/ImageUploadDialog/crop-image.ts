/**
 * What shows where the crop frame reaches past the image (after zooming out): nothing
 * (a transparent PNG), the same photo blurred to cover the frame, or a flat colour.
 */
export type CropFill = { kind: 'none' } | { kind: 'blur' } | { kind: 'color'; color: string };

/**
 * A crop rectangle in the source image's own pixels, as react-easy-crop reports it. Zoomed
 * out, it can start before the image (negative x/y) and be larger than it; `fill` then says
 * what paints the space around it. Absent, that space stays transparent.
 */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: CropFill;
}

/**
 * Loads an image for the canvas. `crossOrigin` is what lets a Pexels photo be cropped in
 * the browser at all — their CDN sends `Access-Control-Allow-Origin: *`, so the canvas
 * stays untainted and `toDataURL` works on stock and device files alike.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => reject(new Error('Could not load the image to crop')));
    image.src = src;
  });
}

/** A 2D context for `canvas`, or the error every canvas step reports without one. */
export function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('This browser cannot crop images');
  }
  return context;
}

/** JPEG/WebP quality for the cropped result — visually lossless, but keeps the upload small. */
const QUALITY = 0.92;

/**
 * The longest side the result may have. Zooming a large photo right out makes a frame many
 * times its size; past this, browsers refuse the canvas and the upload would be huge anyway.
 */
export const MAX_OUTPUT_EDGE = 4096;

/** How soft the blurred backdrop is, as a share of the result's longest side. */
const BLUR_SHARE = 0.04;

const NO_FILL: CropFill = { kind: 'none' };

/** Formats that keep their own encoding; anything else is written as JPEG. */
const KEPT_TYPES = new Set(['image/png', 'image/webp']);

/** Whether the rectangle lies wholly on the image, so no backdrop shows anywhere. */
const coversFrame = (rect: CropRect, image: HTMLImageElement): boolean =>
  rect.x >= 0 &&
  rect.y >= 0 &&
  rect.x + rect.width <= image.naturalWidth &&
  rect.y + rect.height <= image.naturalHeight;

/** Paints the backdrop: a flat colour, or the image itself scaled to cover and blurred. */
function paintFill(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  fill: CropFill,
  width: number,
  height: number,
): void {
  if (fill.kind === 'color') {
    context.fillStyle = fill.color;
    context.fillRect(0, 0, width, height);
    return;
  }
  if (fill.kind === 'blur') {
    const radius = Math.max(width, height) * BLUR_SHARE;
    // Over-scaled by the blur radius on every side, so the soft edge falls outside the canvas.
    const scale = Math.max(
      (width + radius * 2) / image.naturalWidth,
      (height + radius * 2) / image.naturalHeight,
    );
    const coverWidth = image.naturalWidth * scale;
    const coverHeight = image.naturalHeight * scale;
    context.filter = `blur(${radius}px)`;
    context.drawImage(
      image,
      (width - coverWidth) / 2,
      (height - coverHeight) / 2,
      coverWidth,
      coverHeight,
    );
    context.filter = 'none';
  }
}

/** PNG when transparency shows; otherwise PNG/WebP stay as they are and the rest is JPEG. */
function outputType(mimeType: string, transparent: boolean): string {
  if (transparent) {
    return 'image/png';
  }
  return KEPT_TYPES.has(mimeType) ? mimeType : 'image/jpeg';
}

/**
 * Cuts `rect` out of `src` and returns the result as a data URL ready for the upload
 * mutation. Where the rectangle reaches past the image, `rect.fill` paints the backdrop
 * first; the image is then drawn at its offset and scale, so it can sit anywhere inside.
 */
export async function cropImageToDataUrl(
  src: string,
  rect: CropRect,
  mimeType: string,
): Promise<string> {
  const image = await loadImage(src);
  const scale = Math.min(1, MAX_OUTPUT_EDGE / Math.max(rect.width, rect.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(rect.width * scale);
  canvas.height = Math.round(rect.height * scale);
  const context = context2d(canvas);

  // A backdrop only matters where the frame reaches past the image.
  const backdrop = coversFrame(rect, image) ? null : (rect.fill ?? NO_FILL);
  if (backdrop) {
    paintFill(context, image, backdrop, canvas.width, canvas.height);
  }
  context.drawImage(
    image,
    -rect.x * scale,
    -rect.y * scale,
    image.naturalWidth * scale,
    image.naturalHeight * scale,
  );

  return canvas.toDataURL(outputType(mimeType, backdrop?.kind === 'none'), QUALITY);
}

/** A crop rectangle in the source image's own pixels, as react-easy-crop reports it. */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Loads an image for the canvas. `crossOrigin` is what lets a Pexels photo be cropped in
 * the browser at all — their CDN sends `Access-Control-Allow-Origin: *`, so the canvas
 * stays untainted and `toDataURL` works on stock and device files alike.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => reject(new Error('Could not load the image to crop')));
    image.src = src;
  });
}

/** JPEG quality for the cropped result — visually lossless, but keeps the upload small. */
const JPEG_QUALITY = 0.92;

/**
 * Cuts `rect` out of `src` and returns the result as a data URL ready for the upload
 * mutation. PNG sources keep their transparency; everything else is written as JPEG.
 */
export async function cropImageToDataUrl(
  src: string,
  rect: CropRect,
  mimeType: string,
): Promise<string> {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(rect.width);
  canvas.height = Math.round(rect.height);

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('This browser cannot crop images');
  }
  context.drawImage(
    image,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const outputType = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
  return canvas.toDataURL(outputType, JPEG_QUALITY);
}

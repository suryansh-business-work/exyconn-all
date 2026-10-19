import { color } from '@exyconn/ui';
import type { CropFill } from './crop-image';

/** Crop shapes offered above the canvas. `null` keeps the image's own aspect ratio. */
export const ASPECT_OPTIONS = [
  { value: 'original', label: 'Original', ratio: null },
  { value: 'square', label: '1:1', ratio: 1 },
  { value: 'landscape', label: '16:9', ratio: 16 / 9 },
  { value: 'classic', label: '4:3', ratio: 4 / 3 },
  { value: 'portrait', label: '3:4', ratio: 3 / 4 },
  { value: 'story', label: '9:16', ratio: 9 / 16 },
] as const;

export type AspectKey = (typeof ASPECT_OPTIONS)[number]['value'];

const RATIO_BY_SHAPE = new Map<AspectKey, number | null>(
  ASPECT_OPTIONS.map((option) => [option.value, option.ratio]),
);

/** The frame's ratio for a shape; `undefined` for "Original" (the image's own). */
export const ratioOf = (shape: AspectKey): number | undefined =>
  RATIO_BY_SHAPE.get(shape) ?? undefined;

/** Below 1 the image shrinks inside the frame, leaving room for a background around it. */
export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 3;
/** One slider notch, and one press of the − / + buttons. */
export const ZOOM_STEP = 0.05;
export const ZOOM_BUTTON_STEP = 0.1;

export const clampZoom = (zoom: number): number => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

/** "Fit" shows the whole image inside the frame, with a margin; "Fill" covers the frame. */
export type FitMode = 'fit' | 'fill';

/** "Fit" leaves this share of the frame around the image, so a logo never touches the edge. */
const FIT_MARGIN = 0.9;

/**
 * The zoom for a fit mode. At zoom 1 react-easy-crop's frame is the largest one the image
 * covers, so "Fill" is 1 and "Fit" is the ratio between the two shapes (whichever is below
 * 1), less a small margin.
 */
export function zoomFor(mode: FitMode, imageAspect: number, frameAspect: number): number {
  if (mode === 'fill') {
    return 1;
  }
  return clampZoom(Math.min(imageAspect / frameAspect, frameAspect / imageAspect) * FIT_MARGIN);
}

export type BackgroundMode = 'auto' | 'blur' | 'color' | 'transparent';

/** How the crop step starts for one caller. Each is optional; the defaults suit photos. */
export interface CropOptions {
  /** The shape picked first. Default "original". */
  aspect?: AspectKey;
  /** Starts fitted (whole image, with space around it) or filled. Default "fill". */
  fit?: FitMode;
  /** The background behind a zoomed-out image. Default "blur". */
  background?: BackgroundMode;
  /** Offers a transparent background (exported as PNG). Default true. */
  allowTransparent?: boolean;
}

/** The swatch a fresh "Colour" background starts on, and the stand-in for no transparency. */
export const DEFAULT_COLOR = color.white;

/** Turns the picker's choice into what the canvas paints. */
export function resolveFill(
  mode: BackgroundMode,
  picked: string,
  autoColor: string | null,
  allowTransparent: boolean,
): CropFill {
  if (mode === 'blur') {
    return { kind: 'blur' };
  }
  const flat = mode === 'auto' ? autoColor : picked;
  if (mode !== 'transparent' && flat) {
    return { kind: 'color', color: flat };
  }
  return allowTransparent ? { kind: 'none' } : { kind: 'color', color: DEFAULT_COLOR };
}

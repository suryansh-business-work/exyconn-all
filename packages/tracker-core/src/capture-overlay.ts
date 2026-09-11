import type { WebcamCorner } from './types';

/**
 * How wide the webcam photo is drawn, as a share of the screenshot's width. Big enough to
 * recognise a face on a 1280px shot, small enough that it never covers the work it sits on.
 */
const OVERLAY_WIDTH_RATIO = 0.22;

/** Gap between the photo and the edges of the screenshot, as a share of its width. */
const MARGIN_RATIO = 0.015;

/** Fallback shape when a camera does not report usable dimensions. */
const DEFAULT_ASPECT = 4 / 3;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Where the webcam photo goes on a screenshot of this size.
 *
 * Pure geometry, kept out of the drawing code so the one thing an admin actually chose — the
 * corner — can be tested without a camera, a canvas or a screen.
 */
export function overlayRect(
  corner: WebcamCorner,
  canvas: { width: number; height: number },
  aspectRatio: number,
): Rect {
  const usableAspect = aspectRatio > 0 ? aspectRatio : DEFAULT_ASPECT;
  const width = Math.round(canvas.width * OVERLAY_WIDTH_RATIO);
  const height = Math.round(width / usableAspect);
  const margin = Math.round(canvas.width * MARGIN_RATIO);

  const left = corner === 'top-left' || corner === 'bottom-left';
  const top = corner === 'top-left' || corner === 'top-right';

  return {
    x: left ? margin : canvas.width - width - margin,
    y: top ? margin : canvas.height - height - margin,
    width,
    height,
  };
}

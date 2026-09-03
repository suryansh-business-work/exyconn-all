import { describe, it, expect } from 'vitest';
import { overlayRect } from './webcam';

const CANVAS = { width: 1000, height: 600 };
/** A 4:3 webcam: 220px wide at 22% of a 1000px shot, so 165px tall. */
const ASPECT = 4 / 3;

describe('overlayRect', () => {
  it('sizes the photo as a share of the screenshot, keeping the camera aspect', () => {
    const rect = overlayRect('top-left', CANVAS, ASPECT);
    expect(rect.width).toBe(220);
    expect(rect.height).toBe(165);
  });

  it('places the photo in each corner the portal offers', () => {
    const margin = 15;
    expect(overlayRect('top-left', CANVAS, ASPECT)).toMatchObject({ x: margin, y: margin });
    expect(overlayRect('top-right', CANVAS, ASPECT)).toMatchObject({ x: 765, y: margin });
    expect(overlayRect('bottom-left', CANVAS, ASPECT)).toMatchObject({ x: margin, y: 420 });
    expect(overlayRect('bottom-right', CANVAS, ASPECT)).toMatchObject({ x: 765, y: 420 });
  });

  it('keeps the photo fully inside the screenshot', () => {
    for (const corner of ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const) {
      const rect = overlayRect(corner, CANVAS, ASPECT);
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(CANVAS.width);
      expect(rect.y + rect.height).toBeLessThanOrEqual(CANVAS.height);
    }
  });

  it('falls back to 4:3 when a camera reports no usable dimensions', () => {
    // videoWidth/videoHeight are 0 until a frame arrives, and 0/0 is NaN.
    expect(overlayRect('bottom-right', CANVAS, Number.NaN).height).toBe(165);
  });
});

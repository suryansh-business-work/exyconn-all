import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  normalizeRect, clampRegion, canvasPoint, pixelSizeForIntensity, blurRadiusForIntensity,
  boxBlurImageData, renderRedacted, outputFileName, loadImage, MIN_REGION_SIZE,
} from './utils';
import BlurFace from './index';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () => {
  const React = await import('react');
  return {
    default: ({ children, toolName }: { children?: React.ReactNode; toolName?: string }) =>
      React.createElement('div', null, React.createElement('h1', null, toolName), children),
  };
});

class MockImage {
  naturalWidth = 800;
  naturalHeight = 600;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_value: string) {
    queueMicrotask(() => this.onload?.());
  }
}

beforeAll(() => {
  URL.createObjectURL = vi.fn(() => 'blob:mock') as typeof URL.createObjectURL;
  URL.revokeObjectURL = vi.fn();
  vi.stubGlobal('Image', MockImage);
  HTMLCanvasElement.prototype.getContext = vi.fn(function (this: HTMLCanvasElement) {
    return {
      canvas: this,
      imageSmoothingEnabled: true,
      drawImage: vi.fn(),
      getImageData: vi.fn((_x: number, _y: number, w: number, h: number) => ({
        data: new Uint8ClampedArray(w * h * 4),
        width: w,
        height: h,
      })),
      putImageData: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      strokeRect: vi.fn(),
      setLineDash: vi.fn(),
    };
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

describe('blur-face utils', () => {
  describe('normalizeRect', () => {
    it('keeps a left-to-right drag as-is', () => {
      expect(normalizeRect(10, 20, 40, 60)).toEqual({ x: 10, y: 20, width: 30, height: 40 });
    });
    it('normalizes a right-to-left drag', () => {
      expect(normalizeRect(40, 60, 10, 20)).toEqual({ x: 10, y: 20, width: 30, height: 40 });
    });
    it('normalizes mixed-direction drags', () => {
      expect(normalizeRect(40, 20, 10, 60)).toEqual({ x: 10, y: 20, width: 30, height: 40 });
    });
  });

  describe('clampRegion', () => {
    it('rounds and keeps an in-bounds region', () => {
      expect(clampRegion({ x: 10.4, y: 20.6, width: 30, height: 30 }, 100, 100))
        .toEqual({ x: 10, y: 21, width: 30, height: 30 });
    });
    it('clamps a region that overflows the image', () => {
      expect(clampRegion({ x: -10, y: 80, width: 50, height: 50 }, 100, 100))
        .toEqual({ x: 0, y: 80, width: 40, height: 20 });
    });
    it('rejects regions smaller than the minimum size', () => {
      expect(clampRegion({ x: 10, y: 10, width: MIN_REGION_SIZE - 1, height: 30 }, 100, 100)).toBeNull();
      expect(clampRegion({ x: 10, y: 10, width: 30, height: MIN_REGION_SIZE - 1 }, 100, 100)).toBeNull();
    });
    it('rejects a region fully outside the image', () => {
      expect(clampRegion({ x: 200, y: 200, width: 50, height: 50 }, 100, 100)).toBeNull();
    });
  });

  describe('canvasPoint', () => {
    const canvas = {
      width: 800,
      height: 600,
      getBoundingClientRect: () => ({ left: 100, top: 50, width: 400, height: 300 }),
    };
    it('scales client coordinates to canvas pixels', () => {
      expect(canvasPoint(canvas, 300, 200)).toEqual({ x: 400, y: 300 });
    });
    it('clamps points outside the canvas', () => {
      expect(canvasPoint(canvas, 0, 0)).toEqual({ x: 0, y: 0 });
      expect(canvasPoint(canvas, 9999, 9999)).toEqual({ x: 800, y: 600 });
    });
  });

  describe('intensity mapping', () => {
    it('clamps the pixel size between 2 and 64', () => {
      expect(pixelSizeForIntensity(0)).toBe(2);
      expect(pixelSizeForIntensity(16)).toBe(16);
      expect(pixelSizeForIntensity(500)).toBe(64);
    });
    it('clamps the blur radius between 1 and 32', () => {
      expect(blurRadiusForIntensity(0)).toBe(1);
      expect(blurRadiusForIntensity(16)).toBe(8);
      expect(blurRadiusForIntensity(500)).toBe(32);
    });
  });

  describe('boxBlurImageData', () => {
    it('returns an untouched copy for radius 0', () => {
      const data = new Uint8ClampedArray([1, 2, 3, 4, 5, 6, 7, 8]);
      const out = boxBlurImageData(data, 2, 1, 0);
      expect(out).toEqual(data);
      expect(out).not.toBe(data);
    });
    it('keeps a uniform image unchanged', () => {
      const data = new Uint8ClampedArray(3 * 3 * 4).fill(120);
      expect(boxBlurImageData(data, 3, 3, 1)).toEqual(data);
    });
    it('averages neighbouring pixels', () => {
      // 3x1 row, red channel 0 / 90 / 0 — radius 1 averages each window to 30.
      const data = new Uint8ClampedArray(3 * 4);
      data[4] = 90;
      const out = boxBlurImageData(data, 3, 1, 1);
      expect(out[0]).toBe(30);
      expect(out[4]).toBe(30);
      expect(out[8]).toBe(30);
    });
  });

  describe('renderRedacted', () => {
    const image = { naturalWidth: 100, naturalHeight: 80 } as HTMLImageElement;
    it('sizes the canvas to the image and draws it', () => {
      const canvas = document.createElement('canvas');
      const ctx = renderRedacted(canvas, image, [], 'pixelate', 16);
      expect(canvas.width).toBe(100);
      expect(canvas.height).toBe(80);
      expect(ctx.drawImage).toHaveBeenCalledWith(image, 0, 0);
    });
    it('pixelates each region through a scaled-down pass', () => {
      const canvas = document.createElement('canvas');
      const ctx = renderRedacted(canvas, image, [{ x: 10, y: 10, width: 32, height: 16 }], 'pixelate', 16);
      // 1 image draw + 1 draw-back per region on the main context.
      expect(vi.mocked(ctx.drawImage).mock.calls).toHaveLength(2);
    });
    it('box-blurs each region via get/putImageData', () => {
      const canvas = document.createElement('canvas');
      const ctx = renderRedacted(canvas, image, [{ x: 10, y: 10, width: 16, height: 16 }], 'blur', 16);
      expect(ctx.getImageData).toHaveBeenCalledWith(10, 10, 16, 16);
      expect(ctx.putImageData).toHaveBeenCalled();
    });
  });

  describe('outputFileName', () => {
    it('appends -blurred and swaps to png', () => {
      expect(outputFileName('photo.jpg')).toBe('photo-blurred.png');
    });
    it('handles names without an extension', () => {
      expect(outputFileName('photo')).toBe('photo-blurred.png');
    });
  });

  describe('loadImage', () => {
    it('resolves with the loaded image', async () => {
      const img = await loadImage(new File(['x'], 'a.png', { type: 'image/png' }));
      expect(img.naturalWidth).toBe(800);
      expect(img.naturalHeight).toBe(600);
    });
  });
});

describe('BlurFace component', () => {
  it('renders the upload zone and options', () => {
    render(<BlurFace />);
    expect(screen.getByText('Blur Face')).toBeInTheDocument();
    expect(screen.getByText('Drag & Drop Image Here')).toBeInTheDocument();
    expect(screen.getByText('Browse Files')).toBeInTheDocument();
    expect(screen.getByText('Pixelate')).toBeInTheDocument();
    expect(screen.getByText('Box Blur')).toBeInTheDocument();
    expect(screen.getByText(/Intensity: 16/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download Blurred Image/ })).toBeDisabled();
    expect(screen.getByText(/selected manually/)).toBeInTheDocument();
    expect(screen.getByText(/processed locally in your browser/)).toBeInTheDocument();
  });
});

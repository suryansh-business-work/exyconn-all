import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import WatermarkImage from './index';
import {
  POSITIONS, MARGIN, anchorPoint, tileOrigins, drawTextWatermark, drawImageWatermark,
  watermarkedFileName, loadImageFromFile, TextWatermarkOptions,
} from './utils';

vi.mock('../../shared/components/ToolLayout/ToolLayout', () => ({
  default: ({ children, toolName }: { children: React.ReactNode; toolName: string }) => (
    <div>
      <h1>{toolName}</h1>
      {children}
    </div>
  ),
}));

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 100;
  naturalHeight = 50;
  set src(value: string) {
    if (value === 'blob:bad') queueMicrotask(() => this.onerror?.());
    else queueMicrotask(() => this.onload?.());
  }
}

const makeCtx = () => ({
  save: vi.fn(),
  restore: vi.fn(),
  fillText: vi.fn(),
  drawImage: vi.fn(),
  measureText: vi.fn(() => ({ width: 120 })),
  globalAlpha: 1,
  fillStyle: '',
  font: '',
  textBaseline: 'alphabetic',
});

beforeEach(() => {
  vi.stubGlobal('Image', MockImage);
  URL.createObjectURL = vi.fn(() => 'blob:mock');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const textOpts = (over: Partial<TextWatermarkOptions> = {}): TextWatermarkOptions => ({
  text: 'demo', fontSize: 20, color: '#ff0000', opacity: 0.4, position: 'bottom-right', tile: false, ...over,
});

describe('watermark-image utils', () => {
  it('POSITIONS lists the 9 grid placements in row-major order', () => {
    expect(POSITIONS).toHaveLength(9);
    expect(POSITIONS[0].id).toBe('top-left');
    expect(POSITIONS[4].id).toBe('middle-center');
    expect(POSITIONS[8].id).toBe('bottom-right');
  });

  it('anchorPoint places an item at each corner and edge with margin', () => {
    expect(anchorPoint('top-left', 800, 600, 100, 50)).toEqual({ x: MARGIN, y: MARGIN });
    expect(anchorPoint('top-center', 800, 600, 100, 50)).toEqual({ x: 350, y: MARGIN });
    expect(anchorPoint('top-right', 800, 600, 100, 50)).toEqual({ x: 800 - 100 - MARGIN, y: MARGIN });
    expect(anchorPoint('middle-left', 800, 600, 100, 50)).toEqual({ x: MARGIN, y: 275 });
    expect(anchorPoint('middle-center', 800, 600, 100, 50)).toEqual({ x: 350, y: 275 });
    expect(anchorPoint('middle-right', 800, 600, 100, 50)).toEqual({ x: 684, y: 275 });
    expect(anchorPoint('bottom-left', 800, 600, 100, 50)).toEqual({ x: MARGIN, y: 600 - 50 - MARGIN });
    expect(anchorPoint('bottom-center', 800, 600, 100, 50)).toEqual({ x: 350, y: 534 });
    expect(anchorPoint('bottom-right', 800, 600, 100, 50)).toEqual({ x: 684, y: 534 });
  });

  it('tileOrigins covers the whole canvas with the given steps', () => {
    const points = tileOrigins(100, 60, 50, 30);
    expect(points).toEqual([
      { x: 0, y: 0 }, { x: 50, y: 0 },
      { x: 0, y: 30 }, { x: 50, y: 30 },
    ]);
  });

  it('drawTextWatermark draws a single positioned text watermark', () => {
    const ctx = makeCtx();
    drawTextWatermark(ctx as unknown as CanvasRenderingContext2D, 800, 600, textOpts());
    expect(ctx.globalAlpha).toBe(0.4);
    expect(ctx.fillStyle).toBe('#ff0000');
    expect(ctx.font).toBe('20px sans-serif');
    expect(ctx.fillText).toHaveBeenCalledTimes(1);
    expect(ctx.fillText).toHaveBeenCalledWith('demo', 800 - 120 - MARGIN, 600 - 20 - MARGIN);
    expect(ctx.save).toHaveBeenCalledTimes(1);
    expect(ctx.restore).toHaveBeenCalledTimes(1);
  });

  it('drawTextWatermark tiles the text when tiling is enabled', () => {
    const ctx = makeCtx();
    // stepX = 120 + 40 = 160, stepY = 60 -> 2 columns x 2 rows on a 320x120 canvas
    drawTextWatermark(ctx as unknown as CanvasRenderingContext2D, 320, 120, textOpts({ tile: true }));
    expect(ctx.fillText).toHaveBeenCalledTimes(4);
    expect(ctx.fillText).toHaveBeenCalledWith('demo', 0, 0);
    expect(ctx.fillText).toHaveBeenCalledWith('demo', 160, 60);
  });

  it('drawImageWatermark scales by canvas width, keeps ratio, and positions', () => {
    const ctx = makeCtx();
    const wm = new MockImage() as unknown as HTMLImageElement; // 100x50 => ratio 0.5
    drawImageWatermark(ctx as unknown as CanvasRenderingContext2D, 800, 600, wm, { scale: 25, opacity: 0.7, position: 'top-left' });
    expect(ctx.globalAlpha).toBe(0.7);
    expect(ctx.drawImage).toHaveBeenCalledWith(wm, MARGIN, MARGIN, 200, 100);
  });

  it('drawImageWatermark centers the watermark for middle-center', () => {
    const ctx = makeCtx();
    const wm = new MockImage() as unknown as HTMLImageElement;
    drawImageWatermark(ctx as unknown as CanvasRenderingContext2D, 800, 600, wm, { scale: 50, opacity: 1, position: 'middle-center' });
    expect(ctx.drawImage).toHaveBeenCalledWith(wm, (800 - 400) / 2, (600 - 200) / 2, 400, 200);
  });

  it('watermarkedFileName always exports as png', () => {
    expect(watermarkedFileName('photo.jpg')).toBe('watermarked-photo.png');
    expect(watermarkedFileName('logo.v2.webp')).toBe('watermarked-logo.v2.png');
    expect(watermarkedFileName('.gif')).toBe('watermarked-image.png');
  });

  it('loadImageFromFile resolves with an image for a readable file', async () => {
    const img = await loadImageFromFile(new File(['x'], 'a.png', { type: 'image/png' }));
    expect(img).toBeInstanceOf(MockImage);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it('loadImageFromFile rejects and revokes the URL for a broken file', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:bad');
    await expect(loadImageFromFile(new File(['x'], 'a.png', { type: 'image/png' }))).rejects.toThrow('Could not load image.');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:bad');
  });
});

describe('WatermarkImage component', () => {
  it('renders upload zone, mode tabs, text controls, and privacy note', () => {
    render(<WatermarkImage />);
    expect(screen.getByText('Watermark Image', { selector: 'h1' })).toBeTruthy();
    expect(screen.getByText('Drag & Drop Image Here')).toBeTruthy();
    expect(screen.getByText('Watermark Options')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Text' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Image' })).toBeTruthy();
    expect(screen.getByLabelText('Watermark Text')).toBeTruthy();
    POSITIONS.forEach((p) => expect(screen.getByRole('button', { name: p.label })).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Download Watermarked Image' })).toBeTruthy();
    expect(screen.getByText(/processed locally in your browser/)).toBeTruthy();
  });
});

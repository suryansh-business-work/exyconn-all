import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import CropImage from './index';
import { ASPECT_PRESETS, outputMime, mimeToExt, cropFileName, clampCropArea, drawCroppedImage, canvasToBlob, getCroppedBlob, loadImage } from './utils';

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
  naturalWidth = 400;
  naturalHeight = 200;
  set src(value: string) {
    if (value === 'bad-src') queueMicrotask(() => this.onerror?.());
    else queueMicrotask(() => this.onload?.());
  }
}

const ctxStub = { drawImage: vi.fn() };

beforeEach(() => {
  vi.stubGlobal('Image', MockImage);
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ctxStub) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) { cb(new Blob(['img'], { type: 'image/png' })); };
  URL.createObjectURL = vi.fn(() => 'blob:mock');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('crop-image utils', () => {
  it('exposes the six aspect presets with Free unconstrained', () => {
    expect(ASPECT_PRESETS.map((p) => p.label)).toEqual(['Free', '1:1', '4:3', '16:9', '3:4', '9:16']);
    expect(ASPECT_PRESETS[0].value).toBeUndefined();
    expect(ASPECT_PRESETS[1].value).toBe(1);
    expect(ASPECT_PRESETS[3].value).toBeCloseTo(16 / 9);
  });

  it('outputMime passes through canvas-encodable types and falls back to png', () => {
    expect(outputMime('image/png')).toBe('image/png');
    expect(outputMime('image/jpeg')).toBe('image/jpeg');
    expect(outputMime('image/webp')).toBe('image/webp');
    expect(outputMime('image/gif')).toBe('image/png');
    expect(outputMime('image/svg+xml')).toBe('image/png');
  });

  it('mimeToExt maps mime types to extensions', () => {
    expect(mimeToExt('image/png')).toBe('png');
    expect(mimeToExt('image/webp')).toBe('webp');
    expect(mimeToExt('image/jpeg')).toBe('jpg');
  });

  it('cropFileName builds a cropped-* name with the right extension', () => {
    expect(cropFileName('photo.png', 'image/png')).toBe('cropped-photo.png');
    expect(cropFileName('holiday.pic.jpg', 'image/jpeg')).toBe('cropped-holiday.pic.jpg');
    expect(cropFileName('.png', 'image/png')).toBe('cropped-image.png');
  });

  it('clampCropArea keeps the area inside the image and rounds values', () => {
    expect(clampCropArea({ x: 10.4, y: 5.6, width: 50.2, height: 20.8 }, 400, 200)).toEqual({ x: 10, y: 6, width: 50, height: 21 });
    expect(clampCropArea({ x: -5, y: -5, width: 500, height: 300 }, 400, 200)).toEqual({ x: 0, y: 0, width: 400, height: 200 });
    expect(clampCropArea({ x: 390, y: 195, width: 100, height: 100 }, 400, 200)).toEqual({ x: 390, y: 195, width: 10, height: 5 });
    expect(clampCropArea({ x: 0, y: 0, width: 0, height: 0 }, 400, 200)).toEqual({ x: 0, y: 0, width: 1, height: 1 });
  });

  it('drawCroppedImage sizes the canvas and draws the crop region', () => {
    const canvas = document.createElement('canvas');
    const image = new MockImage() as unknown as CanvasImageSource;
    drawCroppedImage(image, { x: 10, y: 20, width: 100, height: 50 }, canvas);
    expect(canvas.width).toBe(100);
    expect(canvas.height).toBe(50);
    expect(ctxStub.drawImage).toHaveBeenCalledWith(image, 10, 20, 100, 50, 0, 0, 100, 50);
  });

  it('drawCroppedImage throws when the 2d context is unavailable', () => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
    const canvas = document.createElement('canvas');
    expect(() => drawCroppedImage(new MockImage() as unknown as CanvasImageSource, { x: 0, y: 0, width: 1, height: 1 }, canvas)).toThrow('Canvas is not supported');
  });

  it('canvasToBlob resolves with the encoded blob and rejects on null', async () => {
    const canvas = document.createElement('canvas');
    await expect(canvasToBlob(canvas, 'image/png')).resolves.toBeInstanceOf(Blob);
    HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) { cb(null); };
    await expect(canvasToBlob(canvas, 'image/png')).rejects.toThrow('Failed to export image.');
  });

  it('loadImage resolves on load and rejects on error', async () => {
    await expect(loadImage('blob:ok')).resolves.toBeInstanceOf(MockImage);
    await expect(loadImage('bad-src')).rejects.toThrow('Could not load image.');
  });

  it('getCroppedBlob crops, clamps to image bounds, and returns a blob', async () => {
    const blob = await getCroppedBlob('blob:ok', { x: 350, y: 150, width: 100, height: 100 }, 'image/png');
    expect(blob).toBeInstanceOf(Blob);
    expect(ctxStub.drawImage).toHaveBeenCalledWith(expect.any(MockImage), 350, 150, 50, 50, 0, 0, 50, 50);
  });
});

describe('CropImage component', () => {
  it('renders the tool with upload zone and crop options', () => {
    render(<CropImage />);
    expect(screen.getByText('Crop Image', { selector: 'h1' })).toBeTruthy();
    expect(screen.getByText('Drag & Drop Image Here')).toBeTruthy();
    expect(screen.getByText('Browse Files')).toBeTruthy();
    expect(screen.getByText('Crop Options')).toBeTruthy();
    expect(screen.getByText('Aspect Ratio')).toBeTruthy();
    ASPECT_PRESETS.forEach((p) => expect(screen.getByRole('button', { name: p.label })).toBeTruthy());
    expect(screen.getByText(/Zoom:/)).toBeTruthy();
    expect(screen.getByText(/processed locally in your browser/)).toBeTruthy();
  });
});

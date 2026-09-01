import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import PhotoEditor from './index';
import { DEFAULT_ADJUSTMENTS, SLIDER_CONFIGS, buildFilter, isDefault, editedFileName, drawFiltered, canvasToBlob, exportImage, loadImage } from './utils';

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
  naturalWidth = 300;
  naturalHeight = 150;
  set src(value: string) {
    if (value === 'bad-src') queueMicrotask(() => this.onerror?.());
    else queueMicrotask(() => this.onload?.());
  }
}

const ctxStub = { drawImage: vi.fn(), fillRect: vi.fn(), fillStyle: '', filter: 'none' };

beforeEach(() => {
  ctxStub.fillStyle = '';
  ctxStub.filter = 'none';
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

describe('photo-editor utils', () => {
  it('buildFilter renders the neutral filter for defaults', () => {
    expect(buildFilter(DEFAULT_ADJUSTMENTS)).toBe(
      'brightness(100%) contrast(100%) saturate(100%) grayscale(0%) sepia(0%) hue-rotate(0deg) blur(0px)',
    );
  });

  it('buildFilter reflects every adjustment', () => {
    const filter = buildFilter({ brightness: 120, contrast: 80, saturate: 150, grayscale: 25, sepia: 10, hueRotate: -90, blur: 4 });
    expect(filter).toBe('brightness(120%) contrast(80%) saturate(150%) grayscale(25%) sepia(10%) hue-rotate(-90deg) blur(4px)');
  });

  it('isDefault detects untouched and modified adjustments', () => {
    expect(isDefault(DEFAULT_ADJUSTMENTS)).toBe(true);
    expect(isDefault({ ...DEFAULT_ADJUSTMENTS })).toBe(true);
    expect(isDefault({ ...DEFAULT_ADJUSTMENTS, blur: 1 })).toBe(false);
    expect(isDefault({ ...DEFAULT_ADJUSTMENTS, hueRotate: -10 })).toBe(false);
  });

  it('SLIDER_CONFIGS covers all seven adjustments with valid ranges', () => {
    expect(SLIDER_CONFIGS.map((c) => c.key)).toEqual(['brightness', 'contrast', 'saturate', 'grayscale', 'sepia', 'hueRotate', 'blur']);
    SLIDER_CONFIGS.forEach((c) => {
      expect(c.min).toBeLessThan(c.max);
      expect(DEFAULT_ADJUSTMENTS[c.key]).toBeGreaterThanOrEqual(c.min);
      expect(DEFAULT_ADJUSTMENTS[c.key]).toBeLessThanOrEqual(c.max);
    });
  });

  it('editedFileName swaps the extension by format', () => {
    expect(editedFileName('photo.png', 'png')).toBe('edited-photo.png');
    expect(editedFileName('photo.heic', 'jpeg')).toBe('edited-photo.jpg');
    expect(editedFileName('.jpg', 'png')).toBe('edited-image.png');
  });

  it('drawFiltered sizes the canvas, applies the filter, and draws', () => {
    const canvas = document.createElement('canvas');
    const image = new MockImage() as unknown as HTMLImageElement;
    drawFiltered(image, canvas, 'blur(2px)');
    expect(canvas.width).toBe(300);
    expect(canvas.height).toBe(150);
    expect(ctxStub.filter).toBe('blur(2px)');
    expect(ctxStub.drawImage).toHaveBeenCalledWith(image, 0, 0);
    expect(ctxStub.fillRect).not.toHaveBeenCalled();
  });

  it('drawFiltered fills the background when one is given', () => {
    const canvas = document.createElement('canvas');
    drawFiltered(new MockImage() as unknown as HTMLImageElement, canvas, 'none', '#ffffff');
    expect(ctxStub.fillStyle).toBe('#ffffff');
    expect(ctxStub.fillRect).toHaveBeenCalledWith(0, 0, 300, 150);
  });

  it('drawFiltered throws when the 2d context is unavailable', () => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
    const canvas = document.createElement('canvas');
    expect(() => drawFiltered(new MockImage() as unknown as HTMLImageElement, canvas, 'none')).toThrow('Canvas is not supported');
  });

  it('canvasToBlob rejects when encoding fails', async () => {
    HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) { cb(null); };
    await expect(canvasToBlob(document.createElement('canvas'), 'image/png')).rejects.toThrow('Failed to export image.');
  });

  it('loadImage rejects for a broken source', async () => {
    await expect(loadImage('bad-src')).rejects.toThrow('Could not load image.');
  });

  it('exportImage returns a blob and paints white only for jpeg', async () => {
    await expect(exportImage('blob:ok', DEFAULT_ADJUSTMENTS, 'png')).resolves.toBeInstanceOf(Blob);
    expect(ctxStub.fillRect).not.toHaveBeenCalled();
    await expect(exportImage('blob:ok', DEFAULT_ADJUSTMENTS, 'jpeg')).resolves.toBeInstanceOf(Blob);
    expect(ctxStub.fillRect).toHaveBeenCalledWith(0, 0, 300, 150);
  });
});

describe('PhotoEditor component', () => {
  it('renders upload zone, all sliders, format toggle, and privacy note', () => {
    render(<PhotoEditor />);
    expect(screen.getByText('Photo Editor', { selector: 'h1' })).toBeTruthy();
    expect(screen.getByText('Drag & Drop Image Here')).toBeTruthy();
    expect(screen.getByText('Adjustments')).toBeTruthy();
    SLIDER_CONFIGS.forEach((c) => expect(screen.getByText(new RegExp(`^${c.label}:`))).toBeTruthy());
    expect(screen.getByRole('button', { name: 'PNG' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'JPG' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeTruthy();
    expect(screen.getByText(/processed locally in your browser/)).toBeTruthy();
  });
});

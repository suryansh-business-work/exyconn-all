import { mockCanvasContext } from '../../__tests__/canvasMock';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { captureDownloads, dropOnZone, upload } from '../../__tests__/helpers/pdfHarness';
import CropImage from './index';
import {
  ASPECT_PRESETS,
  outputMime,
  mimeToExt,
  cropFileName,
  clampCropArea,
  drawCroppedImage,
  canvasToBlob,
  getCroppedBlob,
  loadImage,
} from './utils';

vi.mock('../../shared/components/ToolLayout/ToolLayout', () => ({
  default: ({ children, toolName }: { children: React.ReactNode; toolName: string }) => (
    <div>
      <h1>{toolName}</h1>
      {children}
    </div>
  ),
}));

/** react-easy-crop measures the DOM, which jsdom cannot; this stand-in reports what it was given. */
vi.mock('react-easy-crop', () => ({
  default: (props: {
    aspect: number;
    zoom: number;
    onCropChange: (point: { x: number; y: number }) => void;
    onZoomChange: (zoom: number) => void;
    onCropComplete: (area: unknown, pixels: { x: number; y: number; width: number; height: number }) => void;
    onMediaLoaded: (size: { naturalWidth: number; naturalHeight: number }) => void;
  }) => (
    <div>
      <output aria-label="aspect">{props.aspect.toFixed(3)}</output>
      <output aria-label="cropper zoom">{props.zoom}</output>
      <button onClick={() => props.onMediaLoaded({ naturalWidth: 300, naturalHeight: 100 })}>media loaded</button>
      <button onClick={() => props.onCropChange({ x: 4, y: 2 })}>move crop</button>
      <button onClick={() => props.onZoomChange(2.5)}>pinch zoom</button>
      <button onClick={() => props.onCropComplete({}, { x: 10, y: 20, width: 100, height: 50 })}>finish crop</button>
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
  mockCanvasContext(() => ctxStub);
  HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) {
    cb(new Blob(['img'], { type: 'image/png' }));
  };
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
    expect(clampCropArea({ x: 10.4, y: 5.6, width: 50.2, height: 20.8 }, 400, 200)).toEqual({
      x: 10,
      y: 6,
      width: 50,
      height: 21,
    });
    expect(clampCropArea({ x: -5, y: -5, width: 500, height: 300 }, 400, 200)).toEqual({
      x: 0,
      y: 0,
      width: 400,
      height: 200,
    });
    expect(clampCropArea({ x: 390, y: 195, width: 100, height: 100 }, 400, 200)).toEqual({
      x: 390,
      y: 195,
      width: 10,
      height: 5,
    });
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
    mockCanvasContext(() => null);
    const canvas = document.createElement('canvas');
    expect(() =>
      drawCroppedImage(new MockImage() as unknown as CanvasImageSource, { x: 0, y: 0, width: 1, height: 1 }, canvas)
    ).toThrow('Canvas is not supported');
  });

  it('canvasToBlob resolves with the encoded blob and rejects on null', async () => {
    const canvas = document.createElement('canvas');
    await expect(canvasToBlob(canvas, 'image/png')).resolves.toBeInstanceOf(Blob);
    HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) {
      cb(null);
    };
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

/** Something thrown that is not an Error, as a third-party callback might. */
class NotAnError {}

describe('CropImage flow', () => {
  const photo = (name = 'photo.png', type = 'image/png') => new File(['img'], name, { type });
  const mount = () => render(<CropImage />);

  it('refuses a file that is not an image, until the message is closed', async () => {
    const { container } = mount();
    upload(container, photo('notes.txt', 'text/plain'));
    expect(screen.getByText('Please select an image file.')).toBeTruthy();
    expect(screen.getByText('Drag & Drop Image Here')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });
    expect(screen.queryByText('Please select an image file.')).toBeNull();
  });

  it('loads a dropped image, ignoring an empty drop, and follows the image shape for Free', () => {
    mount();
    const zone = screen.getByText('Drag & Drop Image Here').closest('.MuiPaper-root') as HTMLElement;
    fireEvent.drop(zone, { dataTransfer: { files: [] } });
    expect(screen.getByText('Drag & Drop Image Here')).toBeTruthy();

    dropOnZone(photo(), /Drag & Drop Image Here/);
    expect(screen.queryByText('Drag & Drop Image Here')).toBeNull();
    expect(screen.getByLabelText('aspect').textContent).toBe((4 / 3).toFixed(3));
    fireEvent.click(screen.getByText('media loaded'));
    expect(screen.getByLabelText('aspect').textContent).toBe('3.000');

    fireEvent.click(screen.getByRole('button', { name: '16:9' }));
    expect(screen.getByLabelText('aspect').textContent).toBe((16 / 9).toFixed(3));
    // Clicking the selected preset again keeps it selected.
    fireEvent.click(screen.getByRole('button', { name: '16:9' }));
    expect(screen.getByLabelText('aspect').textContent).toBe((16 / 9).toFixed(3));
  });

  it('asks for a crop area before cropping', async () => {
    const { container } = mount();
    upload(container, photo());
    fireEvent.click(screen.getByRole('button', { name: 'Crop Image' }));
    expect(await screen.findByText('Upload an image and adjust the crop area first.')).toBeTruthy();
  });

  it('zooms from the slider and the cropper, and moves the crop', () => {
    const { container } = mount();
    upload(container, photo());
    fireEvent.click(screen.getByText('pinch zoom'));
    expect(screen.getByText('Zoom: 2.5x')).toBeTruthy();
    fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' });
    expect(screen.getByText('Zoom: 2.6x')).toBeTruthy();
    fireEvent.click(screen.getByText('move crop'));
    expect(screen.getByLabelText('cropper zoom').textContent).toBe('2.6');
  });

  it('crops the selection, previews it and downloads it under a cropped name', async () => {
    const downloads = captureDownloads();
    const { container } = mount();
    upload(container, photo('holiday.webp', 'image/webp'));
    fireEvent.click(screen.getByText('finish crop'));
    expect(screen.getByText('Selection: 100 × 50px')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Crop Image' }));
    const preview = await screen.findByAltText('Cropped result preview');
    expect(preview.getAttribute('src')).toBe('blob:captured-2');
    expect(ctxStub.drawImage).toHaveBeenCalledWith(expect.any(MockImage), 10, 20, 100, 50, 0, 0, 100, 50);

    fireEvent.click(screen.getByRole('button', { name: /Download Cropped Image/ }));
    expect(downloads.map((d) => d.name)).toEqual(['cropped-holiday.webp']);

    // A second crop replaces the first result and frees its URL.
    fireEvent.click(screen.getByRole('button', { name: 'Crop Image' }));
    expect(await screen.findByAltText('Cropped result preview')).toHaveProperty('src', 'blob:captured-3');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:captured-2');
  });

  it('starts over with a different image, freeing the old image and result', async () => {
    captureDownloads();
    const { container } = mount();
    upload(container, photo());
    fireEvent.click(screen.getByText('finish crop'));
    fireEvent.click(screen.getByRole('button', { name: 'Crop Image' }));
    await screen.findByAltText('Cropped result preview');

    upload(container, photo('second.jpg', 'image/jpeg'));
    expect(screen.queryByAltText('Cropped result preview')).toBeNull();
    expect(screen.queryByText(/Selection:/)).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:captured-1');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:captured-2');
  });

  it('reports a crop that fails, with its reason or a generic one', async () => {
    const { container } = mount();
    upload(container, photo());
    fireEvent.click(screen.getByText('finish crop'));

    HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) {
      cb(null);
    };
    fireEvent.click(screen.getByRole('button', { name: 'Crop Image' }));
    expect(await screen.findByText('Failed to export image.')).toBeTruthy();

    HTMLCanvasElement.prototype.toBlob = () => {
      throw new NotAnError();
    };
    fireEvent.click(screen.getByRole('button', { name: 'Crop Image' }));
    expect(await screen.findByText('Crop failed.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Crop Image' })).toBeEnabled();
  });
});

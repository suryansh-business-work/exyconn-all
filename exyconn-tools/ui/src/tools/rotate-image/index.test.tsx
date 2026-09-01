import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  rotateBy, outputDimensions, cssTransform, isIdentity, outputType, outputFileName,
  applyTransform, INITIAL_TRANSFORM,
} from './utils';
import RotateImage from './index';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () => {
  const React = await import('react');
  return {
    default: ({ children, toolName }: { children?: React.ReactNode; toolName?: string }) =>
      React.createElement('div', null, React.createElement('h1', null, toolName), children),
  };
});

class MockImage {
  naturalWidth = 640;
  naturalHeight = 480;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_value: string) {
    queueMicrotask(() => this.onload?.());
  }
}

let lastCanvas: HTMLCanvasElement | null = null;
const recordCanvas = (canvas: HTMLCanvasElement) => {
  lastCanvas = canvas;
};
const ctxMock = {
  drawImage: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
};

beforeAll(() => {
  URL.createObjectURL = vi.fn(() => 'blob:mock') as typeof URL.createObjectURL;
  URL.revokeObjectURL = vi.fn();
  vi.stubGlobal('Image', MockImage);
  HTMLCanvasElement.prototype.getContext = vi.fn(
    () => ctxMock,
  ) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback, type?: string) {
    recordCanvas(this);
    cb(new Blob(['rotated'], { type: type ?? 'image/png' }));
  };
});

beforeEach(() => {
  ctxMock.drawImage.mockClear();
  ctxMock.translate.mockClear();
  ctxMock.rotate.mockClear();
  ctxMock.scale.mockClear();
});

describe('rotate-image utils', () => {
  describe('rotateBy', () => {
    it('adds a quarter turn', () => expect(rotateBy(0, 90)).toBe(90));
    it('wraps past 360', () => expect(rotateBy(270, 90)).toBe(0));
    it('handles 180 steps', () => expect(rotateBy(180, 270)).toBe(90));
  });

  describe('outputDimensions', () => {
    it('keeps dimensions at 0°', () => expect(outputDimensions(640, 480, 0)).toEqual({ width: 640, height: 480 }));
    it('keeps dimensions at 180°', () => expect(outputDimensions(640, 480, 180)).toEqual({ width: 640, height: 480 }));
    it('swaps dimensions at 90°', () => expect(outputDimensions(640, 480, 90)).toEqual({ width: 480, height: 640 }));
    it('swaps dimensions at 270°', () => expect(outputDimensions(640, 480, 270)).toEqual({ width: 480, height: 640 }));
  });

  describe('cssTransform', () => {
    it('renders rotation only', () => {
      expect(cssTransform({ rotation: 90, flipH: false, flipV: false })).toBe('rotate(90deg) scale(1, 1)');
    });
    it('renders flips as negative scale', () => {
      expect(cssTransform({ rotation: 180, flipH: true, flipV: true })).toBe('rotate(180deg) scale(-1, -1)');
    });
  });

  describe('isIdentity', () => {
    it('is true for the initial transform', () => expect(isIdentity(INITIAL_TRANSFORM)).toBe(true));
    it('is false once rotated', () => expect(isIdentity({ rotation: 90, flipH: false, flipV: false })).toBe(false));
    it('is false once flipped', () => expect(isIdentity({ rotation: 0, flipH: true, flipV: false })).toBe(false));
  });

  describe('outputType and outputFileName', () => {
    it('keeps jpeg, png, and webp', () => {
      expect(outputType('image/jpeg')).toBe('image/jpeg');
      expect(outputType('image/webp')).toBe('image/webp');
    });
    it('falls back to png for other types', () => expect(outputType('image/gif')).toBe('image/png'));
    it('builds the download name', () => {
      expect(outputFileName('cat.gif', 'image/gif')).toBe('rotated-cat.png');
      expect(outputFileName('cat.jpg', 'image/jpeg')).toBe('rotated-cat.jpg');
    });
  });

  describe('applyTransform', () => {
    it('swaps canvas dimensions for a 90° rotation', async () => {
      const file = new File(['img'], 'a.png', { type: 'image/png' });
      const blob = await applyTransform(file, { rotation: 90, flipH: false, flipV: false });
      expect(blob.type).toBe('image/png');
      expect(lastCanvas?.width).toBe(480);
      expect(lastCanvas?.height).toBe(640);
      expect(ctxMock.rotate).toHaveBeenCalledWith(Math.PI / 2);
      expect(ctxMock.drawImage).toHaveBeenCalledWith(expect.anything(), -320, -240);
    });
    it('keeps canvas dimensions and applies flips at 180°', async () => {
      const file = new File(['img'], 'a.jpg', { type: 'image/jpeg' });
      const blob = await applyTransform(file, { rotation: 180, flipH: true, flipV: false });
      expect(blob.type).toBe('image/jpeg');
      expect(lastCanvas?.width).toBe(640);
      expect(lastCanvas?.height).toBe(480);
      expect(ctxMock.scale).toHaveBeenCalledWith(-1, 1);
    });
  });
});

describe('RotateImage component', () => {
  it('renders the upload zone and transform controls', () => {
    render(<RotateImage />);
    expect(screen.getByRole('heading', { name: 'Rotate Image' })).toBeInTheDocument();
    expect(screen.getByText('Drag & Drop Image Here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Rotate Left/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Rotate Right/ })).toBeDisabled();
    expect(screen.getByText('180°')).toBeInTheDocument();
    expect(screen.getByText('Horizontal')).toBeInTheDocument();
    expect(screen.getByText('Vertical')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download Rotated Image/ })).toBeDisabled();
    expect(screen.getByText(/processed locally in your browser/)).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  scaleByPercent, lockedHeight, lockedWidth, outputFileName, resizeImage,
  PERCENT_PRESETS, SIZE_PRESETS,
} from './utils';
import ResizeImage from './index';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () => {
  const React = await import('react');
  return {
    default: ({ children, toolName }: { children?: React.ReactNode; toolName?: string }) =>
      React.createElement('div', null, React.createElement('h1', null, toolName), children),
  };
});

class MockImage {
  naturalWidth = 1200;
  naturalHeight = 800;
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

beforeAll(() => {
  URL.createObjectURL = vi.fn(() => 'blob:mock') as typeof URL.createObjectURL;
  URL.revokeObjectURL = vi.fn();
  vi.stubGlobal('Image', MockImage);
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    fillStyle: '',
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback, type?: string) {
    recordCanvas(this);
    cb(new Blob(['resized'], { type: type ?? 'image/png' }));
  };
});

describe('resize-image utils', () => {
  describe('scaleByPercent', () => {
    it('scales down to 50%', () => {
      expect(scaleByPercent({ width: 1200, height: 800 }, 50)).toEqual({ width: 600, height: 400 });
    });
    it('rounds to whole pixels', () => {
      expect(scaleByPercent({ width: 101, height: 51 }, 25)).toEqual({ width: 25, height: 13 });
    });
    it('never returns a dimension below 1', () => {
      expect(scaleByPercent({ width: 2, height: 2 }, 25)).toEqual({ width: 1, height: 1 });
    });
  });

  describe('aspect lock', () => {
    it('derives the height from a changed width', () => {
      expect(lockedHeight({ width: 1200, height: 800 }, 600)).toBe(400);
    });
    it('derives the width from a changed height', () => {
      expect(lockedWidth({ width: 1200, height: 800 }, 400)).toBe(600);
    });
    it('keeps derived dimensions at least 1', () => {
      expect(lockedHeight({ width: 2000, height: 10 }, 1)).toBe(1);
    });
  });

  describe('outputFileName', () => {
    it('appends the dimensions and swaps the extension', () => {
      expect(outputFileName('photo.png', 'image/jpeg', { width: 600, height: 400 })).toBe('photo-600x400.jpg');
    });
    it('handles names without an extension', () => {
      expect(outputFileName('photo', 'image/webp', { width: 10, height: 20 })).toBe('photo-10x20.webp');
    });
  });

  describe('presets', () => {
    it('exposes the 25/50/75 percent presets', () => {
      expect(PERCENT_PRESETS).toEqual([25, 50, 75]);
    });
    it('exposes common size presets with positive dimensions', () => {
      expect(SIZE_PRESETS.length).toBeGreaterThan(0);
      for (const preset of SIZE_PRESETS) {
        expect(preset.width).toBeGreaterThan(0);
        expect(preset.height).toBeGreaterThan(0);
      }
    });
  });

  describe('resizeImage', () => {
    it('draws onto a canvas of the requested size and encodes the chosen format', async () => {
      const file = new File(['img'], 'a.png', { type: 'image/png' });
      const blob = await resizeImage(file, { width: 320, height: 240, format: 'image/webp' });
      expect(blob.type).toBe('image/webp');
      expect(lastCanvas?.width).toBe(320);
      expect(lastCanvas?.height).toBe(240);
    });
  });
});

describe('ResizeImage component', () => {
  it('renders the upload zone and options', () => {
    render(<ResizeImage />);
    expect(screen.getByRole('heading', { name: 'Resize Image' })).toBeInTheDocument();
    expect(screen.getByText('Drag & Drop Image Here')).toBeInTheDocument();
    expect(screen.getByLabelText(/Width \(px\)/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Height \(px\)/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Toggle aspect ratio lock' })).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('PNG')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resize Image' })).toBeDisabled();
    expect(screen.getByText(/processed locally in your browser/)).toBeInTheDocument();
  });
});

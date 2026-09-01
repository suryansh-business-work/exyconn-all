import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  formatBytes, computeScaledDimensions, computeSavedPercent, outputFileName, compressImage,
} from './utils';
import CompressImage from './index';

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
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    fillStyle: '',
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback, type?: string) {
    cb(new Blob(['x'.repeat(50)], { type: type ?? 'image/png' }));
  };
});

describe('compress-image utils', () => {
  describe('formatBytes', () => {
    it('formats bytes', () => expect(formatBytes(512)).toBe('512 B'));
    it('formats kilobytes', () => expect(formatBytes(2048)).toBe('2.0 KB'));
    it('formats megabytes', () => expect(formatBytes(3 * 1024 * 1024)).toBe('3.00 MB'));
  });

  describe('computeScaledDimensions', () => {
    it('returns original size when no max dimension is given', () => {
      expect(computeScaledDimensions(800, 600)).toEqual({ width: 800, height: 600 });
    });
    it('returns original size when already within the max dimension', () => {
      expect(computeScaledDimensions(800, 600, 1000)).toEqual({ width: 800, height: 600 });
    });
    it('downscales landscape images by the width', () => {
      expect(computeScaledDimensions(2000, 1000, 1000)).toEqual({ width: 1000, height: 500 });
    });
    it('downscales portrait images by the height', () => {
      expect(computeScaledDimensions(1000, 2000, 500)).toEqual({ width: 250, height: 500 });
    });
    it('never returns a dimension below 1', () => {
      expect(computeScaledDimensions(10000, 1, 100)).toEqual({ width: 100, height: 1 });
    });
  });

  describe('computeSavedPercent', () => {
    it('computes the saving', () => expect(computeSavedPercent(1000, 250)).toBe(75));
    it('returns 0 for an empty original', () => expect(computeSavedPercent(0, 100)).toBe(0));
    it('returns a negative value when the output grew', () => expect(computeSavedPercent(100, 150)).toBe(-50));
  });

  describe('outputFileName', () => {
    it('swaps the extension for jpeg', () => {
      expect(outputFileName('photo.png', 'image/jpeg')).toBe('photo-compressed.jpg');
    });
    it('swaps the extension for webp', () => {
      expect(outputFileName('photo.jpg', 'image/webp')).toBe('photo-compressed.webp');
    });
    it('handles names without an extension', () => {
      expect(outputFileName('photo', 'image/jpeg')).toBe('photo-compressed.jpg');
    });
  });

  describe('compressImage', () => {
    it('re-encodes the file with the requested format', async () => {
      const file = new File(['a'.repeat(500)], 'a.png', { type: 'image/png' });
      const out = await compressImage(file, { quality: 0.8, format: 'image/jpeg' });
      expect(out.blob.type).toBe('image/jpeg');
      expect(out.blob.size).toBe(50);
      expect(out.width).toBe(800);
      expect(out.height).toBe(600);
    });
    it('downscales to the max dimension', async () => {
      const file = new File(['a'], 'a.png', { type: 'image/png' });
      const out = await compressImage(file, { quality: 0.8, format: 'image/webp', maxDimension: 400 });
      expect(out.width).toBe(400);
      expect(out.height).toBe(300);
    });
  });
});

describe('CompressImage component', () => {
  it('renders the upload zone and options', () => {
    render(<CompressImage />);
    expect(screen.getByRole('heading', { name: 'Compress Image' })).toBeInTheDocument();
    expect(screen.getByText('Drag & Drop Images Here')).toBeInTheDocument();
    expect(screen.getByText('Browse Files')).toBeInTheDocument();
    expect(screen.getByText(/Quality: 80%/)).toBeInTheDocument();
    expect(screen.getByText('JPEG')).toBeInTheDocument();
    expect(screen.getByText('WEBP')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Compress Images' })).toBeDisabled();
    expect(screen.getByText(/processed locally in your browser/)).toBeInTheDocument();
  });
});

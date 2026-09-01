import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import {
  ACCEPTED_TYPES, formatBytes, outputFileName, convertFromJpg,
} from './utils';
import ConvertFromJpg from './index';

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

let lastToBlobQuality: number | undefined;

beforeAll(() => {
  URL.createObjectURL = vi.fn(() => 'blob:mock') as typeof URL.createObjectURL;
  URL.revokeObjectURL = vi.fn();
  vi.stubGlobal('Image', MockImage);
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    drawImage: vi.fn(),
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback, type?: string, quality?: number) {
    lastToBlobQuality = quality;
    cb(new Blob(['x'.repeat(30)], { type: type ?? 'image/png' }));
  };
});

describe('convert-from-jpg utils', () => {
  describe('ACCEPTED_TYPES', () => {
    it('accepts only jpeg', () => {
      expect(ACCEPTED_TYPES.has('image/jpeg')).toBe(true);
      expect(ACCEPTED_TYPES.has('image/png')).toBe(false);
      expect(ACCEPTED_TYPES.has('image/webp')).toBe(false);
    });
  });

  describe('formatBytes', () => {
    it('formats bytes', () => expect(formatBytes(100)).toBe('100 B'));
    it('formats kilobytes', () => expect(formatBytes(1536)).toBe('1.5 KB'));
    it('formats megabytes', () => expect(formatBytes(2 * 1024 * 1024)).toBe('2.00 MB'));
  });

  describe('outputFileName', () => {
    it('swaps the extension for png', () => expect(outputFileName('photo.jpg', 'image/png')).toBe('photo.png'));
    it('swaps the extension for webp', () => expect(outputFileName('photo.jpeg', 'image/webp')).toBe('photo.webp'));
    it('handles names without an extension', () => expect(outputFileName('photo', 'image/png')).toBe('photo.png'));
  });

  describe('convertFromJpg', () => {
    it('encodes as png without a quality parameter', async () => {
      const file = new File(['a'], 'a.jpg', { type: 'image/jpeg' });
      const blob = await convertFromJpg(file, 'image/png', 0.8);
      expect(blob.type).toBe('image/png');
      expect(blob.size).toBe(30);
      expect(lastToBlobQuality).toBeUndefined();
    });
    it('encodes as webp with the requested quality', async () => {
      const file = new File(['a'], 'a.jpg', { type: 'image/jpeg' });
      const blob = await convertFromJpg(file, 'image/webp', 0.75);
      expect(blob.type).toBe('image/webp');
      expect(lastToBlobQuality).toBe(0.75);
    });
  });
});

describe('ConvertFromJpg component', () => {
  it('renders the upload zone and options', () => {
    render(<ConvertFromJpg />);
    expect(screen.getByText('Convert from JPG')).toBeInTheDocument();
    expect(screen.getByText('Drag & Drop JPG Images Here')).toBeInTheDocument();
    expect(screen.getByText('Browse Files')).toBeInTheDocument();
    expect(screen.getByText('PNG')).toBeInTheDocument();
    expect(screen.getByText('WEBP')).toBeInTheDocument();
    expect(screen.getByText(/PNG is lossless/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Convert to PNG' })).toBeDisabled();
    expect(screen.getByText(/processed locally in your browser/)).toBeInTheDocument();
  });
});

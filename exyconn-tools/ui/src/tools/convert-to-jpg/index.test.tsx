import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import {
  ACCEPTED_TYPES, formatBytes, outputFileName, convertToJpg,
} from './utils';
import ConvertToJpg from './index';

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

interface MockCtx {
  drawImage: ReturnType<typeof vi.fn>;
  fillRect: ReturnType<typeof vi.fn>;
  fillStyle: string;
}

let lastCtx: MockCtx;
let lastToBlobQuality: number | undefined;

beforeAll(() => {
  URL.createObjectURL = vi.fn(() => 'blob:mock') as typeof URL.createObjectURL;
  URL.revokeObjectURL = vi.fn();
  vi.stubGlobal('Image', MockImage);
  HTMLCanvasElement.prototype.getContext = vi.fn(() => {
    lastCtx = { drawImage: vi.fn(), fillRect: vi.fn(), fillStyle: '' };
    return lastCtx;
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback, type?: string, quality?: number) {
    lastToBlobQuality = quality;
    cb(new Blob(['x'.repeat(40)], { type: type ?? 'image/png' }));
  };
});

describe('convert-to-jpg utils', () => {
  describe('ACCEPTED_TYPES', () => {
    it('accepts png, webp, gif, and bmp', () => {
      for (const type of ['image/png', 'image/webp', 'image/gif', 'image/bmp']) {
        expect(ACCEPTED_TYPES.has(type)).toBe(true);
      }
    });
    it('rejects jpeg and non-image types', () => {
      expect(ACCEPTED_TYPES.has('image/jpeg')).toBe(false);
      expect(ACCEPTED_TYPES.has('application/pdf')).toBe(false);
    });
  });

  describe('formatBytes', () => {
    it('formats bytes', () => expect(formatBytes(512)).toBe('512 B'));
    it('formats kilobytes', () => expect(formatBytes(2048)).toBe('2.0 KB'));
    it('formats megabytes', () => expect(formatBytes(3 * 1024 * 1024)).toBe('3.00 MB'));
  });

  describe('outputFileName', () => {
    it('swaps the extension for jpg', () => expect(outputFileName('photo.png')).toBe('photo.jpg'));
    it('keeps dots inside the base name', () => expect(outputFileName('my.photo.webp')).toBe('my.photo.jpg'));
    it('handles names without an extension', () => expect(outputFileName('photo')).toBe('photo.jpg'));
    it('handles dotfile-style names', () => expect(outputFileName('.hidden')).toBe('.hidden.jpg'));
  });

  describe('convertToJpg', () => {
    it('encodes as jpeg with the requested quality', async () => {
      const file = new File(['a'], 'a.png', { type: 'image/png' });
      const blob = await convertToJpg(file, 0.85);
      expect(blob.type).toBe('image/jpeg');
      expect(blob.size).toBe(40);
      expect(lastToBlobQuality).toBe(0.85);
    });
    it('flattens transparency onto a white background before drawing', async () => {
      const file = new File(['a'], 'a.png', { type: 'image/png' });
      await convertToJpg(file, 0.9);
      expect(lastCtx.fillStyle).toBe('#ffffff');
      expect(lastCtx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
      expect(lastCtx.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 800, 600);
    });
  });
});

describe('ConvertToJpg component', () => {
  it('renders the upload zone and options', () => {
    render(<ConvertToJpg />);
    expect(screen.getByRole('heading', { name: 'Convert to JPG' })).toBeInTheDocument();
    expect(screen.getByText('Drag & Drop Images Here')).toBeInTheDocument();
    expect(screen.getByText('Browse Files')).toBeInTheDocument();
    expect(screen.getByText(/JPG Quality: 90%/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Convert to JPG' })).toBeDisabled();
    expect(screen.getByText(/Transparent areas are filled with white/)).toBeInTheDocument();
    expect(screen.getByText(/processed locally in your browser/)).toBeInTheDocument();
  });
});

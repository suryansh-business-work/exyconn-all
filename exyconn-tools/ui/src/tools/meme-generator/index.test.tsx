import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import {
  ACCEPTED_TYPES, MIN_FONT_SIZE, canvasToPngBlob, drawMeme, fitFontSize,
  memeFileName, memeFont, prepareCaption,
} from './utils';
import MemeGenerator from './index';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () => {
  const React = await import('react');
  return {
    default: ({ children, toolName }: { children?: React.ReactNode; toolName?: string }) =>
      React.createElement('div', null, React.createElement('h1', null, toolName), children),
  };
});

interface MockCtx {
  drawImage: ReturnType<typeof vi.fn>;
  fillText: ReturnType<typeof vi.fn>;
  strokeText: ReturnType<typeof vi.fn>;
  measureText: ReturnType<typeof vi.fn>;
  font: string;
  textAlign: string;
  textBaseline: string;
  lineJoin: string;
  lineWidth: number;
  strokeStyle: string;
  fillStyle: string;
}

let lastCtx: MockCtx;

const mockImage = (width: number, height: number): HTMLImageElement =>
  ({ naturalWidth: width, naturalHeight: height }) as unknown as HTMLImageElement;

beforeAll(() => {
  URL.createObjectURL = vi.fn(() => 'blob:mock') as typeof URL.createObjectURL;
  URL.revokeObjectURL = vi.fn();
  HTMLCanvasElement.prototype.getContext = vi.fn(() => {
    lastCtx = {
      drawImage: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      measureText: vi.fn((text: string) => ({ width: text.length * 10 })),
      font: '', textAlign: '', textBaseline: '', lineJoin: '', lineWidth: 0, strokeStyle: '', fillStyle: '',
    };
    return lastCtx;
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback, type?: string) {
    cb(new Blob(['x'.repeat(25)], { type: type ?? 'image/png' }));
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('meme-generator utils', () => {
  describe('prepareCaption', () => {
    it('uppercases when enabled', () => expect(prepareCaption('hello', true)).toBe('HELLO'));
    it('preserves case when disabled', () => expect(prepareCaption('Hello', false)).toBe('Hello'));
    it('trims surrounding whitespace', () => expect(prepareCaption('  hi  ', false)).toBe('hi'));
    it('returns an empty string for whitespace-only input', () => expect(prepareCaption('   ', true)).toBe(''));
  });

  describe('memeFont', () => {
    it('builds a bold Impact-style font string', () => {
      expect(memeFont(40)).toBe('bold 40px Impact, "Arial Black", sans-serif');
    });
  });

  describe('memeFileName', () => {
    it('swaps the extension for a -meme.png suffix', () => expect(memeFileName('photo.jpg')).toBe('photo-meme.png'));
    it('handles names without an extension', () => expect(memeFileName('photo')).toBe('photo-meme.png'));
  });

  describe('fitFontSize', () => {
    it('keeps the max size when the text already fits', () => {
      expect(fitFontSize(() => 10, 'hi', 100, 48)).toBe(48);
    });
    it('shrinks until the text fits', () => {
      const measure = (text: string, size: number) => text.length * size;
      expect(fitFontSize(measure, 'abcd', 100, 50)).toBe(24);
    });
    it('never goes below the minimum size', () => {
      expect(fitFontSize(() => 10_000, 'very long text', 10, 60)).toBe(MIN_FONT_SIZE);
    });
    it('respects a custom minimum size', () => {
      expect(fitFontSize(() => 10_000, 'text', 10, 60, 20)).toBe(20);
    });
  });

  describe('drawMeme', () => {
    const options = { topText: 'top', bottomText: 'bottom', uppercase: true, topPadding: 10, bottomPadding: 5 };

    it('sizes the canvas to the image and draws it', () => {
      const canvas = document.createElement('canvas');
      drawMeme(canvas, mockImage(800, 600), options);
      expect(canvas.width).toBe(800);
      expect(canvas.height).toBe(600);
      expect(lastCtx.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 800, 600);
    });
    it('strokes and fills both captions at the padded positions', () => {
      const canvas = document.createElement('canvas');
      drawMeme(canvas, mockImage(800, 600), options);
      expect(lastCtx.strokeText).toHaveBeenCalledWith('TOP', 400, 60);
      expect(lastCtx.strokeText).toHaveBeenCalledWith('BOTTOM', 400, 570);
      expect(lastCtx.fillText).toHaveBeenCalledTimes(2);
      expect(lastCtx.strokeStyle).toBe('#000000');
      expect(lastCtx.fillStyle).toBe('#ffffff');
    });
    it('respects the uppercase toggle', () => {
      const canvas = document.createElement('canvas');
      drawMeme(canvas, mockImage(800, 600), { ...options, uppercase: false });
      expect(lastCtx.fillText).toHaveBeenCalledWith('top', 400, 60);
    });
    it('skips empty captions', () => {
      const canvas = document.createElement('canvas');
      drawMeme(canvas, mockImage(800, 600), { ...options, topText: '', bottomText: '  ' });
      expect(lastCtx.strokeText).not.toHaveBeenCalled();
      expect(lastCtx.fillText).not.toHaveBeenCalled();
    });
  });

  describe('canvasToPngBlob', () => {
    it('encodes the canvas as a png blob', async () => {
      const blob = await canvasToPngBlob(document.createElement('canvas'));
      expect(blob.type).toBe('image/png');
      expect(blob.size).toBe(25);
    });
  });

  describe('ACCEPTED_TYPES', () => {
    it('accepts common image types and rejects others', () => {
      expect(ACCEPTED_TYPES.has('image/jpeg')).toBe(true);
      expect(ACCEPTED_TYPES.has('image/png')).toBe(true);
      expect(ACCEPTED_TYPES.has('application/pdf')).toBe(false);
    });
  });
});

describe('MemeGenerator component', () => {
  it('renders the upload zone and caption controls', () => {
    render(<MemeGenerator />);
    expect(screen.getByText('Meme Generator')).toBeInTheDocument();
    expect(screen.getByText('Drag & Drop an Image Here')).toBeInTheDocument();
    expect(screen.getByText('Browse Files')).toBeInTheDocument();
    expect(screen.getByLabelText('Top text')).toBeInTheDocument();
    expect(screen.getByLabelText('Bottom text')).toBeInTheDocument();
    expect(screen.getByText('UPPERCASE')).toBeInTheDocument();
    expect(screen.getByText(/Top padding: 4%/)).toBeInTheDocument();
    expect(screen.getByText(/Bottom padding: 4%/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download PNG/ })).toBeDisabled();
    expect(screen.getByText(/processed locally in your browser/)).toBeInTheDocument();
  });
});

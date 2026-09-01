import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
}));

vi.mock('pptxgenjs', () => ({
  default: vi.fn(() => ({
    layout: '',
    addSlide: vi.fn(() => ({ addImage: vi.fn() })),
    writeFile: vi.fn(),
  })),
}));

vi.mock('../../shared/components/ToolLayout/ToolLayout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../shared/components/PdfPreview', () => ({
  PdfPreview: () => <div data-testid="pdf-preview" />,
}));

import PdfToPowerpoint from './index';
import { fitContain, SLIDE_16X9 } from './utils';

describe('pdf-to-powerpoint utils', () => {
  describe('fitContain', () => {
    it('letterboxes a wide page (full width, centered vertically)', () => {
      const box = fitContain(2000, 1000, SLIDE_16X9.w, SLIDE_16X9.h);
      expect(box.w).toBeCloseTo(10);
      expect(box.h).toBeCloseTo(5);
      expect(box.x).toBeCloseTo(0);
      expect(box.y).toBeCloseTo(0.3125);
    });

    it('pillarboxes a tall page (full height, centered horizontally)', () => {
      const box = fitContain(1000, 2000, SLIDE_16X9.w, SLIDE_16X9.h);
      expect(box.h).toBeCloseTo(5.625);
      expect(box.w).toBeCloseTo(2.8125);
      expect(box.x).toBeCloseTo(3.59375);
      expect(box.y).toBeCloseTo(0);
    });

    it('fills the slide exactly for a 16:9 page', () => {
      expect(fitContain(1600, 900, SLIDE_16X9.w, SLIDE_16X9.h)).toEqual({ x: 0, y: 0, w: 10, h: 5.625 });
    });

    it('never exceeds the box for an upscaled small page', () => {
      const box = fitContain(4, 3, SLIDE_16X9.w, SLIDE_16X9.h);
      expect(box.w).toBeLessThanOrEqual(SLIDE_16X9.w);
      expect(box.h).toBeCloseTo(5.625);
      expect(box.w).toBeCloseTo(7.5);
    });

    it('falls back to the full box for degenerate source dimensions', () => {
      expect(fitContain(0, 1000, SLIDE_16X9.w, SLIDE_16X9.h)).toEqual({ x: 0, y: 0, w: 10, h: 5.625 });
    });
  });
});

describe('PdfToPowerpoint component', () => {
  it('renders the upload prompt', () => {
    render(<PdfToPowerpoint />);
    expect(screen.getByText('Drop PDF here or click to upload')).toBeInTheDocument();
  });

  it('disables conversion until a file is selected', () => {
    render(<PdfToPowerpoint />);
    expect(screen.getByRole('button', { name: /convert & download pptx/i })).toBeDisabled();
  });
});

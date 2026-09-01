import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
}));

vi.mock('docx', () => ({
  Document: vi.fn(),
  Packer: { toBlob: vi.fn() },
  PageBreak: vi.fn(),
  Paragraph: vi.fn(),
  TextRun: vi.fn(),
}));

vi.mock('../../shared/components/ToolLayout/ToolLayout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../shared/components/PdfPreview', () => ({
  PdfPreview: () => <div data-testid="pdf-preview" />,
}));

import PdfToWord from './index';
import { extractParagraphs, groupIntoLines, joinLineText, linesToParagraphs, toPositioned } from './utils';

const item = (str: string, x: number, y: number, width = str.length * 5, height = 10) => ({
  str,
  dir: 'ltr',
  transform: [1, 0, 0, 1, x, y],
  width,
  height,
  fontName: 'F1',
  hasEOL: false,
});

describe('pdf-to-word utils', () => {
  describe('toPositioned', () => {
    it('keeps text items and maps transform to x/y', () => {
      const result = toPositioned([{ type: 'beginMarkedContent' }, item('Hi', 30, 700)]);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ str: 'Hi', x: 30, y: 700, width: 10 });
    });

    it('falls back to a default height for zero-height items', () => {
      const result = toPositioned([item(' ', 0, 100, 5, 0)]);
      expect(result[0].height).toBe(12);
    });
  });

  describe('groupIntoLines', () => {
    it('groups items on the same baseline and orders them left to right', () => {
      const positioned = toPositioned([item('world', 60, 700), item('Hello', 10, 701), item('Below', 10, 650)]);
      const lines = groupIntoLines(positioned);
      expect(lines).toHaveLength(2);
      expect(lines[0].map((i) => i.str)).toEqual(['Hello', 'world']);
      expect(lines[1][0].str).toBe('Below');
    });

    it('splits items whose y difference exceeds the tolerance', () => {
      const positioned = toPositioned([item('a', 0, 100), item('b', 0, 95)]);
      expect(groupIntoLines(positioned, 2)).toHaveLength(2);
    });
  });

  describe('joinLineText', () => {
    it('joins adjacent fragments without inserting a space', () => {
      const line = toPositioned([item('Hel', 0, 100, 15), item('lo', 15, 100, 10)]);
      expect(joinLineText(line)).toBe('Hello');
    });

    it('inserts a space across a horizontal gap', () => {
      const line = toPositioned([item('Hello', 0, 100, 25), item('world', 35, 100, 25)]);
      expect(joinLineText(line)).toBe('Hello world');
    });

    it('collapses repeated whitespace', () => {
      const line = toPositioned([item('a  b', 0, 100, 20), item(' c', 20, 100, 10)]);
      expect(joinLineText(line)).toBe('a b c');
    });
  });

  describe('linesToParagraphs', () => {
    it('merges close lines into one paragraph and splits on large gaps', () => {
      const lines = groupIntoLines(
        toPositioned([item('First line', 0, 700), item('second line.', 0, 688), item('New paragraph.', 0, 640)])
      );
      expect(linesToParagraphs(lines)).toEqual(['First line second line.', 'New paragraph.']);
    });

    it('skips blank lines', () => {
      const lines = groupIntoLines(toPositioned([item('Text', 0, 700), item('   ', 0, 688)]));
      expect(linesToParagraphs(lines)).toEqual(['Text']);
    });

    it('returns an empty array for no lines', () => {
      expect(linesToParagraphs([])).toEqual([]);
    });
  });

  describe('extractParagraphs', () => {
    it('converts raw page items into paragraph strings', () => {
      const paragraphs = extractParagraphs([
        item('Title', 200, 720),
        item('Body starts', 40, 680),
        item('here and', 100, 680),
        item('wraps down.', 40, 668),
      ]);
      expect(paragraphs).toEqual(['Title', 'Body starts here and wraps down.']);
    });

    it('returns an empty array for a page without text', () => {
      expect(extractParagraphs([{ type: 'beginMarkedContent' }])).toEqual([]);
    });
  });
});

describe('PdfToWord component', () => {
  it('renders the upload prompt', () => {
    render(<PdfToWord />);
    expect(screen.getByText('Drop PDF here or click to upload')).toBeInTheDocument();
  });

  it('disables conversion until a file is selected', () => {
    render(<PdfToWord />);
    expect(screen.getByRole('button', { name: /convert & download docx/i })).toBeDisabled();
  });
});

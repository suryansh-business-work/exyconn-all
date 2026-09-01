import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
}));

vi.mock('exceljs', () => ({
  Workbook: vi.fn(),
}));

vi.mock('../../shared/components/ToolLayout/ToolLayout', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../shared/components/PdfPreview', () => ({
  PdfPreview: () => <div data-testid="pdf-preview" />,
}));

import PdfToExcel from './index';
import { clusterRows, extractRows, rowToCells, toPositioned } from './utils';

const item = (str: string, x: number, y: number, width = str.length * 5, height = 10) => ({
  str,
  dir: 'ltr',
  transform: [1, 0, 0, 1, x, y],
  width,
  height,
  fontName: 'F1',
  hasEOL: false,
});

describe('pdf-to-excel utils', () => {
  describe('toPositioned', () => {
    it('keeps text items and maps transform to x/y', () => {
      const result = toPositioned([{ type: 'beginMarkedContent' }, item('Qty', 120, 500)]);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ str: 'Qty', x: 120, y: 500, width: 15 });
    });
  });

  describe('clusterRows', () => {
    it('groups items within the y tolerance into one row, ordered by x', () => {
      const rows = clusterRows(toPositioned([item('B', 100, 499), item('A', 10, 500), item('C', 10, 480)]));
      expect(rows).toHaveLength(2);
      expect(rows[0].map((i) => i.str)).toEqual(['A', 'B']);
      expect(rows[1][0].str).toBe('C');
    });

    it('orders rows top to bottom', () => {
      const rows = clusterRows(toPositioned([item('low', 0, 100), item('high', 0, 700)]));
      expect(rows.map((r) => r[0].str)).toEqual(['high', 'low']);
    });
  });

  describe('rowToCells', () => {
    it('splits into a new cell across a wide gap', () => {
      const row = toPositioned([item('Name', 10, 500, 20), item('Qty', 100, 500, 15)]);
      expect(rowToCells(row)).toEqual(['Name', 'Qty']);
    });

    it('merges close items into one cell with a space for small gaps', () => {
      const row = toPositioned([item('Unit', 10, 500, 20), item('price', 33, 500, 25)]);
      expect(rowToCells(row)).toEqual(['Unit price']);
    });

    it('merges contiguous fragments without a space', () => {
      const row = toPositioned([item('Tot', 10, 500, 15), item('al', 25, 500, 10)]);
      expect(rowToCells(row)).toEqual(['Total']);
    });

    it('returns an empty array for an empty row', () => {
      expect(rowToCells([])).toEqual([]);
    });
  });

  describe('extractRows', () => {
    it('turns page items into a 2x2 grid of cells', () => {
      const rows = extractRows([
        item('Name', 10, 500),
        item('Qty', 200, 500),
        item('Apple', 10, 480),
        item('3', 200, 480),
      ]);
      expect(rows).toEqual([
        ['Name', 'Qty'],
        ['Apple', '3'],
      ]);
    });

    it('drops rows whose cells are all empty', () => {
      expect(extractRows([item('   ', 10, 500), item('Data', 10, 480)])).toEqual([['Data']]);
    });

    it('returns an empty array for a page without text', () => {
      expect(extractRows([{ type: 'beginMarkedContent' }])).toEqual([]);
    });
  });
});

describe('PdfToExcel component', () => {
  it('renders the upload prompt', () => {
    render(<PdfToExcel />);
    expect(screen.getByText('Drop PDF here or click to upload')).toBeInTheDocument();
  });

  it('disables extraction until a file is selected', () => {
    render(<PdfToExcel />);
    expect(screen.getByRole('button', { name: /extract tables/i })).toBeDisabled();
  });
});

import { describe, expect, it, vi } from 'vitest';
import type { Content } from 'pdfmake/interfaces';
import type { Block, TableCell } from '../../../src/export/model';
import { GRID_LAYOUT, pdfTable } from '../../../src/export/pdf-table';
import { INK } from '../../../src/export/print';

const para = (text: string): Block => ({ kind: 'paragraph', inlines: [{ kind: 'text', text }] });
const cell = (text: string, extra: Partial<TableCell> = {}): TableCell => ({
  header: false,
  colSpan: 1,
  rowSpan: 1,
  blocks: [para(text)],
  ...extra,
});

describe('pdfTable', () => {
  it('renders every cell through the block renderer, filling header cells', () => {
    const renderBlocks = vi.fn((blocks: readonly Block[]): Content[] => [`${blocks.length} block`]);
    const result = pdfTable(
      [[cell('Plan', { header: true, colSpan: 2 })], [cell('a'), cell('b')]],
      renderBlocks,
    );
    expect(result).toEqual({
      table: {
        headerRows: 1,
        widths: ['*', '*'],
        body: [
          [
            { stack: ['1 block'], colSpan: 2, rowSpan: 1, bold: true, fillColor: INK.headerFill },
            {},
          ],
          [
            { stack: ['1 block'], colSpan: 1, rowSpan: 1, bold: false, fillColor: undefined },
            { stack: ['1 block'], colSpan: 1, rowSpan: 1, bold: false, fillColor: undefined },
          ],
        ],
      },
      layout: GRID_LAYOUT,
      margin: [0, 4, 0, 10],
    });
    expect(renderBlocks).toHaveBeenCalledTimes(3);
  });

  it('gives a table with no rows no columns', () => {
    expect(pdfTable([], () => [])).toMatchObject({
      table: { headerRows: 0, widths: [], body: [] },
    });
  });

  it('draws hairline borders in the border ink', () => {
    const node = { table: { body: [] } };
    expect(GRID_LAYOUT.hLineWidth?.(0, node)).toBe(0.5);
    expect(GRID_LAYOUT.vLineWidth?.(0, node)).toBe(0.5);
    expect(GRID_LAYOUT.hLineColor).toBeTypeOf('function');
    const hColor = GRID_LAYOUT.hLineColor as (...args: unknown[]) => string;
    const vColor = GRID_LAYOUT.vLineColor as (...args: unknown[]) => string;
    expect(hColor(0, node, 0)).toBe(INK.border);
    expect(vColor(0, node, 0)).toBe(INK.border);
  });
});

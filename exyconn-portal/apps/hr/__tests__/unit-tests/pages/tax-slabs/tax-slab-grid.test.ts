import { describe, expect, it } from 'vitest';
import {
  TAX_SLAB_COLUMNS,
  type PagedTaxSlabRow,
} from '../../../../src/pages/tax-slabs/tax-slab-grid';
import { actionKeys, columnIds, formatCell } from '../../harness/grid';

const band: PagedTaxSlabRow = {
  id: 'slab-2',
  regimeKey: 'NEW',
  financialYear: '2026-27',
  fromAmount: 400000,
  toAmount: 800000,
  ratePercent: 5,
  order: 1,
  active: true,
};

describe('TAX_SLAB_COLUMNS', () => {
  it('lays out the bands in the order they are walked, with edit and delete at the end', () => {
    expect(columnIds(TAX_SLAB_COLUMNS)).toEqual([
      'regimeKey',
      'financialYear',
      'order',
      'fromAmount',
      'toAmount',
      'ratePercent',
      'active',
      'actions',
    ]);
    expect(actionKeys(TAX_SLAB_COLUMNS)).toEqual(['edit', 'delete']);
  });

  it('writes the position, both bounds as money and the rate as a percentage', () => {
    expect(formatCell(TAX_SLAB_COLUMNS, 'order', band)).toBe('1');
    expect(formatCell(TAX_SLAB_COLUMNS, 'fromAmount', band)).toBe((400000).toLocaleString());
    expect(formatCell(TAX_SLAB_COLUMNS, 'toAmount', band)).toBe((800000).toLocaleString());
    expect(formatCell(TAX_SLAB_COLUMNS, 'ratePercent', band)).toBe('5%');
  });

  it('says the top band has no ceiling, whether the bound is null or absent', () => {
    expect(formatCell(TAX_SLAB_COLUMNS, 'toAmount', { ...band, toAmount: null })).toBe('and above');
    expect(formatCell(TAX_SLAB_COLUMNS, 'toAmount', { ...band, toAmount: undefined })).toBe(
      'and above',
    );
  });

  it('keeps a zero lower bound and a zero rate as figures', () => {
    const bottom = { ...band, fromAmount: 0, toAmount: 400000, ratePercent: 0, order: 0 };

    expect(formatCell(TAX_SLAB_COLUMNS, 'fromAmount', bottom)).toBe('0');
    expect(formatCell(TAX_SLAB_COLUMNS, 'ratePercent', bottom)).toBe('0%');
    expect(formatCell(TAX_SLAB_COLUMNS, 'order', bottom)).toBe('0');
  });
});

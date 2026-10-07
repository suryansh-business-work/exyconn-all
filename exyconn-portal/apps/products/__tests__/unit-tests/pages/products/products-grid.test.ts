import { describe, expect, it, vi } from 'vitest';
import {
  HISTORY_COLUMNS,
  PRODUCT_COLUMNS,
  stockLevel,
} from '../../../../src/pages/products/products-grid';
import { movementRow, productRow } from '../../fixtures';
import { actionSpecs, cellValue, columnIds, formatCell } from '../../grid-helpers';

describe('stockLevel', () => {
  it('is critical at or below the reorder level and healthy above it', () => {
    expect(stockLevel({ stock: 4, reorderLevel: 5 })).toBe('CRITICAL');
    expect(stockLevel({ stock: 5, reorderLevel: 5 })).toBe('CRITICAL');
    expect(stockLevel({ stock: 6, reorderLevel: 5 })).toBe('HEALTHY');
  });

  it('treats an empty shelf with no reorder level as critical', () => {
    expect(stockLevel({ stock: 0, reorderLevel: 0 })).toBe('CRITICAL');
  });
});

describe('PRODUCT_COLUMNS', () => {
  it('lists the catalogue columns, with the actions last', () => {
    expect(columnIds(PRODUCT_COLUMNS)).toEqual([
      'name',
      'sku',
      'category',
      'price',
      'stock',
      'reorderLevel',
      'stockLevel',
      'status',
      'actions',
    ]);
  });

  it('writes price, stock and reorder level as locale numbers', () => {
    const row = productRow({ price: 1234.5, stock: 12000, reorderLevel: 1500 });

    expect(formatCell(PRODUCT_COLUMNS, 'price', row)).toBe((1234.5).toLocaleString());
    expect(formatCell(PRODUCT_COLUMNS, 'stock', row)).toBe((12000).toLocaleString());
    expect(formatCell(PRODUCT_COLUMNS, 'reorderLevel', row)).toBe((1500).toLocaleString());
  });

  it('writes nothing while a row is still loading', () => {
    expect(formatCell(PRODUCT_COLUMNS, 'price', undefined)).toBe('');
  });

  it('derives the stock level chip from each row against its own reorder level', () => {
    expect(cellValue(PRODUCT_COLUMNS, 'stockLevel', productRow({ stock: 2 }))).toBe('CRITICAL');
    expect(cellValue(PRODUCT_COLUMNS, 'stockLevel', productRow({ stock: 50 }))).toBe('HEALTHY');
    expect(cellValue(PRODUCT_COLUMNS, 'stockLevel', undefined)).toBeNull();
  });

  it('offers edit, stock history and delete, in that order', () => {
    const specs = actionSpecs(PRODUCT_COLUMNS);

    expect(specs.map((spec) => spec.key)).toEqual(['edit', 'history', 'delete']);
    expect(specs[1]).toMatchObject({ label: 'stock history', color: 'info' });
  });
});

describe('HISTORY_COLUMNS', () => {
  it('lists when, why, how many, the level after and the reference', () => {
    expect(columnIds(HISTORY_COLUMNS)).toEqual([
      'createdAt',
      'reason',
      'quantity',
      'stockAfter',
      'reference',
    ]);
  });

  it('writes quantities as locale numbers', () => {
    const row = movementRow({ quantity: 1200, stockAfter: 1240 });

    expect(formatCell(HISTORY_COLUMNS, 'quantity', row)).toBe((1200).toLocaleString());
    expect(formatCell(HISTORY_COLUMNS, 'stockAfter', row)).toBe((1240).toLocaleString());
  });

  it('dates a movement through the viewer settings, and leaves an undated one blank', () => {
    const formatDate = vi.fn(() => '04 Mar 2026');
    const row = movementRow();

    expect(
      formatCell(HISTORY_COLUMNS, 'createdAt', row, {
        value: row.createdAt,
        context: { formatDate },
      }),
    ).toBe('04 Mar 2026');
    expect(formatDate).toHaveBeenCalledWith(row.createdAt);
    expect(
      formatCell(HISTORY_COLUMNS, 'createdAt', row, { value: '', context: { formatDate } }),
    ).toBe('');
  });
});

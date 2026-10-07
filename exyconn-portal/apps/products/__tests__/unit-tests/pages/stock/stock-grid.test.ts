import { describe, expect, it, vi } from 'vitest';
import { MOVEMENT_COLUMNS } from '../../../../src/pages/stock/stock-grid';
import { movementRow } from '../../fixtures';
import { columnIds, formatCell } from '../../grid-helpers';

describe('MOVEMENT_COLUMNS', () => {
  it('lists the movement log columns and offers no row actions', () => {
    expect(columnIds(MOVEMENT_COLUMNS)).toEqual([
      'createdAt',
      'productName',
      'reason',
      'quantity',
      'stockAfter',
      'supplierName',
      'reference',
    ]);
    expect(MOVEMENT_COLUMNS.some((column) => column.colId === 'actions')).toBe(false);
  });

  it('dates each movement through the viewer settings', () => {
    const formatDate = vi.fn(() => '04 Mar 2026');
    const row = movementRow();

    expect(
      formatCell(MOVEMENT_COLUMNS, 'createdAt', row, {
        value: row.createdAt,
        context: { formatDate },
      }),
    ).toBe('04 Mar 2026');
  });
});

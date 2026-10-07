import { describe, expect, it } from 'vitest';
import { SHIFT_COLUMNS, type PagedShiftRow } from '../../../../src/pages/shifts/shift-grid';
import { actionKeys, columnIds, formatCell } from '../../harness/grid';

const row: PagedShiftRow = {
  id: 'shift-1',
  name: 'Morning',
  code: 'AM',
  startTime: '09:00',
  endTime: '18:00',
  breakMinutes: 60,
  graceMinutes: 15,
  active: true,
};

describe('SHIFT_COLUMNS', () => {
  it('lays out the register with edit and delete at the end', () => {
    expect(columnIds(SHIFT_COLUMNS)).toEqual([
      'name',
      'code',
      'startTime',
      'endTime',
      'graceMinutes',
      'active',
      'actions',
    ]);
    expect(actionKeys(SHIFT_COLUMNS)).toEqual(['edit', 'delete']);
  });

  it('shows the grace period, a zero included, and a dash when there is none', () => {
    expect(formatCell(SHIFT_COLUMNS, 'graceMinutes', row)).toBe('15');
    expect(formatCell(SHIFT_COLUMNS, 'graceMinutes', { ...row, graceMinutes: 0 })).toBe('0');
    expect(formatCell(SHIFT_COLUMNS, 'graceMinutes', { ...row, graceMinutes: null } as never)).toBe(
      '—',
    );
  });

  it('writes nothing while the row is still loading', () => {
    expect(formatCell(SHIFT_COLUMNS, 'graceMinutes', undefined)).toBe('');
  });
});

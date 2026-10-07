import { describe, expect, it } from 'vitest';
import {
  EXIT_RECORD_COLUMNS,
  type PagedExitRecordRow,
} from '../../../../src/pages/exits/exit-record-grid';
import { actionKeys, columnIds, formatCell } from '../../harness/grid';

const exit = (daysToLastWorkingDay: number | null) =>
  ({ id: 'exit-1', employeeId: 'user-1', daysToLastWorkingDay }) as PagedExitRecordRow;

describe('EXIT_RECORD_COLUMNS', () => {
  it('lays out the exits register with edit and delete at the end', () => {
    expect(columnIds(EXIT_RECORD_COLUMNS)).toEqual([
      'employeeName',
      'stage',
      'resignationDate',
      'lastWorkingDate',
      'daysToLastWorkingDay',
      'documentsIssued',
      'actions',
    ]);
    expect(actionKeys(EXIT_RECORD_COLUMNS)).toEqual(['edit', 'delete']);
  });

  it('counts the days left, including a last day that is today', () => {
    expect(formatCell(EXIT_RECORD_COLUMNS, 'daysToLastWorkingDay', exit(12))).toBe('12');
    expect(formatCell(EXIT_RECORD_COLUMNS, 'daysToLastWorkingDay', exit(0))).toBe('0');
  });

  it('shows a dash when there is no last working day to count to', () => {
    expect(formatCell(EXIT_RECORD_COLUMNS, 'daysToLastWorkingDay', exit(null))).toBe('—');
  });
});

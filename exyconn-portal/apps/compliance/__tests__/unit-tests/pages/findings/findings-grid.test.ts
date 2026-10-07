import { describe, expect, it } from 'vitest';
import { FINDING_COLUMNS } from '../../../../src/pages/findings/findings-grid';
import { findingRow } from '../compliance.fixtures';
import { columnOf, formatCell, headersOf } from '../grid.helpers';

describe('FINDING_COLUMNS', () => {
  it('keeps the corrective action beside the finding it answers', () => {
    expect(headersOf(FINDING_COLUMNS)).toEqual([
      'Ref',
      'Finding',
      'Type',
      'Raised by',
      'Clause',
      'Owner',
      'Raised',
      'Due',
      'Status',
      'Effective',
      '',
    ]);
  });

  it('formats the raised and due dates, with a dash when nothing is due', () => {
    const raised = '2026-10-05T00:00:00.000Z';
    expect(formatCell(FINDING_COLUMNS, 'raisedOn', findingRow(), raised)).toBe(`on ${raised}`);
    expect(formatCell(FINDING_COLUMNS, 'dueOn', findingRow(), null)).toBe('—');
  });

  it('shows whether the action worked as a flag, not free text', () => {
    expect(columnOf(FINDING_COLUMNS, 'effective')).toMatchObject({ filter: false });
    expect(columnOf(FINDING_COLUMNS, 'effective').cellRenderer).toBeDefined();
  });
});

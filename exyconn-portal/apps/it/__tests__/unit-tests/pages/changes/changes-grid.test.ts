import { describe, expect, it } from 'vitest';
import { ItChangeStatus } from '@exyconn/shell/graphql/generated';
import { CHANGE_COLUMNS } from '../../../../src/pages/changes/changes-grid';
import { changeRow } from '../../core/rows.fixtures';
import { formatCell, headersOf, visibleActions } from '../../core/grid.helpers';

describe('CHANGE_COLUMNS', () => {
  it('reads the change, its system, type, risk, environment, window, status and decider', () => {
    expect(headersOf(CHANGE_COLUMNS)).toEqual([
      'Change',
      'System',
      'Type',
      'Risk',
      'Environment',
      'Starts',
      'Status',
      'Decided by',
      '',
    ]);
    expect(formatCell(CHANGE_COLUMNS, 'plannedStart', changeRow(), '2026-10-10')).toBe(
      'on 2026-10-10',
    );
  });

  it('offers approve or reject only while a change awaits approval', () => {
    const pending = changeRow({ status: ItChangeStatus.PendingApproval });
    expect(visibleActions(CHANGE_COLUMNS, pending)).toEqual(['decide', 'edit', 'delete']);
    const scheduled = changeRow({ status: ItChangeStatus.Scheduled });
    expect(visibleActions(CHANGE_COLUMNS, scheduled)).toEqual(['edit', 'delete']);
  });
});

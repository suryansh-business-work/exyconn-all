import { describe, expect, it } from 'vitest';
import { GOAL_COLUMNS, type PagedGoalRow } from '../../../../src/pages/goals/goal-grid';
import { actionKeys, columnIds, formatCell } from '../../harness/grid';

const goal = (patch: Partial<PagedGoalRow>) =>
  ({ id: 'goal-1', employeeId: 'user-1', weightage: 30, progress: 50, ...patch }) as PagedGoalRow;

describe('GOAL_COLUMNS', () => {
  it('lays out the goals register with edit and delete at the end', () => {
    expect(columnIds(GOAL_COLUMNS)).toEqual([
      'employeeName',
      'title',
      'kpi',
      'weightage',
      'progress',
      'status',
      'endDate',
      'actions',
    ]);
    expect(actionKeys(GOAL_COLUMNS)).toEqual(['edit', 'delete']);
  });

  it('shows weight and progress as numbers, zero included', () => {
    expect(formatCell(GOAL_COLUMNS, 'weightage', goal({}))).toBe('30');
    expect(formatCell(GOAL_COLUMNS, 'progress', goal({ progress: 0 }))).toBe('0');
  });

  it('shows a dash for a weight or progress the server left out', () => {
    const missing = goal({ weightage: null, progress: undefined } as never);

    expect(formatCell(GOAL_COLUMNS, 'weightage', missing)).toBe('—');
    expect(formatCell(GOAL_COLUMNS, 'progress', missing)).toBe('—');
  });
});

import { describe, expect, it } from 'vitest';
import {
  TRAINING_COLUMNS,
  type PagedTrainingRow,
} from '../../../../src/pages/training/training-grid';
import { TrainingStatus } from '@exyconn/shell/graphql/generated';
import { actionKeys, columnIds, formatCell } from '../../harness/grid';

describe('TRAINING_COLUMNS', () => {
  it('lays out the register with edit and delete at the end', () => {
    expect(columnIds(TRAINING_COLUMNS)).toEqual([
      'employeeName',
      'title',
      'category',
      'status',
      'dueOn',
      'actions',
    ]);
    expect(actionKeys(TRAINING_COLUMNS)).toEqual(['edit', 'delete']);
  });

  it('names the employee through the grid context rather than showing the id', () => {
    const row: PagedTrainingRow = {
      id: 'training-1',
      employeeId: 'user-1',
      title: 'First aid',
      provider: 'Red Cross',
      category: 'Safety',
      assignedOn: '2026-09-01T00:00:00.000Z',
      status: TrainingStatus.Assigned,
    };
    const nameOf = (id: string) => (id === 'user-1' ? 'Asha Rao' : id);

    expect(formatCell(TRAINING_COLUMNS, 'employeeName', row, { nameOf })).toBe('Asha Rao');
  });
});

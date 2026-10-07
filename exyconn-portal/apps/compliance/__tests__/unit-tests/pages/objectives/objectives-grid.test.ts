import { describe, expect, it } from 'vitest';
import { OBJECTIVE_COLUMNS } from '../../../../src/pages/objectives/objectives-grid';
import { objectiveRow } from '../compliance.fixtures';
import { formatCell, headersOf } from '../grid.helpers';

describe('OBJECTIVE_COLUMNS', () => {
  it('puts the three numbers beside what the objective is', () => {
    expect(headersOf(OBJECTIVE_COLUMNS)).toEqual([
      'Objective',
      'Measured by',
      'Category',
      'Owner',
      'Baseline → target',
      'Now',
      'Achieved',
      'Status',
      'Period ends',
      '',
    ]);
  });

  it('writes the baseline, target and current value with their unit', () => {
    const row = objectiveRow();
    expect(formatCell(OBJECTIVE_COLUMNS, 'progress', row)).toBe('20 → 10 per 1k');
    expect(formatCell(OBJECTIVE_COLUMNS, 'actual', row)).toBe('15 per 1k');
    expect(formatCell(OBJECTIVE_COLUMNS, 'achievementPercent', row)).toBe('50%');
  });

  it('drops the trailing space when the measure has no unit', () => {
    const row = objectiveRow({ unit: '' });
    expect(formatCell(OBJECTIVE_COLUMNS, 'progress', row)).toBe('20 → 10');
    expect(formatCell(OBJECTIVE_COLUMNS, 'actual', row)).toBe('15');
  });

  it('leaves the cells empty while a row is still loading', () => {
    expect(formatCell(OBJECTIVE_COLUMNS, 'progress', undefined)).toBe('');
    expect(formatCell(OBJECTIVE_COLUMNS, 'actual', undefined)).toBe('');
    expect(formatCell(OBJECTIVE_COLUMNS, 'achievementPercent', undefined)).toBe('');
  });

  it('formats the end of the period through the viewer settings', () => {
    const end = '2026-12-31T00:00:00.000Z';
    expect(formatCell(OBJECTIVE_COLUMNS, 'periodEnd', objectiveRow(), end)).toBe(`on ${end}`);
    expect(formatCell(OBJECTIVE_COLUMNS, 'periodEnd', objectiveRow(), '')).toBe('');
  });
});

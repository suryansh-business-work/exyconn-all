import { describe, expect, it } from 'vitest';
import { GRADE_COLUMNS, type PagedGradeRow } from '../../../../src/pages/grades/grade-grid';
import { actionKeys, columnIds, formatCell } from '../../harness/grid';

describe('GRADE_COLUMNS', () => {
  it('lays out the grades register with edit and delete at the end', () => {
    expect(columnIds(GRADE_COLUMNS)).toEqual([
      'name',
      'code',
      'level',
      'minSalary',
      'maxSalary',
      'active',
      'actions',
    ]);
    expect(actionKeys(GRADE_COLUMNS)).toEqual(['edit', 'delete']);
  });

  it('shows the level and salary band as numbers', () => {
    const grade = { id: 'g-1', level: 0, minSalary: 500000, maxSalary: 900000 } as PagedGradeRow;

    expect(formatCell(GRADE_COLUMNS, 'level', grade)).toBe('0');
    expect(formatCell(GRADE_COLUMNS, 'minSalary', grade)).toBe('500000');
    expect(formatCell(GRADE_COLUMNS, 'maxSalary', grade)).toBe('900000');
  });

  it('shows a dash for a band the server left out', () => {
    const blank = { id: 'g-2', level: null, minSalary: null, maxSalary: null } as never;

    expect(formatCell(GRADE_COLUMNS, 'level', blank)).toBe('—');
    expect(formatCell(GRADE_COLUMNS, 'minSalary', blank)).toBe('—');
    expect(formatCell(GRADE_COLUMNS, 'maxSalary', blank)).toBe('—');
  });
});

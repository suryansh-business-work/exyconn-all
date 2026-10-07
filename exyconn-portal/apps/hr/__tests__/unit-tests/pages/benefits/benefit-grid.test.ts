import { describe, expect, it } from 'vitest';
import { BENEFIT_COLUMNS, type PagedBenefitRow } from '../../../../src/pages/benefits/benefit-grid';
import { actionKeys, columnIds, formatCell } from '../../harness/grid';

describe('BENEFIT_COLUMNS', () => {
  it('lays out the register with edit and delete at the end', () => {
    expect(columnIds(BENEFIT_COLUMNS)).toEqual([
      'employeeName',
      'name',
      'kind',
      'provider',
      'validTo',
      'actions',
    ]);
    expect(actionKeys(BENEFIT_COLUMNS)).toEqual(['edit', 'delete']);
  });

  it('names the employee through the grid context rather than showing the id', () => {
    const row = { id: 'row-1', employeeId: 'user-1' } as PagedBenefitRow;
    const nameOf = (id: string) => (id === 'user-1' ? 'Asha Rao' : id);

    expect(formatCell(BENEFIT_COLUMNS, 'employeeName', row, { nameOf })).toBe('Asha Rao');
  });
});

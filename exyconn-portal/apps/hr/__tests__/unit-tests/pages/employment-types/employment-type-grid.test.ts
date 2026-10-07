import { describe, expect, it } from 'vitest';
import { EMPLOYMENT_TYPE_COLUMNS } from '../../../../src/pages/employment-types/employment-type-grid';
import { actionKeys, columnIds } from '../../harness/grid';

describe('EMPLOYMENT_TYPE_COLUMNS', () => {
  it('lays out the register with edit and delete at the end', () => {
    expect(columnIds(EMPLOYMENT_TYPE_COLUMNS)).toEqual([
      'name',
      'code',
      'payrollEligible',
      'active',
      'actions',
    ]);
    expect(actionKeys(EMPLOYMENT_TYPE_COLUMNS)).toEqual(['edit', 'delete']);
  });
});

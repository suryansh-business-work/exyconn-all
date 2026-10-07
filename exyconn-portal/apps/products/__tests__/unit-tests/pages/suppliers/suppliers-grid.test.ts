import { describe, expect, it } from 'vitest';
import { SUPPLIER_COLUMNS } from '../../../../src/pages/suppliers/suppliers-grid';
import { actionSpecs, columnIds } from '../../grid-helpers';

describe('SUPPLIER_COLUMNS', () => {
  it('lists who the supplier is and how to reach them, with the actions last', () => {
    expect(columnIds(SUPPLIER_COLUMNS)).toEqual([
      'code',
      'name',
      'contactName',
      'email',
      'phone',
      'status',
      'actions',
    ]);
  });

  it('offers the standard edit and delete actions', () => {
    expect(actionSpecs(SUPPLIER_COLUMNS).map((spec) => spec.key)).toEqual(['edit', 'delete']);
  });
});

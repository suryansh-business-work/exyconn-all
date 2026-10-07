import { describe, expect, it } from 'vitest';
import { LEAD_COLUMNS } from '../../../../src/pages/crm/leads-grid';
import { leadRow } from '../../fixtures';
import { actionSpecs, columnIds, formatCell, isActionHidden } from '../../grid-helpers';

describe('LEAD_COLUMNS', () => {
  it('lists the lead register columns, with the actions last', () => {
    expect(columnIds(LEAD_COLUMNS)).toEqual([
      'name',
      'email',
      'source',
      'value',
      'stage',
      'actions',
    ]);
  });

  it('writes the value with digit grouping', () => {
    const row = leadRow({ value: 1250000 });

    expect(formatCell(LEAD_COLUMNS, 'value', row)).toBe((1250000).toLocaleString());
  });

  it('offers convert, edit and delete, in that order', () => {
    expect(actionSpecs(LEAD_COLUMNS).map((spec) => spec.key)).toEqual([
      'convert',
      'edit',
      'delete',
    ]);
  });

  it('offers conversion only until the lead has become a deal', () => {
    expect(isActionHidden(LEAD_COLUMNS, 'convert', leadRow({ convertedDealId: null }))).toBe(false);
    expect(isActionHidden(LEAD_COLUMNS, 'convert', leadRow({ convertedDealId: 'deal-9' }))).toBe(
      true,
    );
  });
});

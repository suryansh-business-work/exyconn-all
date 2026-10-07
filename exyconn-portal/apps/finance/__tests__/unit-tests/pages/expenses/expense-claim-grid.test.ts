import { describe, expect, it } from 'vitest';
import { EXPENSE_CLAIM_COLUMNS } from '../../../../src/pages/expenses/expense-claim-grid';
import { claimRow } from '../../fixtures';
import { actionSpecs, columnIds, formatCell } from '../../grid-helpers';

describe('EXPENSE_CLAIM_COLUMNS', () => {
  it('lists the claim columns, with the actions last', () => {
    expect(columnIds(EXPENSE_CLAIM_COLUMNS)).toEqual([
      'category',
      'description',
      'amount',
      'approvedAmount',
      'status',
      'incurredOn',
      'actions',
    ]);
  });

  it('shows the amount claimed, or a dash when there is none', () => {
    expect(formatCell(EXPENSE_CLAIM_COLUMNS, 'amount', claimRow({ amount: 450 }))).toBe('450');
    expect(
      formatCell(EXPENSE_CLAIM_COLUMNS, 'amount', claimRow({ amount: null as unknown as number })),
    ).toBe('—');
  });

  it('shows the approved amount once finance decides, a dash before', () => {
    const approved = (approvedAmount: number | null | undefined) =>
      formatCell(EXPENSE_CLAIM_COLUMNS, 'approvedAmount', claimRow({ approvedAmount }));

    expect(approved(null)).toBe('—');
    expect(approved(undefined)).toBe('—');
    expect(approved(0)).toBe('0');
    expect(approved(800)).toBe('800');
  });

  it('offers approve, reject, mark paid, edit and delete, in that order', () => {
    expect(actionSpecs(EXPENSE_CLAIM_COLUMNS).map((spec) => [spec.key, spec.color])).toEqual([
      ['approve', 'success'],
      ['reject', 'error'],
      ['pay', 'primary'],
      ['edit', undefined],
      ['delete', undefined],
    ]);
  });
});

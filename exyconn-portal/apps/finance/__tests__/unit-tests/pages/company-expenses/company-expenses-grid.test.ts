import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExpenseState } from '@exyconn/shell/graphql/generated';
import { companyExpenseColumns } from '../../../../src/pages/company-expenses/company-expenses-grid';
import { companyExpenseRow } from '../../fixtures';
import { actionSpecs, columnIds, formatCell, isActionHidden } from '../../grid-helpers';

const formatDate = (value: string) => `on ${value}`;
const columns = companyExpenseColumns(formatDate);

describe('companyExpenseColumns', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-20T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('lists the bill register columns, with the actions last', () => {
    expect(columnIds(columns)).toEqual([
      'vendor',
      'category',
      'amount',
      'incurredOn',
      'dueDate',
      'status',
      'actions',
    ]);
  });

  it('writes the amount in the bill currency', () => {
    expect(formatCell(columns, 'amount', companyExpenseRow({ amount: 640, currency: 'EUR' }))).toBe(
      'EUR 640',
    );
  });

  it('says how many days late an unpaid bill is', () => {
    const row = companyExpenseRow({ dueDate: '2026-09-15' });

    expect(formatCell(columns, 'dueDate', row)).toBe('on 2026-09-15 · 5d late');
  });

  it('shows the due date plainly while a bill is not late yet', () => {
    expect(formatCell(columns, 'dueDate', companyExpenseRow({ dueDate: '2026-09-30' }))).toBe(
      'on 2026-09-30',
    );
    expect(formatCell(columns, 'dueDate', companyExpenseRow({ dueDate: '2026-09-20' }))).toBe(
      'on 2026-09-20',
    );
  });

  it('never calls a settled bill late', () => {
    const row = companyExpenseRow({ dueDate: '2026-01-01', status: ExpenseState.Paid });

    expect(formatCell(columns, 'dueDate', row)).toBe('on 2026-01-01');
  });

  it('offers mark paid first, and only on a bill still unpaid', () => {
    expect(actionSpecs(columns).map((spec) => spec.key)).toEqual(['settle', 'edit', 'delete']);
    expect(isActionHidden(columns, 'settle', companyExpenseRow())).toBe(false);
    expect(
      isActionHidden(columns, 'settle', companyExpenseRow({ status: ExpenseState.Paid })),
    ).toBe(true);
  });
});

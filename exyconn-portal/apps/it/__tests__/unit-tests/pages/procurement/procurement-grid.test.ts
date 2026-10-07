import { describe, expect, it } from 'vitest';
import { ItPurchaseStatus } from '@exyconn/shell/graphql/generated';
import { PROCUREMENT_COLUMNS, bestPrice } from '../../../../src/pages/procurement/procurement-grid';
import { purchaseRow } from '../page-kit/fixtures';
import { actionSpecs, columnIds, formatCell, isActionHidden } from '../page-kit/grid';

const quote = (id: string, amount: number) => ({
  __typename: 'ItPurchaseQuote' as const,
  id,
  vendor: `Vendor ${id}`,
  amount,
  notes: '',
});

describe('PROCUREMENT_COLUMNS', () => {
  it('lists the procurement columns, with the actions last', () => {
    expect(columnIds(PROCUREMENT_COLUMNS)).toEqual([
      'title',
      'kind',
      'quantity',
      'bestPrice',
      'quotes',
      'status',
      'createdAt',
      'actions',
    ]);
  });

  it('writes the quantity, the best price and how many quotes there are', () => {
    const row = purchaseRow({ quantity: 3, quotes: [quote('a', 2400), quote('b', 1900)] });

    expect(formatCell(PROCUREMENT_COLUMNS, 'quantity', row)).toBe('3');
    expect(formatCell(PROCUREMENT_COLUMNS, 'bestPrice', row)).toBe((1900).toLocaleString());
    expect(formatCell(PROCUREMENT_COLUMNS, 'quotes', row)).toBe('2');
  });

  it('prices an unquoted request by its estimate', () => {
    const row = purchaseRow({ estimatedCost: 3000 });

    expect(bestPrice(row)).toBe(3000);
    expect(formatCell(PROCUREMENT_COLUMNS, 'bestPrice', row)).toBe((3000).toLocaleString());
  });

  it('offers decide, edit and delete', () => {
    expect(actionSpecs(PROCUREMENT_COLUMNS).map((spec) => spec.key)).toEqual([
      'decide',
      'edit',
      'delete',
    ]);
  });

  it('lets a request be decided only while it is requested or quoted', () => {
    const hidden = (status: ItPurchaseStatus) =>
      isActionHidden(PROCUREMENT_COLUMNS, 'decide', purchaseRow({ status }));

    expect(hidden(ItPurchaseStatus.Requested)).toBe(false);
    expect(hidden(ItPurchaseStatus.Quoted)).toBe(false);
    expect(hidden(ItPurchaseStatus.Approved)).toBe(true);
    expect(hidden(ItPurchaseStatus.Ordered)).toBe(true);
    expect(hidden(ItPurchaseStatus.Rejected)).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { ItPurchaseKind, ItPurchaseStatus } from '@exyconn/shell/graphql/generated';
import {
  purchaseRequestSchema,
  purchaseStatusOptions,
  toPurchaseRequestValues,
} from '../../../../../../src/pages/procurement/forms/purchase-request';
import { purchaseRow } from '../../../page-kit/fixtures';

const valid = {
  ...toPurchaseRequestValues(null),
  title: 'Laptops',
  justification: 'Two new joiners next month',
};
const quote = { vendor: 'Dell', amount: 1200, notes: '' };

function firstError(value: unknown): string | null {
  const result = purchaseRequestSchema.safeParse(value);
  return result.success ? null : (result.error.issues[0]?.message ?? 'invalid');
}

describe('purchaseRequestSchema', () => {
  it('accepts a complete request and coerces typed numbers', () => {
    const parsed = purchaseRequestSchema.parse({
      ...valid,
      quantity: '2',
      estimatedCost: '2500',
      quotes: [{ ...quote, amount: '1100' }],
    });
    expect(parsed).toMatchObject({ quantity: 2, estimatedCost: 2500, quotes: [{ amount: 1100 }] });
  });

  it('wants a title and a reason of a useful length', () => {
    expect(firstError({ ...valid, title: 'PC' })).toBe('Say what is being bought');
    expect(firstError({ ...valid, title: 'x'.repeat(161) })).toBe('Too long');
    expect(firstError({ ...valid, justification: 'Need it' })).toBe('Say why it is needed');
    expect(firstError({ ...valid, justification: 'x'.repeat(2001) })).toBe('Too long');
  });

  it('wants a whole quantity of at least one and a cost that is not negative', () => {
    expect(firstError({ ...valid, quantity: 0 })).toBe('At least one');
    expect(firstError({ ...valid, quantity: 1.5 })).toBe('Whole numbers only');
    expect(firstError({ ...valid, quantity: 'two' })).toBe('Quantity must be a number');
    expect(firstError({ ...valid, estimatedCost: -5 })).toBe('Cost cannot be negative');
    expect(firstError({ ...valid, estimatedCost: 'lots' })).toBe('Cost must be a number');
  });

  it('checks every quote', () => {
    expect(firstError({ ...valid, quotes: [{ ...quote, vendor: ' ' }] })).toBe(
      'Vendor is required',
    );
    expect(firstError({ ...valid, quotes: [{ ...quote, amount: -1 }] })).toBe('Cannot be negative');
    expect(firstError({ ...valid, quotes: [{ ...quote, amount: 'x' }] })).toBe(
      'Amount must be a number',
    );
    expect(firstError({ ...valid, quotes: [{ ...quote, notes: 'n'.repeat(301) }] })).toBe(
      'Too long',
    );
  });

  it('accepts quoted once there is a quote', () => {
    expect(firstError({ ...valid, status: ItPurchaseStatus.Quoted, quotes: [quote] })).toBeNull();
  });

  it('needs the supplier order reference once ordered', () => {
    const result = purchaseRequestSchema.safeParse({ ...valid, status: ItPurchaseStatus.Ordered });
    expect(result.error?.issues[0]).toMatchObject({
      message: "Add the supplier's order reference",
      path: ['orderReference'],
    });
    expect(
      firstError({ ...valid, status: ItPurchaseStatus.Ordered, orderReference: 'PO-77' }),
    ).toBeNull();
  });
});

describe('purchaseStatusOptions', () => {
  it('never offers approved or rejected to a new request', () => {
    expect(purchaseStatusOptions(null)).toEqual([
      ItPurchaseStatus.Cancelled,
      ItPurchaseStatus.Ordered,
      ItPurchaseStatus.Quoted,
      ItPurchaseStatus.Received,
      ItPurchaseStatus.Requested,
    ]);
  });

  it('keeps a rejected request showing as rejected', () => {
    const options = purchaseStatusOptions(ItPurchaseStatus.Rejected);
    expect(options).toContain(ItPurchaseStatus.Rejected);
    expect(options).not.toContain(ItPurchaseStatus.Approved);
  });
});

describe('toPurchaseRequestValues', () => {
  it('starts a new request as one requested piece of hardware', () => {
    expect(toPurchaseRequestValues(null)).toEqual({
      title: '',
      kind: ItPurchaseKind.Hardware,
      quantity: 1,
      estimatedCost: 0,
      requestedForName: '',
      justification: '',
      quotes: [],
      status: ItPurchaseStatus.Requested,
      orderReference: '',
    });
  });

  it('copies a request, keeping only the editable part of each quote', () => {
    const row = purchaseRow({
      kind: ItPurchaseKind.Software,
      requestedForName: 'Design team',
      status: ItPurchaseStatus.Quoted,
      orderReference: 'PO-1',
      quotes: [
        { __typename: 'ItPurchaseQuote', id: 'q1', vendor: 'Adobe', amount: 900, notes: 'Annual' },
      ],
    });
    expect(toPurchaseRequestValues(row)).toEqual({
      title: 'Laptops',
      kind: ItPurchaseKind.Software,
      quantity: 2,
      estimatedCost: 3000,
      requestedForName: 'Design team',
      justification: 'Two new joiners next month',
      quotes: [{ vendor: 'Adobe', amount: 900, notes: 'Annual' }],
      status: ItPurchaseStatus.Quoted,
      orderReference: 'PO-1',
    });
  });
});

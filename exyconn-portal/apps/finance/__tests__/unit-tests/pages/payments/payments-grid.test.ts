import { describe, expect, it } from 'vitest';
import { PAYMENT_COLUMNS } from '../../../../src/pages/payments/payments-grid';
import { paymentRow } from '../../fixtures';
import { columnIds, formatCell } from '../../grid-helpers';

describe('PAYMENT_COLUMNS', () => {
  it('lists the ledger columns with no actions, since history is never edited', () => {
    expect(columnIds(PAYMENT_COLUMNS)).toEqual([
      'receivedAt',
      'invoiceNumber',
      'amount',
      'method',
      'reference',
      'recordedBy',
    ]);
  });

  it('writes a receipt as its amount in the payment currency', () => {
    expect(
      formatCell(PAYMENT_COLUMNS, 'amount', paymentRow({ amount: 750, currency: 'USD' })),
    ).toBe('USD 750');
  });

  it('reads a negative receipt as a refund rather than a smaller payment', () => {
    expect(formatCell(PAYMENT_COLUMNS, 'amount', paymentRow({ amount: -250 }))).toBe(
      '− INR 250 (refund)',
    );
  });

  it('formats a received date through the viewer settings', () => {
    const context = { formatDate: (value: string) => `on ${value}` };

    expect(
      formatCell(PAYMENT_COLUMNS, 'receivedAt', paymentRow(), { value: '2026-09-02', context }),
    ).toBe('on 2026-09-02');
  });
});

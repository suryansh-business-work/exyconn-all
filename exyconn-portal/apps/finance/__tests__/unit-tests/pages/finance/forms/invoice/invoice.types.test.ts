import { describe, expect, it } from 'vitest';
import { InvoiceStatus } from '@exyconn/shell/graphql/generated';
import { lineAmount, linesTotal } from '../../../../../../src/pages/finance/forms/invoice';
import { invoiceStatusOptions } from '../../../../../../src/pages/finance/forms/invoice/invoice.types';

const line = (quantity: number, rate: number, taxPercent: number) => ({
  description: 'Work',
  quantity,
  rate,
  taxPercent,
  hsnSac: '',
});

describe('invoiceStatusOptions', () => {
  const values = (current: InvoiceStatus | null) =>
    invoiceStatusOptions(current).map((option) => option.value);

  it('offers only draft and sent for a new invoice', () => {
    expect(invoiceStatusOptions(null)).toEqual([
      { value: 'DRAFT', label: 'Draft' },
      { value: 'SENT', label: 'Sent' },
    ]);
  });

  it('does not repeat a status a person can already choose', () => {
    expect(values(InvoiceStatus.Sent)).toEqual(['DRAFT', 'SENT']);
    expect(values(InvoiceStatus.Draft)).toEqual(['DRAFT', 'SENT']);
  });

  it('keeps a status the server set, so editing cannot reset it', () => {
    expect(invoiceStatusOptions(InvoiceStatus.PartiallyPaid)).toEqual([
      { value: 'DRAFT', label: 'Draft' },
      { value: 'SENT', label: 'Sent' },
      { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
    ]);
    expect(values(InvoiceStatus.Overdue)).toEqual(['DRAFT', 'SENT', 'OVERDUE']);
  });
});

describe('lineAmount', () => {
  it('bills quantity times rate with the tax on top', () => {
    expect(lineAmount(line(2, 500, 18))).toBe(1180);
  });

  it('rounds to the paisa', () => {
    expect(lineAmount(line(1, 10.005, 0))).toBe(10.01);
    expect(lineAmount(line(3, 33.33, 5))).toBe(104.99);
  });

  it('bills nothing for a zero quantity', () => {
    expect(lineAmount(line(0, 900, 18))).toBe(0);
  });
});

describe('linesTotal', () => {
  it('adds the lines, each with its own tax', () => {
    expect(linesTotal([line(1, 1000, 18), line(2, 250, 0)])).toBe(1680);
  });

  it('is zero with no lines', () => {
    expect(linesTotal([])).toBe(0);
  });
});

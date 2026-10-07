import { describe, expect, it } from 'vitest';
import { INVOICE_COLUMNS } from '../../../../src/pages/finance/invoices-grid';
import {
  RECURRING_INVOICE_COLUMNS,
  type RecurringInvoiceRow,
} from '../../../../src/pages/finance/recurring-invoices-grid';
import { invoiceRow, recurringRow } from '../../fixtures';
import { actionSpecs, cellValue, columnIds, formatCell } from '../../grid-helpers';

const formatDate = (value: string) => `on ${value}`;

describe('INVOICE_COLUMNS', () => {
  it('lists the invoice columns, with the actions last', () => {
    expect(columnIds(INVOICE_COLUMNS)).toEqual([
      'number',
      'clientName',
      'amount',
      'amountPaid',
      'balanceDue',
      'status',
      'dueDate',
      'sentAt',
      'actions',
    ]);
  });

  it('names the client, or shows its id for an invoice written before names were stored', () => {
    expect(formatCell(INVOICE_COLUMNS, 'clientName', invoiceRow())).toBe('Nimbus Ltd');
    expect(formatCell(INVOICE_COLUMNS, 'clientName', invoiceRow({ clientName: '' }))).toBe(
      'client-1',
    );
  });

  it('writes each amount in the invoice currency', () => {
    const row = invoiceRow({ amount: 900, amountPaid: 250, balanceDue: 650, currency: 'USD' });

    expect(formatCell(INVOICE_COLUMNS, 'amount', row)).toBe('USD 900');
    expect(formatCell(INVOICE_COLUMNS, 'amountPaid', row)).toBe('USD 250');
    expect(formatCell(INVOICE_COLUMNS, 'balanceDue', row)).toBe('USD 650');
  });

  it('shows a dash for an invoice that has never been sent, and the date once it has', () => {
    const context = { formatDate };

    expect(formatCell(INVOICE_COLUMNS, 'sentAt', invoiceRow(), { value: null, context })).toBe('—');
    expect(
      formatCell(INVOICE_COLUMNS, 'sentAt', invoiceRow(), { value: '2026-08-01', context }),
    ).toBe('on 2026-08-01');
  });

  it('writes nothing while a row is still loading', () => {
    expect(formatCell(INVOICE_COLUMNS, 'amount', undefined)).toBe('');
  });

  it('offers download, send, edit and delete, in that order', () => {
    expect(actionSpecs(INVOICE_COLUMNS).map((spec) => [spec.key, spec.label])).toEqual([
      ['download', 'download PDF'],
      ['send', 'send to client'],
      ['edit', 'edit'],
      ['delete', 'delete'],
    ]);
  });
});

describe('RECURRING_INVOICE_COLUMNS', () => {
  const retainer = (overrides: Partial<RecurringInvoiceRow> = {}) =>
    recurringRow({ amount: 500, ...overrides });

  it('lists the retainer columns, with the actions last', () => {
    expect(columnIds(RECURRING_INVOICE_COLUMNS)).toEqual([
      'name',
      'clientName',
      'amount',
      'frequency',
      'nextRunAt',
      'generatedCount',
      'active',
      'actions',
    ]);
  });

  it('names the client, falling back to its id', () => {
    expect(formatCell(RECURRING_INVOICE_COLUMNS, 'clientName', retainer())).toBe('Nimbus Ltd');
    expect(formatCell(RECURRING_INVOICE_COLUMNS, 'clientName', retainer({ clientName: '' }))).toBe(
      'client-1',
    );
  });

  it('writes the amount per period, the count raised, and the frequency in words', () => {
    expect(formatCell(RECURRING_INVOICE_COLUMNS, 'amount', retainer())).toBe('INR 500');
    expect(formatCell(RECURRING_INVOICE_COLUMNS, 'generatedCount', retainer())).toBe('9');
    expect(formatCell(RECURRING_INVOICE_COLUMNS, 'frequency', retainer())).toBe('Monthly');
    expect(
      formatCell(
        RECURRING_INVOICE_COLUMNS,
        'frequency',
        retainer({ frequency: 'FORTNIGHTLY' as never }),
      ),
    ).toBe('FORTNIGHTLY');
  });

  it('reads a retainer as active or paused', () => {
    expect(cellValue(RECURRING_INVOICE_COLUMNS, 'active', retainer())).toBe('ACTIVE');
    expect(cellValue(RECURRING_INVOICE_COLUMNS, 'active', retainer({ active: false }))).toBe(
      'PAUSED',
    );
  });

  it('offers raise now, edit and delete', () => {
    expect(actionSpecs(RECURRING_INVOICE_COLUMNS).map((spec) => spec.key)).toEqual([
      'runNow',
      'edit',
      'delete',
    ]);
  });
});

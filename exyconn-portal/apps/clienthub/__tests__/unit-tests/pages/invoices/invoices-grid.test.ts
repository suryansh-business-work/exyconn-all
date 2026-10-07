import { describe, expect, it } from 'vitest';
import type { ColDef } from 'ag-grid-community';
import { InvoiceStatus } from '@exyconn/shell/graphql/generated';
import {
  INVOICE_COLUMNS,
  PAY_ACTION,
  type ClientInvoiceRow,
} from '../../../../src/pages/invoices/invoices-grid';

type Formatter = (params: { data?: ClientInvoiceRow; context: unknown }) => string;

const ROW: ClientInvoiceRow = {
  id: 'inv-1',
  number: 'INV-1',
  amount: 1000,
  amountPaid: 250,
  currency: 'USD',
  status: InvoiceStatus.PartiallyPaid,
  issuedDate: '2026-09-01T00:00:00.000Z',
  dueDate: '2026-10-01T00:00:00.000Z',
};

const column = (id: string): ColDef<ClientInvoiceRow> => {
  const found = INVOICE_COLUMNS.find((col) => col.field === id || col.colId === id);
  if (!found) throw new Error(`No column ${id}`);
  return found;
};

const cell = (id: string, row: ClientInvoiceRow) =>
  (column(id).valueFormatter as Formatter)({ data: row, context: { t: (text: string) => text } });

describe('INVOICE_COLUMNS', () => {
  it('lays out number, dates, money, status and the actions', () => {
    expect(INVOICE_COLUMNS.map((col) => col.field ?? col.colId)).toEqual([
      'number',
      'issuedDate',
      'dueDate',
      'amount',
      'amountPaid',
      'balance',
      'status',
      'actions',
    ]);
  });

  it('writes the amount, what was paid and the balance in the invoice currency', () => {
    expect(cell('amount', ROW)).toBe('$1,000.00');
    expect(cell('amountPaid', ROW)).toBe('$250.00');
    expect(cell('balance', ROW)).toBe('$750.00');
  });

  it('treats an invoice with no payment recorded as nothing paid', () => {
    const unpaid = { ...ROW, amountPaid: null } as unknown as ClientInvoiceRow;
    expect(cell('amountPaid', unpaid)).toBe('$0.00');
    expect(cell('balance', unpaid)).toBe('$1,000.00');
  });

  it('offers pay, download and email on each row', () => {
    const { actionSpecs } = column('actions').cellRendererParams as {
      actionSpecs: { key: string }[];
    };
    expect(actionSpecs.map((spec) => spec.key)).toEqual(['pay', 'download', 'email']);
  });
});

describe('PAY_ACTION', () => {
  const hidden = (row: ClientInvoiceRow) => PAY_ACTION.hidden?.(row as never);

  it('shows while something is owed', () => {
    expect(hidden(ROW)).toBe(false);
  });

  it('hides once the invoice is paid in full or overpaid', () => {
    expect(hidden({ ...ROW, amountPaid: 1000 })).toBe(true);
    expect(hidden({ ...ROW, amountPaid: 1200 })).toBe(true);
  });
});

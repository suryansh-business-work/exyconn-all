import { describe, expect, it } from 'vitest';
import {
  toVendorInvoiceInput,
  vendorInvoiceSchema,
  type VendorInvoiceFormInput,
} from '../../../../../../src/pages/orders/forms/vendor-invoice';

const FILE = { url: 'https://cdn.test/inv.pdf', name: 'inv.pdf', contentType: 'application/pdf' };

const valid = (overrides: Partial<VendorInvoiceFormInput> = {}): VendorInvoiceFormInput => ({
  invoiceNumber: ' INV-77 ',
  invoiceDate: '2026-10-02T00:00:00.000Z',
  dueDate: '2026-11-01T00:00:00.000Z',
  amount: '1250',
  notes: '  Net 30  ',
  files: [FILE],
  ...overrides,
});

/** The message the schema gives for one field, or undefined when it has none. */
function errorFor(values: VendorInvoiceFormInput, field: string): string | undefined {
  const result = vendorInvoiceSchema.safeParse(values);
  return result.error?.issues.find((issue) => issue.path[0] === field)?.message;
}

describe('vendorInvoiceSchema', () => {
  it('accepts a complete invoice, trimming text and reading the amount as a number', () => {
    expect(vendorInvoiceSchema.parse(valid())).toEqual({
      invoiceNumber: 'INV-77',
      invoiceDate: '2026-10-02T00:00:00.000Z',
      dueDate: '2026-11-01T00:00:00.000Z',
      amount: 1250,
      notes: 'Net 30',
      files: [FILE],
    });
  });

  it('requires the invoice number, both dates and the document', () => {
    const empty = valid({ invoiceNumber: '  ', invoiceDate: '', dueDate: '', files: [] });
    expect(errorFor(empty, 'invoiceNumber')).toBe('Invoice number is required');
    expect(errorFor(empty, 'invoiceDate')).toBe('Invoice date is required');
    expect(errorFor(empty, 'dueDate')).toBe('Due date is required');
    expect(errorFor(empty, 'files')).toBe('Attach the invoice document — one PDF or image');
  });

  it('takes exactly one document', () => {
    expect(
      errorFor(valid({ files: [FILE, { ...FILE, url: 'https://cdn.test/b.pdf' }] }), 'files'),
    ).toBe('Attach the invoice document — one PDF or image');
  });

  it('keeps the invoice number to 60 characters and the notes to 2000', () => {
    expect(errorFor(valid({ invoiceNumber: 'N'.repeat(60) }), 'invoiceNumber')).toBeUndefined();
    expect(errorFor(valid({ invoiceNumber: 'N'.repeat(61) }), 'invoiceNumber')).toBe(
      'Keep the invoice number under 60 characters',
    );
    expect(errorFor(valid({ notes: 'n'.repeat(2000) }), 'notes')).toBeUndefined();
    expect(errorFor(valid({ notes: 'n'.repeat(2001) }), 'notes')).toBe(
      'Keep the notes under 2000 characters',
    );
  });

  it('refuses an amount that is zero, negative or not a number', () => {
    expect(errorFor(valid({ amount: '0' }), 'amount')).toBe('The amount must be more than zero');
    expect(errorFor(valid({ amount: -5 }), 'amount')).toBe('The amount must be more than zero');
    expect(errorFor(valid({ amount: 'abc' }), 'amount')).toBe('Must be a number');
    expect(errorFor(valid({ amount: '0.01' }), 'amount')).toBeUndefined();
  });

  it('refuses a due date before the invoice date, and allows the same day', () => {
    expect(errorFor(valid({ dueDate: '2026-10-01T00:00:00.000Z' }), 'dueDate')).toBe(
      'The due date cannot be before the invoice date',
    );
    expect(errorFor(valid({ dueDate: '2026-10-02T00:00:00.000Z' }), 'dueDate')).toBeUndefined();
  });

  it('reports a missing due date as required, not as out of order', () => {
    expect(errorFor(valid({ dueDate: '' }), 'dueDate')).toBe('Due date is required');
  });
});

describe('toVendorInvoiceInput', () => {
  it('sends the values for the order, with the one document as its URL and name', () => {
    expect(toVendorInvoiceInput('po-1', vendorInvoiceSchema.parse(valid()))).toEqual({
      purchaseOrderId: 'po-1',
      invoiceNumber: 'INV-77',
      invoiceDate: '2026-10-02T00:00:00.000Z',
      dueDate: '2026-11-01T00:00:00.000Z',
      amount: 1250,
      notes: 'Net 30',
      fileUrl: 'https://cdn.test/inv.pdf',
      fileName: 'inv.pdf',
    });
  });
});

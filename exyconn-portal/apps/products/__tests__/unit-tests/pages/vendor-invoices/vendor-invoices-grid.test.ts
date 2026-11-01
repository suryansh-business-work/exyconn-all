import { describe, expect, it } from 'vitest';
import { VendorInvoiceStatus } from '@exyconn/shell/graphql/generated';
import { VENDOR_INVOICE_COLUMNS } from '../../../../src/pages/vendor-invoices/vendor-invoices-grid';
import { actionSpecs, columnIds, formatCell } from '../../grid-helpers';
import { vendorInvoiceRow } from '../../vendor-fixtures';

describe('VENDOR_INVOICE_COLUMNS', () => {
  it('lists who sent what against which order, the review and the payment, actions last', () => {
    expect(columnIds(VENDOR_INVOICE_COLUMNS)).toEqual([
      'supplierName',
      'invoiceNumber',
      'purchaseOrderNumber',
      'invoiceDate',
      'dueDate',
      'amount',
      'status',
      'paymentStatus',
      'actions',
    ]);
  });

  it('shows the amount in the invoice currency', () => {
    expect(formatCell(VENDOR_INVOICE_COLUMNS, 'amount', vendorInvoiceRow({ amount: 300 }))).toBe(
      'USD 300',
    );
  });

  it('offers opening the document always, approve and reject only while it waits for review', () => {
    const [open, approve, reject] = actionSpecs(VENDOR_INVOICE_COLUMNS);
    const waiting = vendorInvoiceRow();
    const approved = vendorInvoiceRow({ status: VendorInvoiceStatus.Approved });
    const rejected = vendorInvoiceRow({ status: VendorInvoiceStatus.Rejected });

    expect([open.key, approve.key, reject.key]).toEqual(['open', 'approve', 'reject']);
    expect(open.hidden).toBeUndefined();
    expect(approve.hidden?.(waiting as never)).toBe(false);
    expect(reject.hidden?.(waiting as never)).toBe(false);
    expect(approve.hidden?.(approved as never)).toBe(true);
    expect(reject.hidden?.(rejected as never)).toBe(true);
  });
});

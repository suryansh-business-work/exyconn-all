import { VendorInvoiceStatus, VendorPaymentStatus } from '@exyconn/shell/graphql/generated';
import type { VendorInvoiceRow } from '../../src/pages/vendor-invoices/forms/reject-vendor-invoice';
import type { VendorContactRow } from '../../src/pages/suppliers/vendor-access/forms/vendor-contact';

/** An invoice a supplier sent through the vendor portal, waiting for review. */
export function vendorInvoiceRow(overrides: Partial<VendorInvoiceRow> = {}): VendorInvoiceRow {
  return {
    __typename: 'VendorInvoice',
    id: 'vinv-1',
    supplierId: 'supplier-1',
    supplierName: 'Acme Supplies',
    purchaseOrderId: 'po-1',
    purchaseOrderNumber: 'PO-0007',
    invoiceNumber: 'INV-42',
    invoiceDate: '2026-10-20T00:00:00.000Z',
    dueDate: '2026-11-19T00:00:00.000Z',
    amount: 1250.5,
    currency: 'USD',
    notes: '',
    fileUrl: 'https://cdn.example.test/vendor-invoices/inv-42.pdf',
    fileName: 'inv-42.pdf',
    status: VendorInvoiceStatus.Submitted,
    submittedBy: 'Sam <sam@acme.test>',
    reviewedBy: '',
    reviewedAt: null,
    reviewNote: '',
    paymentStatus: VendorPaymentStatus.NotBilled,
    paidOn: null,
    createdAt: '2026-10-20T08:00:00.000Z',
    ...overrides,
  };
}

/** A person at a supplier with vendor portal access. */
export function vendorContactRow(overrides: Partial<VendorContactRow> = {}): VendorContactRow {
  return {
    __typename: 'VendorContact',
    id: 'vc-1',
    supplierId: 'supplier-1',
    name: 'Sam Lee',
    email: 'sam@acme.test',
    active: true,
    lastSignInAt: null,
    signInCount: 0,
    createdAt: '2026-10-01T08:00:00.000Z',
    ...overrides,
  };
}

import {
  PurchaseOrderStatus,
  VendorInvoiceStatus,
  VendorPaymentStatus,
  type VendorInvoicesQuery,
} from '@exyconn/shell/graphql/generated';
import type { VendorOrderRow } from '../../../src/pages/orders/orders-grid';

export type VendorInvoiceRow = VendorInvoicesQuery['vendorInvoices']['rows'][number];

const line = (productName: string, quantity: number) => ({
  productId: `product-${productName}`,
  productName,
  quantity,
  unitCost: 10,
  taxPercent: 0,
  receivedQuantity: 0,
});

/** A purchase order as the vendor portal lists it: sent, not yet confirmed. */
export function orderRow(overrides: Partial<VendorOrderRow> = {}): VendorOrderRow {
  return {
    id: 'po-1',
    number: 'PO-0001',
    supplierId: 'supplier-1',
    supplierName: 'Paper Co',
    status: PurchaseOrderStatus.Ordered,
    orderDate: '2026-10-01T00:00:00.000Z',
    expectedDate: '2026-10-15T00:00:00.000Z',
    notes: '',
    receivedAt: null,
    acknowledgedAt: null,
    acknowledgedBy: '',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    total: 1250,
    currency: 'USD',
    lines: [line('Paper', 3), line('Toner', 1)],
    ...overrides,
  };
}

/** An invoice the supplier sent, waiting for the buyer's review. */
export function invoiceRow(overrides: Partial<VendorInvoiceRow> = {}): VendorInvoiceRow {
  return {
    id: 'vi-1',
    supplierId: 'supplier-1',
    supplierName: 'Paper Co',
    purchaseOrderId: 'po-1',
    purchaseOrderNumber: 'PO-0001',
    invoiceNumber: 'INV-77',
    invoiceDate: '2026-10-02T00:00:00.000Z',
    dueDate: '2026-11-01T00:00:00.000Z',
    amount: 1250,
    currency: 'USD',
    notes: '',
    fileUrl: 'https://cdn.test/vendor-invoices/inv-77.pdf',
    fileName: 'inv-77.pdf',
    status: VendorInvoiceStatus.Submitted,
    submittedBy: 'Sam Supplier <sam@paper.test>',
    reviewedBy: '',
    reviewedAt: null,
    reviewNote: '',
    paymentStatus: VendorPaymentStatus.NotBilled,
    paidOn: null,
    createdAt: '2026-10-02T00:00:00.000Z',
    ...overrides,
  };
}

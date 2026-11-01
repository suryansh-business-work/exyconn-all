import { badRequest, notFound } from '../../utils/errors';
import { tableQuery, type TableQueryInput } from '../../utils/tableQuery';
import { withId, withIds } from '../../utils/serialize';
import { imageUploader } from '../../utils/imagekit';
import { SupplierModel } from '../products/supplier.model';
import { PurchaseOrderModel } from '../products/purchase-order.model';
import { orderTotal } from '../products/purchase-order.totals';
import { emitWebhookBestEffort } from '../integrations';
import { registerTable } from '../table-transfer/registry';
import { VendorInvoiceModel } from './vendor-invoice.model';
import { withPaymentStatus } from './vendor-invoice.payment';
import type { VendorContact } from './vendor.auth';

/** A supplier sees an order once it has been sent: drafts are still the buyer's business. */
const VISIBLE_STATUSES = ['ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'];
/** An order still open for the supplier to confirm or invoice. */
const OPEN_STATUSES = new Set(['ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED']);
/** The largest invoice file accepted, as a base64 data URL. */
const MAX_FILE_CHARS = 12 * 1024 * 1024;
const MAX_TEXT = 2000;
const UPLOAD_FOLDER = 'vendor-invoices';

export const VENDOR_ORDER_TABLE = {
  searchFields: ['number', 'status'],
  filterFields: ['number', 'status'],
  sortFields: ['number', 'status', 'orderDate', 'expectedDate', 'createdAt'],
  defaultSort: { field: 'orderDate', dir: 'DESC' as const },
};
export const VENDOR_INVOICE_TABLE = {
  searchFields: ['invoiceNumber', 'purchaseOrderNumber', 'supplierName', 'status'],
  filterFields: ['invoiceNumber', 'purchaseOrderNumber', 'supplierName', 'status', 'currency'],
  sortFields: ['invoiceNumber', 'purchaseOrderNumber', 'amount', 'status', 'invoiceDate'],
  defaultSort: { field: 'invoiceDate', dir: 'DESC' as const },
};
registerTable('vendorPurchaseOrders', VENDOR_ORDER_TABLE);
registerTable('vendorInvoices', VENDOR_INVOICE_TABLE);

/** Who vendor portal writes are filed under in the audit log. */
export const vendorActor = (contact: VendorContact) => ({
  id: `vendor:${contact.id}`,
  name: contact.name,
  email: contact.email,
});

export interface VendorInvoiceInput {
  purchaseOrderId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  amount: number;
  notes?: string | null;
  fileUrl: string;
  fileName: string;
}

/** The contact's own supplier's order, or not found — never another supplier's, never a draft. */
async function ownOrder(contact: VendorContact, id: string) {
  const order = await PurchaseOrderModel.findOne({
    _id: id,
    supplierId: contact.supplierId,
    status: { $in: VISIBLE_STATUSES },
  });
  if (!order) notFound('Purchase order');
  return order;
}

function assertInvoice(input: VendorInvoiceInput) {
  const number = input.invoiceNumber.trim();
  if (number === '' || number.length > 60) badRequest('Enter the invoice number.');
  if (!(input.amount > 0)) badRequest('The invoice amount must be more than zero.');
  if (new Date(input.dueDate) < new Date(input.invoiceDate)) {
    badRequest('The due date cannot be before the invoice date.');
  }
  if ((input.notes ?? '').length > MAX_TEXT) badRequest('Keep the notes under 2000 characters.');
  if (!input.fileUrl.startsWith('https://')) badRequest('Attach the invoice document.');
}

/**
 * Everything a signed-in vendor contact can see and do. Every function runs inside the buying
 * company (the resolvers enter it) and filters by the contact's own supplier.
 */
export const vendorService = {
  async me(contact: VendorContact) {
    const supplier = await SupplierModel.findById(contact.supplierId).select('name code').lean();
    return {
      name: contact.name,
      email: contact.email,
      supplierName: supplier?.name ?? '',
      supplierCode: supplier?.code ?? '',
    };
  },

  async purchaseOrders(contact: VendorContact, input: TableQueryInput) {
    const page = await tableQuery(PurchaseOrderModel, input, VENDOR_ORDER_TABLE, {
      supplierId: contact.supplierId,
      status: { $in: VISIBLE_STATUSES },
    });
    return { rows: withIds(page.rows as Array<{ _id: unknown }>), totalCount: page.totalCount };
  },

  /** The supplier confirms it has the order; recorded once, with who confirmed it. */
  async acknowledge(contact: VendorContact, id: string) {
    const order = await ownOrder(contact, id);
    if (order.acknowledgedAt) badRequest('This order has already been acknowledged.');
    if (order.status !== 'ORDERED') badRequest('Only an open order can be acknowledged.');
    const updated = await PurchaseOrderModel.findOneAndUpdate(
      { _id: order._id, acknowledgedAt: null },
      { acknowledgedAt: new Date(), acknowledgedBy: `${contact.name} <${contact.email}>` },
      { new: true },
    ).lean();
    if (!updated) badRequest('This order has already been acknowledged.');
    emitWebhookBestEffort('purchase_order.acknowledged', {
      purchaseOrderId: String(updated._id),
      number: updated.number,
      supplierId: updated.supplierId,
      supplierName: updated.supplierName,
      acknowledgedBy: updated.acknowledgedBy,
      acknowledgedAt: updated.acknowledgedAt?.toISOString(),
    });
    return withId(updated);
  },

  async invoices(contact: VendorContact, input: TableQueryInput) {
    const page = await tableQuery(VendorInvoiceModel, input, VENDOR_INVOICE_TABLE, {
      supplierId: contact.supplierId,
    });
    const rows = withIds(page.rows as Array<{ _id: unknown; expenseId?: string }>);
    return { rows: await withPaymentStatus(rows), totalCount: page.totalCount };
  },

  /** Uploads the invoice document to the CDN; the URL is then sent with the invoice. */
  uploadFile(file: string, fileName: string) {
    if (file.length > MAX_FILE_CHARS) badRequest('The file is too large (max 12 MB).');
    return imageUploader.uploadImage(file, fileName, UPLOAD_FOLDER);
  },

  /** Files an invoice against one of the supplier's open orders, for the buyer to review. */
  async submitInvoice(contact: VendorContact, input: VendorInvoiceInput) {
    assertInvoice(input);
    const order = await ownOrder(contact, input.purchaseOrderId);
    if (!OPEN_STATUSES.has(order.status)) badRequest('A cancelled order cannot be invoiced.');
    const invoiceNumber = input.invoiceNumber.trim();
    const duplicate = await VendorInvoiceModel.exists({
      supplierId: contact.supplierId,
      invoiceNumber,
      status: { $ne: 'REJECTED' },
    });
    if (duplicate) badRequest(`Invoice ${invoiceNumber} has already been sent.`);
    const invoice = await VendorInvoiceModel.create({
      supplierId: contact.supplierId,
      supplierName: order.supplierName,
      purchaseOrderId: String(order._id),
      purchaseOrderNumber: order.number,
      invoiceNumber,
      invoiceDate: input.invoiceDate,
      dueDate: input.dueDate,
      amount: input.amount,
      currency: order.currency,
      notes: (input.notes ?? '').trim(),
      fileUrl: input.fileUrl,
      fileName: input.fileName.trim(),
      submittedBy: `${contact.name} <${contact.email}>`,
    });
    emitWebhookBestEffort('vendor_invoice.submitted', {
      vendorInvoiceId: String(invoice._id),
      invoiceNumber,
      purchaseOrderNumber: order.number,
      supplierId: contact.supplierId,
      supplierName: order.supplierName,
      amount: input.amount,
      currency: order.currency,
      orderTotal: orderTotal(order.lines),
    });
    const [row] = await withPaymentStatus([withId(invoice.toObject())]);
    return row;
  },
};

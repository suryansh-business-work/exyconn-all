import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { currencyField } from '../../lib/currencyField';

/**
 * Where a supplier's invoice stands with us. SUBMITTED waits for review; APPROVED has been filed
 * as a Finance bill (CompanyExpense), whose paid status is what the supplier sees as payment;
 * REJECTED carries the reason, so the supplier can send a corrected one.
 */
export const VENDOR_INVOICE_STATUSES = ['SUBMITTED', 'APPROVED', 'REJECTED'] as const;

/**
 * An invoice a supplier uploaded against one of their purchase orders in the vendor portal.
 * The amounts and dates are the supplier's; the order number and supplier name are copied on
 * write, so the review grid never joins to read them.
 */
const vendorInvoiceSchema = new Schema(
  {
    supplierId: { type: String, required: true, trim: true, index: true },
    supplierName: { type: String, default: '', trim: true },
    purchaseOrderId: { type: String, required: true, trim: true, index: true },
    purchaseOrderNumber: { type: String, default: '', trim: true },
    invoiceNumber: { type: String, required: true, trim: true },
    invoiceDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: currencyField,
    notes: { type: String, default: '', trim: true },
    /** The invoice document (PDF or image) on the CDN. */
    fileUrl: { type: String, required: true, trim: true },
    fileName: { type: String, default: '', trim: true },
    status: { type: String, enum: VENDOR_INVOICE_STATUSES, required: true, default: 'SUBMITTED' },
    submittedBy: { type: String, default: '', trim: true },
    reviewedBy: { type: String, default: '', trim: true },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, default: '', trim: true },
    /** The Finance bill an approval filed; its status is the invoice's payment status. */
    expenseId: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export type VendorInvoiceStatus = (typeof VENDOR_INVOICE_STATUSES)[number];
export type VendorInvoiceDocument = InferSchemaType<typeof vendorInvoiceSchema>;

export const VendorInvoiceModel: Model<VendorInvoiceDocument> = model<VendorInvoiceDocument>(
  'VendorInvoice',
  vendorInvoiceSchema,
);

import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * Where an invoice stands.
 *
 * DRAFT and SENT are chosen by a person; the rest follow from the money. PARTIALLY_PAID and
 * PAID are written by the payments ledger, and OVERDUE is derived from the due date — see
 * `settleStatus` in finance.billing.ts. Nobody types "PAID" into an invoice any more.
 */
export const INVOICE_STATUSES = ['DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'] as const;

const invoiceSchema = new Schema(
  {
    number: { type: String, required: true, trim: true },
    clientId: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'INR', trim: true },
    status: { type: String, enum: INVOICE_STATUSES, required: true, default: 'DRAFT' },
    /**
     * Sum of the payments recorded against this invoice. Written only by `recordPayment`,
     * which is what keeps it explainable by the rows behind it.
     */
    amountPaid: { type: Number, required: true, default: 0 },
    issuedDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true },
);

/** The stored workflow state of an invoice. */
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export type InvoiceDocument = InferSchemaType<typeof invoiceSchema>;
export const InvoiceModel: Model<InvoiceDocument> = model<InvoiceDocument>(
  'Invoice',
  invoiceSchema,
);

import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * Where an invoice stands.
 *
 * DRAFT and SENT are chosen by a person; the rest follow from the money. PARTIALLY_PAID and
 * PAID are written by the payments ledger, and OVERDUE is derived from the due date — see
 * `settleStatus` in finance.billing.ts. Nobody types "PAID" into an invoice any more.
 */
export const INVOICE_STATUSES = ['DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'] as const;

/**
 * One billed line. `amount` is never stored: it is quantity × rate × (1 + tax) every time it
 * is read, so a line can never disagree with the figures it was built from.
 */
const invoiceLineSchema = new Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    taxPercent: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false },
);

const invoiceSchema = new Schema(
  {
    number: { type: String, required: true, trim: true },
    clientId: { type: String, required: true, trim: true },
    /** Denormalised from the client on write, so the grid and the PDF never join to read it. */
    clientName: { type: String, default: '', trim: true },
    lines: { type: [invoiceLineSchema], default: [] },
    /** The sum of the lines when there are any; typed by hand for a single-figure invoice. */
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
    /** When the invoice was last emailed to the client. Null until `sendInvoice`. */
    sentAt: { type: Date, default: null },
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

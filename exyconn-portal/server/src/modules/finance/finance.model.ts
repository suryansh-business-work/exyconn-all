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
    /** HSN (goods) or SAC (services) code, printed per line on a GST invoice. */
    hsnSac: { type: String, default: '', trim: true },
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
    /** The won deal this invoice bills, so the same deal is never invoiced twice. */
    dealId: { type: String, default: '', trim: true },
    /** Two-digit GST state code of the client's place of supply. */
    placeOfSupplyStateCode: { type: String, default: '', trim: true },
    /**
     * Our GST state code at the time of writing, copied from Branding. Stored, not joined,
     * so the tax split an issued invoice shows cannot change if the business later moves.
     */
    supplierStateCode: { type: String, default: '', trim: true },
    /** Set when the invoice was raised from a project's time log — see invoice.from-timelog.ts. */
    projectId: { type: String, default: null, trim: true },
    periodFrom: { type: Date, default: null },
    periodTo: { type: Date, default: null },
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

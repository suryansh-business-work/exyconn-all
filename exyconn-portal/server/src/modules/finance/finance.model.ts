import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const INVOICE_STATUSES = ['DRAFT', 'SENT', 'PAID', 'OVERDUE'] as const;

const invoiceSchema = new Schema(
  {
    number: { type: String, required: true, trim: true },
    clientId: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'INR', trim: true },
    status: { type: String, enum: INVOICE_STATUSES, required: true, default: 'DRAFT' },
    issuedDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true },
);

export type InvoiceDocument = InferSchemaType<typeof invoiceSchema>;
export const InvoiceModel: Model<InvoiceDocument> = model<InvoiceDocument>(
  'Invoice',
  invoiceSchema,
);

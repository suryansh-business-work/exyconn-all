import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** How the money arrived. */
export const PAYMENT_METHODS = ['BANK_TRANSFER', 'CARD', 'UPI', 'CHEQUE', 'CASH', 'OTHER'] as const;

/**
 * One receipt against one invoice.
 *
 * Payments are append-only: an invoice's paid figure is the sum of the rows here, never a
 * number somebody typed, so "why does this say paid?" always has an answer. A mistaken
 * payment is corrected by recording a negative one (a refund), not by editing history.
 */
const paymentSchema = new Schema(
  {
    invoiceId: { type: String, required: true, index: true },
    /** Denormalised so the ledger reads without a join, as the stock ledger does. */
    invoiceNumber: { type: String, required: true, trim: true },
    clientId: { type: String, required: true, trim: true },
    /** Negative for a refund. The invoice's balance follows the sign. */
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'INR', trim: true },
    method: { type: String, enum: PAYMENT_METHODS, required: true, default: 'BANK_TRANSFER' },
    reference: { type: String, default: '', trim: true },
    notes: { type: String, default: '', trim: true },
    receivedAt: { type: Date, required: true },
    recordedBy: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export type PaymentDocument = InferSchemaType<typeof paymentSchema>;
export const PaymentModel: Model<PaymentDocument> = model<PaymentDocument>(
  'Payment',
  paymentSchema,
);

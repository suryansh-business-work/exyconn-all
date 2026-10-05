import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const PAYMENT_GATEWAYS = ['STRIPE', 'RAZORPAY'] as const;
export type PaymentGateway = (typeof PAYMENT_GATEWAYS)[number];

/**
 * PENDING until the gateway's signed webhook says the money arrived (PAID). REVIEW when it
 * arrived but could not be recorded against the invoice (e.g. finance had already recorded
 * the payment by hand) — finance reconciles those. EXPIRED for a checkout left unpaid.
 */
export const ATTEMPT_STATUSES = ['PENDING', 'PAID', 'REVIEW', 'EXPIRED'] as const;
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];

/**
 * One online payment a client started from the client hub: the hosted checkout it opened and
 * what became of it. The webhook settles the attempt exactly once (PENDING → PAID claimed
 * atomically), so a gateway retrying its webhook never records the payment twice.
 */
const paymentAttemptSchema = new Schema(
  {
    gateway: { type: String, enum: PAYMENT_GATEWAYS, required: true },
    invoiceId: { type: String, required: true, index: true },
    invoiceNumber: { type: String, required: true },
    clientId: { type: String, required: true, index: true },
    contactId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    /** The gateway's id for the checkout (Stripe session, Razorpay payment link). */
    externalId: { type: String, default: '', index: true },
    url: { type: String, default: '' },
    status: { type: String, enum: ATTEMPT_STATUSES, required: true, default: 'PENDING' },
    /** The gateway's id for the payment itself, recorded as the receipt's reference. */
    gatewayPaymentId: { type: String, default: '' },
    paidAt: { type: Date, default: null },
    note: { type: String, default: '' },
  },
  { timestamps: true },
);

export type PaymentAttemptDocument = InferSchemaType<typeof paymentAttemptSchema>;

export const PaymentAttemptModel: Model<PaymentAttemptDocument> = model<PaymentAttemptDocument>(
  'PaymentAttempt',
  paymentAttemptSchema,
);

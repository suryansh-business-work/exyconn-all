import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * The ledger of subscription webhooks received from Stripe and Razorpay, one row per provider
 * event id. Platform data: an event arrives before any company is known, and the unique index is
 * what makes a provider's retry a no-op — the second insert of the same id fails.
 *
 * A row whose handling threw is removed again, so the provider's retry is processed.
 */
const billingWebhookEventSchema = new Schema(
  {
    provider: { type: String, enum: ['STRIPE', 'RAZORPAY'], required: true },
    eventId: { type: String, required: true },
    type: { type: String, required: true },
    /** The company it was applied to; '' when it named none we know. */
    organizationId: { type: String, default: '' },
    /** When the provider says it happened. */
    eventAt: { type: Date, required: true },
    outcome: { type: String, default: '' },
  },
  { timestamps: true },
);

billingWebhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
billingWebhookEventSchema.index({ organizationId: 1, createdAt: -1 });

export type BillingWebhookEventDocument = InferSchemaType<typeof billingWebhookEventSchema>;

export const BillingWebhookEventModel: Model<BillingWebhookEventDocument> =
  model<BillingWebhookEventDocument>('BillingWebhookEvent', billingWebhookEventSchema);

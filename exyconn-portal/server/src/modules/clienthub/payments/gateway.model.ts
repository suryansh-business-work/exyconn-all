import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * The payment gateways clients pay through in the client hub — Exyconn's own Stripe and
 * Razorpay accounts, configured in Tech › Environment Variables. Platform-wide (see
 * platform-models.ts) and one active of each at a time. Secrets are sealed (utils/secretBox);
 * the `*Hint` fields keep the last four characters to show which key is on file.
 */
const stripeConfigSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    secretKey: { type: String, required: true },
    secretKeyHint: { type: String, default: '' },
    webhookSecret: { type: String, required: true },
    webhookSecretHint: { type: String, default: '' },
    isActive: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

const razorpayConfigSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    keyId: { type: String, required: true, trim: true },
    keySecret: { type: String, required: true },
    keySecretHint: { type: String, default: '' },
    webhookSecret: { type: String, required: true },
    webhookSecretHint: { type: String, default: '' },
    isActive: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

export type StripeConfigDocument = InferSchemaType<typeof stripeConfigSchema>;
export type RazorpayConfigDocument = InferSchemaType<typeof razorpayConfigSchema>;

export const StripeConfigModel: Model<StripeConfigDocument> = model<StripeConfigDocument>(
  'StripeConfig',
  stripeConfigSchema,
);

export const RazorpayConfigModel: Model<RazorpayConfigDocument> = model<RazorpayConfigDocument>(
  'RazorpayConfig',
  razorpayConfigSchema,
);

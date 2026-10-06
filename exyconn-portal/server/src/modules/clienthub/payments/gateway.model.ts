import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * The payment gateways clients pay through in the client hub — Exyconn's own Stripe,
 * Razorpay, PayPal and Payoneer accounts, configured in Tech › Environment Variables. Platform-wide (see
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

/** Whether an account talks to the gateway's test environment or takes real money. */
export const GATEWAY_MODES = ['SANDBOX', 'LIVE'] as const;

const paypalConfigSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    clientId: { type: String, required: true, trim: true },
    clientSecret: { type: String, required: true },
    clientSecretHint: { type: String, default: '' },
    /** The id of the webhook registered in the PayPal app; PayPal verifies deliveries with it. */
    webhookId: { type: String, required: true, trim: true },
    mode: { type: String, enum: GATEWAY_MODES, required: true, default: 'SANDBOX' },
    isActive: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

const payoneerConfigSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    merchantCode: { type: String, required: true, trim: true },
    apiToken: { type: String, required: true },
    apiTokenHint: { type: String, default: '' },
    /** The merchant division to charge under; blank for an account without divisions. */
    division: { type: String, default: '', trim: true },
    mode: { type: String, enum: GATEWAY_MODES, required: true, default: 'SANDBOX' },
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

export type PaypalConfigDocument = InferSchemaType<typeof paypalConfigSchema>;
export type PayoneerConfigDocument = InferSchemaType<typeof payoneerConfigSchema>;

export const PaypalConfigModel: Model<PaypalConfigDocument> = model<PaypalConfigDocument>(
  'PaypalConfig',
  paypalConfigSchema,
);

export const PayoneerConfigModel: Model<PayoneerConfigDocument> = model<PayoneerConfigDocument>(
  'PayoneerConfig',
  payoneerConfigSchema,
);

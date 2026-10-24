import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** The providers a billing key can read real costs from. */
export const BILLING_PROVIDERS = ['OPENAI'] as const;
export type BillingProvider = (typeof BILLING_PROVIDERS)[number];

/**
 * An extra key that reads a provider's real bill — OpenAI's Admin key for its Costs API —
 * kept apart from the key the platform calls the provider with, because it can see (and on
 * OpenAI, manage) the whole organisation. Tech > Environment Variables > Billing keys.
 *
 * Sealed at rest with utils/secretBox and write-only over the API, like the payment gateway
 * secrets. One key per provider is active at a time. Install-wide (a platform model).
 */
const billingKeySchema = new Schema(
  {
    provider: { type: String, enum: BILLING_PROVIDERS, required: true },
    label: { type: String, required: true, trim: true, maxlength: 120 },
    /** Sealed. */
    key: { type: String, required: true },
    /** The last four characters, kept so the list can tell keys apart without opening one. */
    keyHint: { type: String, default: '' },
    isActive: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

export type BillingKeyDocument = InferSchemaType<typeof billingKeySchema>;

export const BillingKeyModel: Model<BillingKeyDocument> = model<BillingKeyDocument>(
  'BillingKeyConfig',
  billingKeySchema,
);

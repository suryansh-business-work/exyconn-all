import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** Why this address must not be marketed to again. */
export const SUPPRESSION_REASONS = ['UNSUBSCRIBED', 'BOUNCED', 'MANUAL'] as const;

export type SuppressionReason = (typeof SUPPRESSION_REASONS)[number];

/**
 * One address marketing may never write to again.
 *
 * Consent is not a property of a contact row: the same person appears as a client, as a
 * CRM contact and inside a segment, and "do not email me" has to outlive every one of
 * them. The address is the key, lower-cased and unique, so a second unsubscribe is a
 * no-op rather than a duplicate — and so a send can answer the question with one lookup.
 */
const marketingSuppressionSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    reason: { type: String, enum: SUPPRESSION_REASONS, required: true, default: 'MANUAL' },
    /** Where the suppression came from — a campaign, a bounce, or who added it by hand. */
    source: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export type MarketingSuppressionDocument = InferSchemaType<typeof marketingSuppressionSchema>;
export const MarketingSuppressionModel: Model<MarketingSuppressionDocument> =
  model<MarketingSuppressionDocument>('MarketingSuppression', marketingSuppressionSchema);

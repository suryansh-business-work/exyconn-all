import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** The settings row is a singleton, so it is always read and written under this key. */
export const AI_SPEND_LIMIT_KEY = 'global';

/**
 * The budget every AI run is checked against, edited in Tech > Environment Variables >
 * AI Pricing. One document: a business has one AI bill.
 *
 * A cap of zero means "no cap on this axis", so the monthly ceiling and the per-person
 * daily ceiling can be used independently.
 */
const aiSpendLimitSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: AI_SPEND_LIMIT_KEY },
    /** Whole-workspace ceiling for the current calendar month, in USD. */
    monthlyUsdCap: { type: Number, required: true, min: 0, default: 0 },
    /** Per-person ceiling for the current day, in USD. */
    perUserDailyUsdCap: { type: Number, required: true, min: 0, default: 0 },
    enabled: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

export type AiSpendLimitDocument = InferSchemaType<typeof aiSpendLimitSchema>;

export const AiSpendLimitModel: Model<AiSpendLimitDocument> = model<AiSpendLimitDocument>(
  'AiSpendLimit',
  aiSpendLimitSchema,
);

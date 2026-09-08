import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * What one model costs, in US dollars per 1,000 tokens.
 *
 * Prices are data, not code: OpenAI changes them without asking us, and a number baked
 * into a release would quietly bill the business wrong until somebody noticed. The rows
 * are seeded once on boot and edited in Tech > Environment Variables > AI Pricing.
 *
 * A model with no active row costs nothing rather than an invented amount — a guessed
 * price is worse than an obvious zero, because only one of the two gets questioned.
 */
const aiModelPriceSchema = new Schema(
  {
    model: { type: String, required: true, unique: true, trim: true },
    inputPer1kUsd: { type: Number, required: true, min: 0, default: 0 },
    outputPer1kUsd: { type: Number, required: true, min: 0, default: 0 },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

export type AiModelPriceDocument = InferSchemaType<typeof aiModelPriceSchema>;

export const AiModelPriceModel: Model<AiModelPriceDocument> = model<AiModelPriceDocument>(
  'AiModelPrice',
  aiModelPriceSchema,
);

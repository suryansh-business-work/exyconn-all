import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * How many requests one API key made on one day (UTC), for the per-key usage chart in the
 * developer portal. One counter row per key per day, raised as the key is used — never a row per
 * request, so a busy integration does not grow the collection by the request.
 */
const apiKeyUsageSchema = new Schema(
  {
    apiKeyId: { type: String, required: true, trim: true },
    /** The UTC day, as YYYY-MM-DD. */
    day: { type: String, required: true, trim: true },
    count: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);
apiKeyUsageSchema.index({ apiKeyId: 1, day: 1 }, { unique: true });

export type ApiKeyUsageDocument = InferSchemaType<typeof apiKeyUsageSchema>;
export const ApiKeyUsageModel: Model<ApiKeyUsageDocument> = model<ApiKeyUsageDocument>(
  'ApiKeyUsage',
  apiKeyUsageSchema,
);

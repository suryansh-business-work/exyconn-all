import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * The Pexels API credential behind the shared upload dialog's stock-photo and
 * stock-video tabs, managed from Tech > Environment Variables (DB-backed, no env
 * dependency). Exactly one document is `isActive` at a time and is the key every
 * search runs through.
 */
const pexelsConfigSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    apiKey: { type: String, required: true, trim: true },
    isActive: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

export type PexelsConfigDocument = InferSchemaType<typeof pexelsConfigSchema>;

export const PexelsConfigModel: Model<PexelsConfigDocument> = model<PexelsConfigDocument>(
  'PexelsConfig',
  pexelsConfigSchema,
);

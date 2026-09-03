import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * The OpenAI credential the platform's AI features run on, managed from
 * Tech > Environment Variables (DB-backed, no env dependency). Exactly one document is
 * `isActive` at a time and is the key and model every request goes out with.
 */
const openAiConfigSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    apiKey: { type: String, required: true, trim: true },
    /** The model requests default to, e.g. `gpt-4o-mini`. Named here, never in code. */
    defaultModel: { type: String, required: true, trim: true },
    isActive: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

export type OpenAiConfigDocument = InferSchemaType<typeof openAiConfigSchema>;

export const OpenAiConfigModel: Model<OpenAiConfigDocument> = model<OpenAiConfigDocument>(
  'OpenAiConfig',
  openAiConfigSchema,
);

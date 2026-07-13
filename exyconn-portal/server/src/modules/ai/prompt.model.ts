import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const PROMPT_CATEGORIES = [
  'WRITING',
  'CODING',
  'MARKETING',
  'SUPPORT',
  'ANALYSIS',
  'GENERAL',
] as const;

/** A reusable prompt stored in the AI Prompt Library. */
const promptSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: PROMPT_CATEGORIES, required: true, default: 'GENERAL' },
    content: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: null },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

export type PromptDocument = InferSchemaType<typeof promptSchema>;
export const PromptModel: Model<PromptDocument> = model<PromptDocument>('Prompt', promptSchema);

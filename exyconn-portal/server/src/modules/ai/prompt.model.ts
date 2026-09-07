import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { extractMergeFields } from './ai.mergeFields';

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
    /**
     * The `{{name}}` placeholders in the content, derived on every save. Stored rather
     * than parsed on read so the run dialog knows what to ask for without shipping the
     * template language to the client.
     */
    variables: { type: [String], default: [] },
  },
  { timestamps: true },
);

// Derived, never authored: the two would drift the moment somebody edited the content
// without touching the field, and the run dialog would ask for the wrong things.
promptSchema.pre('save', function derive(next) {
  this.variables = extractMergeFields(this.content ?? '');
  next();
});

promptSchema.pre('findOneAndUpdate', function derive(next) {
  const update = this.getUpdate() as { content?: string } | null;
  if (update && typeof update.content === 'string') {
    this.set('variables', extractMergeFields(update.content));
  }
  next();
});

export type PromptDocument = InferSchemaType<typeof promptSchema>;
export const PromptModel: Model<PromptDocument> = model<PromptDocument>('Prompt', promptSchema);

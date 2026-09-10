import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { SUPPORT_CATEGORIES } from '../employee/support.model';

/**
 * A reply the desk sends often, kept once instead of being retyped.
 *
 * Not a knowledge-base article: an article explains something to the person who asked, and
 * is written to be read on its own. This is the paragraph an agent drops into a thread — it
 * is a starting point they then edit, which is why nothing here is ever sent automatically.
 */
const cannedReplySchema = new Schema(
  {
    /** What the agent picks it by, so it reads as an intent — "Ask for a screenshot". */
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: SUPPORT_CATEGORIES, required: true, default: 'OTHER' },
    body: { type: String, required: true, trim: true },
    /** Retired snippets stay readable in the register but are not offered in the composer. */
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

export type CannedReplyDocument = InferSchemaType<typeof cannedReplySchema>;
export const CannedReplyModel: Model<CannedReplyDocument> = model<CannedReplyDocument>(
  'CannedReply',
  cannedReplySchema,
);

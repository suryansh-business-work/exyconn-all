import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { SUPPORT_CATEGORIES } from '../employee/support.model';

/**
 * An answer written once so it does not have to be typed again.
 *
 * Categorised on the same list tickets are, deliberately: an article is found by the person
 * holding a ticket, and a second vocabulary would mean the payroll article lived somewhere
 * the payroll queue could not see.
 */
const kbArticleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    /** Stable handle for a link that survives the title being reworded. */
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    category: { type: String, enum: SUPPORT_CATEGORIES, required: true, default: 'OTHER' },
    /** One line, shown in search results — the part that decides whether to open it. */
    summary: { type: String, default: '', trim: true },
    body: { type: String, required: true, trim: true },
    /**
     * Drafts exist so an article can be written before it is right. Only published articles
     * are searchable, because a half-written answer is worse than none.
     */
    isPublished: { type: Boolean, required: true, default: false },
    updatedById: { type: String, default: '', trim: true },
    updatedByName: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

/** Search runs over what a person actually reads, weighted to the title. */
kbArticleSchema.index(
  { title: 'text', summary: 'text', body: 'text' },
  {
    weights: { title: 10, summary: 4, body: 1 },
  },
);

export type KbArticleDocument = InferSchemaType<typeof kbArticleSchema>;
export const KbArticleModel: Model<KbArticleDocument> = model<KbArticleDocument>(
  'KbArticle',
  kbArticleSchema,
);

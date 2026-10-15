import { Schema } from 'mongoose';

/**
 * An item's own search and share meta (a job, company, gig, post, case study or newsletter issue).
 * A blank field leaves the page template's meta in place, so only what an editor fills in changes.
 */
export const itemSeoSchema = new Schema(
  {
    title: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    keywords: { type: String, default: '', trim: true },
    ogImageUrl: { type: String, default: '', trim: true },
    noindex: { type: Boolean, default: false },
  },
  { _id: false },
);

/** The field to add to a schema. Rows saved before it existed read `seo` as undefined. */
export const itemSeoField = { type: itemSeoSchema, default: () => ({}) };

export interface ItemSeoInput {
  title?: string;
  description?: string;
  keywords?: string;
  ogImageUrl?: string;
  noindex?: boolean;
}

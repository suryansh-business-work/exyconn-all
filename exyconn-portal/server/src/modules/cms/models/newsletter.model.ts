import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * A newsletter issue published on a site (/newsletter, /newsletter/<slug>). The body is HTML,
 * the same contract as a blog post's. Sending it by email stays with Marketing › Campaigns.
 */
const newsletterIssueSchema = new Schema(
  {
    siteId: { type: String, required: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    summary: { type: String, default: '', trim: true, maxlength: 600 },
    coverImage: { type: String, default: '', trim: true },
    content: { type: String, default: '' },
    contentCss: { type: String, default: '' },
    isActive: { type: Boolean, required: true, default: true },
    publishedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

newsletterIssueSchema.index({ siteId: 1, slug: 1 }, { unique: true });

export type NewsletterIssueDocument = InferSchemaType<typeof newsletterIssueSchema>;

export const NewsletterIssueModel: Model<NewsletterIssueDocument> = model<NewsletterIssueDocument>(
  'NewsletterIssue',
  newsletterIssueSchema,
);

export const SUBSCRIBER_STATUSES = ['SUBSCRIBED', 'UNSUBSCRIBED'] as const;

/** Somebody who signed up for a site's newsletter. The token lets them unsubscribe from a link. */
const newsletterSubscriberSchema = new Schema(
  {
    siteId: { type: String, required: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, default: '', trim: true, maxlength: 120 },
    status: { type: String, enum: SUBSCRIBER_STATUSES, required: true, default: 'SUBSCRIBED' },
    /** Where they signed up: the page path, or 'portal' when added by the team. */
    source: { type: String, default: '', trim: true, maxlength: 300 },
    consentAt: { type: Date, required: true, default: Date.now },
    unsubscribeToken: { type: String, required: true },
  },
  { timestamps: true },
);

newsletterSubscriberSchema.index({ siteId: 1, email: 1 }, { unique: true });

export type NewsletterSubscriberDocument = InferSchemaType<typeof newsletterSubscriberSchema>;

export const NewsletterSubscriberModel: Model<NewsletterSubscriberDocument> =
  model<NewsletterSubscriberDocument>('NewsletterSubscriber', newsletterSubscriberSchema);

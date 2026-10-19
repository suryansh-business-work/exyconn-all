import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * The organization's marketing footer: who is writing and where they are. Every marketing
 * email ends with it, together with the unsubscribe and preference links no editor can remove.
 */
const marketingFooterSchema = new Schema(
  {
    companyName: { type: String, default: '', trim: true },
    contactLine: { type: String, default: '', trim: true },
    postalAddress: { type: String, default: '', trim: true },
    privacyUrl: { type: String, default: '', trim: true },
    websiteUrl: { type: String, default: '', trim: true },
    textColor: { type: String, default: '#6b7280', trim: true },
    linkColor: { type: String, default: '#2563eb', trim: true },
  },
  { timestamps: true },
);

export type MarketingFooterDocument = InferSchemaType<typeof marketingFooterSchema>;
export const MarketingFooterModel: Model<MarketingFooterDocument> = model<MarketingFooterDocument>(
  'MarketingFooter',
  marketingFooterSchema,
);

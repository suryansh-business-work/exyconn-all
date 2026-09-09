import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * One click on one link in one campaign.
 *
 * Kept as rows rather than a counter on the campaign because the question marketing actually
 * asks is "which link did they click", and a single number cannot answer it. The recipient's
 * address is stored — this side of the wall is the portal's own data, and a click that cannot
 * be attributed to a person tells a marketer nothing they can act on.
 */
const campaignClickSchema = new Schema(
  {
    campaignId: { type: String, required: true, trim: true, index: true },
    sendId: { type: String, required: true, trim: true, index: true },
    to: { type: String, required: true, lowercase: true, trim: true },
    /** Where they were sent. Stored as it appeared in the email, before the redirect. */
    url: { type: String, required: true, trim: true },
    clickedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

export type CampaignClickDocument = InferSchemaType<typeof campaignClickSchema>;
export const CampaignClickModel: Model<CampaignClickDocument> = model<CampaignClickDocument>(
  'CampaignClick',
  campaignClickSchema,
);

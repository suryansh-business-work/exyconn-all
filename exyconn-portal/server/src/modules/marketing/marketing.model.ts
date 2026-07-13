import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const CAMPAIGN_CHANNELS = ['EMAIL', 'SOCIAL', 'SEARCH', 'DISPLAY'] as const;
export const CAMPAIGN_STATUSES = ['PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED'] as const;

const campaignSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    channel: { type: String, enum: CAMPAIGN_CHANNELS, required: true, default: 'EMAIL' },
    budget: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: CAMPAIGN_STATUSES, required: true, default: 'PLANNED' },
    // Email-campaign content (used by the Send action for EMAIL channel campaigns).
    subject: { type: String, trim: true, default: '' },
    body: { type: String, default: '' },
    // Delivery tracking, set by the sendCampaign mutation.
    lastSentAt: { type: Date, default: null },
    recipientsCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type CampaignDocument = InferSchemaType<typeof campaignSchema>;
export const CampaignModel: Model<CampaignDocument> = model<CampaignDocument>(
  'Campaign',
  campaignSchema,
);

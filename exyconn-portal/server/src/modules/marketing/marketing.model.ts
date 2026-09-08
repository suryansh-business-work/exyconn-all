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
    /**
     * A stored email template to render through instead of the raw body. Optional: a
     * one-off blast does not need a template, but a recurring one should look like every
     * other email the company sends, and that lives in Tech > Email.
     */
    templateKey: { type: String, default: '', trim: true },
    // Delivery tracking, set by the sendCampaign mutation.
    lastSentAt: { type: Date, default: null },
    recipientsCount: { type: Number, default: 0 },
    /** When the dispatcher should send this campaign unattended. */
    scheduledAt: { type: Date, default: null },
    /** Who the scheduled send goes to. Without it there is nothing to dispatch. */
    scheduledAudienceListId: { type: String, default: '', trim: true },
    /**
     * Stamped the moment the dispatcher claims the campaign, before it sends anything.
     * That claim is what stops a second tick — or a second process — sending it twice.
     */
    scheduleDispatchedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type CampaignDocument = InferSchemaType<typeof campaignSchema>;
export const CampaignModel: Model<CampaignDocument> = model<CampaignDocument>(
  'Campaign',
  campaignSchema,
);

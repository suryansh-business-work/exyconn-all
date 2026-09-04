import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** Whether this recipient's copy reached the SMTP server. */
export const CAMPAIGN_SEND_STATUSES = ['SENT', 'FAILED'] as const;

/**
 * One recipient's copy of one campaign send.
 *
 * The campaign row only ever kept a count, so a failure was a number that went down and a
 * name nobody could recover — the reason lived in the server log until it rotated away.
 * This keeps the address and the transport's own words next to the campaign.
 */
const campaignSendSchema = new Schema(
  {
    campaignId: { type: String, required: true, trim: true, index: true },
    audienceListId: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },
    recipientName: { type: String, default: '', trim: true },
    status: { type: String, enum: CAMPAIGN_SEND_STATUSES, required: true },
    /** The failure reason, in the words the transport gave. Empty on success. */
    error: { type: String, default: '', trim: true },
    sentAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

export type CampaignSendDocument = InferSchemaType<typeof campaignSendSchema>;
export const CampaignSendModel: Model<CampaignSendDocument> = model<CampaignSendDocument>(
  'CampaignSend',
  campaignSendSchema,
);

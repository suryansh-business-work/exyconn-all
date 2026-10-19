import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * The exact content a send went out with, frozen when it was queued or scheduled.
 *
 * Insert-only. Editing a campaign's draft after it was scheduled changes the next revision,
 * never this one, so what sits in the queue is what the marketer approved — and a report can
 * always show what a recipient actually received.
 */
const campaignRevisionSchema = new Schema(
  {
    campaignId: { type: String, required: true, index: true },
    version: { type: Number, required: true },
    campaignName: { type: String, required: true },
    subject: { type: String, required: true },
    preheader: { type: String, default: '' },
    senderName: { type: String, default: '' },
    senderEmail: { type: String, required: true },
    replyTo: { type: String, default: '' },
    preferenceCategoryId: { type: String, default: '' },
    mjml: { type: String, required: true },
    /** Compiled once, with the merge variables still in place. */
    html: { type: String, required: true },
    text: { type: String, default: '' },
    trackOpens: { type: Boolean, required: true },
    trackClicks: { type: Boolean, required: true },
    createdById: { type: String, default: '' },
    createdByName: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
campaignRevisionSchema.index({ campaignId: 1, version: 1 }, { unique: true });

export type CampaignRevisionDocument = InferSchemaType<typeof campaignRevisionSchema>;
export const CampaignRevisionModel: Model<CampaignRevisionDocument> =
  model<CampaignRevisionDocument>('CampaignRevision', campaignRevisionSchema);

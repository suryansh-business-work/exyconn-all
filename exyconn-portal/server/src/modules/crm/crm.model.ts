import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const LEAD_SOURCES = ['WEBSITE', 'REFERRAL', 'ADS', 'EVENT'] as const;
export const LEAD_STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'WON', 'LOST'] as const;

const leadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    source: { type: String, enum: LEAD_SOURCES, required: true, default: 'WEBSITE' },
    stage: { type: String, enum: LEAD_STAGES, required: true, default: 'NEW' },
    value: { type: Number, required: true, min: 0 },
    owner: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },
    /**
     * The campaign that produced this lead. Denormalised alongside its name so a lead
     * list stays readable without a join, and still reads correctly after a rename.
     */
    campaignId: { type: String, default: '', trim: true, index: true },
    campaignName: { type: String, default: '', trim: true },
    /** Set once the lead has been converted; the deal it became. */
    convertedDealId: { type: String, default: null },
  },
  { timestamps: true },
);

export type LeadDocument = InferSchemaType<typeof leadSchema>;
export const LeadModel: Model<LeadDocument> = model<LeadDocument>('Lead', leadSchema);

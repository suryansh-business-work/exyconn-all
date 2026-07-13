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
  },
  { timestamps: true },
);

export type LeadDocument = InferSchemaType<typeof leadSchema>;
export const LeadModel: Model<LeadDocument> = model<LeadDocument>('Lead', leadSchema);

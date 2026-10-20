import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { EDITOR_MODES } from './marketing.model';

/**
 * A reusable email design. A campaign made from it gets a COPY, so editing the campaign never
 * changes the master, and editing the master never changes a campaign already written.
 */
const campaignTemplateSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'General', trim: true },
    description: { type: String, default: '', trim: true },
    editorMode: { type: String, enum: EDITOR_MODES, required: true, default: 'VISUAL' },
    blocks: { type: Schema.Types.Mixed, default: [] },
    mjml: { type: String, required: true },
    /** The latest version number; every save adds a version row. */
    version: { type: Number, required: true, default: 1 },
    updatedByName: { type: String, default: '' },
  },
  { timestamps: true },
);
campaignTemplateSchema.index({ name: 1 }, { unique: true });

/** One saved state of a template, insert-only — what Restore goes back to. */
const campaignTemplateVersionSchema = new Schema(
  {
    templateId: { type: String, required: true, index: true },
    version: { type: Number, required: true },
    editorMode: { type: String, enum: EDITOR_MODES, required: true },
    blocks: { type: Schema.Types.Mixed, default: [] },
    mjml: { type: String, required: true },
    note: { type: String, default: '' },
    createdByName: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
campaignTemplateVersionSchema.index({ templateId: 1, version: 1 }, { unique: true });

export type CampaignTemplateDocument = InferSchemaType<typeof campaignTemplateSchema>;
export const CampaignTemplateModel: Model<CampaignTemplateDocument> =
  model<CampaignTemplateDocument>('CampaignTemplate', campaignTemplateSchema);

export type CampaignTemplateVersionDocument = InferSchemaType<typeof campaignTemplateVersionSchema>;
export const CampaignTemplateVersionModel: Model<CampaignTemplateVersionDocument> =
  model<CampaignTemplateVersionDocument>('CampaignTemplateVersion', campaignTemplateVersionSchema);

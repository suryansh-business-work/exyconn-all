import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * A kind of marketing email a recipient may turn off on its own — Newsletters, Events…
 * Configured by Marketing; a campaign names one, and its recipients' choices apply.
 */
const preferenceCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    isActive: { type: Boolean, required: true, default: true },
    sortOrder: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);
preferenceCategorySchema.index({ name: 1 }, { unique: true });

/**
 * One address's choices. Stored as OPT-OUTS: a preference can only narrow what an address
 * receives, so saving it can never be read as consent that was not otherwise given.
 * Unsubscribing from everything is the suppression list, which always wins.
 */
const marketingPreferenceSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    optedOutCategoryIds: { type: [String], default: [] },
  },
  { timestamps: true },
);

export type PreferenceCategoryDocument = InferSchemaType<typeof preferenceCategorySchema>;
export const PreferenceCategoryModel: Model<PreferenceCategoryDocument> =
  model<PreferenceCategoryDocument>('MarketingPreferenceCategory', preferenceCategorySchema);

export type MarketingPreferenceDocument = InferSchemaType<typeof marketingPreferenceSchema>;
export const MarketingPreferenceModel: Model<MarketingPreferenceDocument> =
  model<MarketingPreferenceDocument>('MarketingPreference', marketingPreferenceSchema);

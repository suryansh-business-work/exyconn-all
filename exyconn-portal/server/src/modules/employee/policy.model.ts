import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** Category an HR policy document belongs to. */
export const POLICY_CATEGORIES = ['LEAVE', 'CONDUCT', 'IT', 'FINANCE', 'GENERAL'] as const;

/** A company-wide HR policy document, readable by every authenticated employee. */
const policySchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: POLICY_CATEGORIES, required: true, default: 'GENERAL' },
    summary: { type: String, required: true, trim: true },
    url: { type: String, trim: true, default: null },
    effectiveDate: { type: Date, required: true },
  },
  { timestamps: true },
);

export type PolicyDocument = InferSchemaType<typeof policySchema>;

export const PolicyModel: Model<PolicyDocument> = model<PolicyDocument>('Policy', policySchema);

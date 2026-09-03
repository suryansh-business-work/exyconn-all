import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** Who a policy is written for. Drives who can see it, and who is asked to sign. */
export const POLICY_AUDIENCES = ['ALL_STAFF', 'HR_ONLY', 'PUBLIC'] as const;

export const POLICY_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

/**
 * A company policy — a handbook section, a code of conduct, a privacy policy.
 *
 * `version` is the point of the model. A policy people have signed is a record of what they
 * agreed to, so publishing a changed policy raises the version and every signature is
 * recorded against the version it was given for. Without that, "everyone has accepted the
 * privacy policy" quietly comes to mean "everyone accepted some earlier privacy policy".
 *
 * PUBLIC policies are also what the website renders, so the site and the portal cannot drift.
 */
const policySchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    /** URL segment the website renders this at, e.g. `privacy-policy`. */
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    summary: { type: String, default: '', trim: true },
    /** Rich text (HTML), authored in the portal. */
    body: { type: String, required: true },
    audience: { type: String, enum: POLICY_AUDIENCES, required: true, default: 'ALL_STAFF' },
    status: { type: String, enum: POLICY_STATUSES, required: true, default: 'DRAFT' },
    /** Raised whenever a published policy's wording changes. Signatures are per version. */
    version: { type: Number, required: true, default: 1, min: 1 },
    effectiveDate: { type: Date, required: true },
    /** Staff must read and sign this one; an informational policy need not be signed. */
    requiresAcknowledgement: { type: Boolean, required: true, default: false },
    owner: { type: String, default: '', trim: true },
    publishedAt: { type: Date, default: null },
    updatedBy: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export type PolicyDocument = InferSchemaType<typeof policySchema>;
export type PolicyAudience = (typeof POLICY_AUDIENCES)[number];

export const PolicyModel: Model<PolicyDocument> = model<PolicyDocument>('Policy', policySchema);

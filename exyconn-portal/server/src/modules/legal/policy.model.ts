import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { sanitizeRichHtml } from '../../utils/sanitizeHtml';

/** Who a policy is written for. Drives who can see it, and who is asked to sign. */
export const POLICY_AUDIENCES = ['ALL_STAFF', 'HR_ONLY', 'PUBLIC'] as const;

export const POLICY_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

/** Which part of the company a policy governs — and so which team maintains it. */
export const POLICY_CATEGORIES = ['GENERAL', 'HR', 'IT', 'SECURITY', 'PRIVACY', 'FINANCE'] as const;
/** The categories the IT team writes and maintains: device, BYOD, password, VPN, security. */
export const IT_POLICY_CATEGORIES = ['IT', 'SECURITY'] as const;

/**
 * How far a document may travel (ISO 27001 A.5.12).
 *
 * It is the document's own label, not a permission: who can open a policy is decided by its
 * audience and the reader's role. This is what tells somebody holding a printed copy whether
 * it may leave the building.
 */
export const POLICY_CLASSIFICATIONS = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL'] as const;

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
    /**
     * Rich text (HTML), authored in the portal. Sanitised by a setter, so every write path —
     * create, update, seed — stores only allow-listed markup; readers inject it as HTML.
     */
    body: { type: String, required: true, set: sanitizeRichHtml },
    audience: { type: String, enum: POLICY_AUDIENCES, required: true, default: 'ALL_STAFF' },
    category: { type: String, enum: POLICY_CATEGORIES, required: true, default: 'GENERAL' },
    status: { type: String, enum: POLICY_STATUSES, required: true, default: 'DRAFT' },
    /** Raised whenever a published policy's wording changes. Signatures are per version. */
    version: { type: Number, required: true, default: 1, min: 1 },
    effectiveDate: { type: Date, required: true },
    /** Staff must read and sign this one; an informational policy need not be signed. */
    requiresAcknowledgement: { type: Boolean, required: true, default: false },
    owner: { type: String, default: '', trim: true },
    classification: {
      type: String,
      enum: POLICY_CLASSIFICATIONS,
      required: true,
      default: 'INTERNAL',
    },
    /**
     * When this has to be read again and confirmed as still right — the date every
     * management standard asks for, and the one a documented policy quietly rots without.
     */
    nextReviewOn: { type: Date, default: null },
    /** Who approved it for use, recorded when it was published. Not its author. */
    approvedByName: { type: String, default: '', trim: true },
    approvedOn: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    updatedBy: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export type PolicyDocument = InferSchemaType<typeof policySchema>;
export type PolicyAudience = (typeof POLICY_AUDIENCES)[number];
export type PolicyClassification = (typeof POLICY_CLASSIFICATIONS)[number];

export const PolicyModel: Model<PolicyDocument> = model<PolicyDocument>('Policy', policySchema);

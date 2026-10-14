import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** What a check concluded, from Reacher's `is_reachable`. */
export const VERIFICATION_STATUSES = ['VERIFIED', 'RISKY', 'INVALID', 'UNKNOWN'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

/** Where a check was asked for. */
export const VERIFICATION_SOURCES = ['SINGLE', 'BULK', 'CRM'] as const;
export type VerificationSource = (typeof VERIFICATION_SOURCES)[number];

/**
 * The latest check of one address, per company: what every email in the CRM shows beside it,
 * and the record CRM > Tools > Email verifier lists. Checking again replaces the result.
 */
const emailVerificationSchema = new Schema(
  {
    /** Lower-cased and trimmed, so one address has one record. */
    email: { type: String, required: true, trim: true, lowercase: true },
    status: { type: String, enum: VERIFICATION_STATUSES, required: true },
    /** One line on why, e.g. "The mailbox does not exist". */
    reason: { type: String, default: '' },
    syntaxValid: { type: Boolean, default: false },
    hasMx: { type: Boolean, default: false },
    deliverable: { type: Boolean, default: false },
    catchAll: { type: Boolean, default: false },
    disposable: { type: Boolean, default: false },
    roleAccount: { type: Boolean, default: false },
    /** A likely typo fix Reacher suggests, e.g. gmail.com for gmial.com. */
    suggestion: { type: String, default: '' },
    source: { type: String, enum: ['SINGLE', 'BULK', 'CRM'], required: true },
    checkedAt: { type: Date, required: true },
    checkedBy: { type: String, default: '' },
    /** The bulk check that last checked it, if one did. */
    batchId: { type: String, default: '' },
  },
  { timestamps: true },
);
emailVerificationSchema.index({ email: 1 }, { unique: true });
emailVerificationSchema.index({ checkedAt: -1 });

export type EmailVerificationDocument = InferSchemaType<typeof emailVerificationSchema>;

export const EmailVerificationModel: Model<EmailVerificationDocument> =
  model<EmailVerificationDocument>('EmailVerification', emailVerificationSchema);

export const BATCH_STATUSES = ['QUEUED', 'RUNNING', 'DONE', 'FAILED'] as const;

/**
 * A bulk check from an uploaded CSV: the addresses it found, worked through in the background
 * a few at a time (each check takes seconds), with running counts per result.
 */
const emailVerificationBatchSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    emails: { type: [String], default: [] },
    /** How many of `emails` have been checked; the next pass starts here. */
    processed: { type: Number, default: 0 },
    status: { type: String, enum: BATCH_STATUSES, default: 'QUEUED' },
    verified: { type: Number, default: 0 },
    risky: { type: Number, default: 0 },
    invalid: { type: Number, default: 0 },
    unknown: { type: Number, default: 0 },
    createdBy: { type: String, default: '' },
    finishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
emailVerificationBatchSchema.index({ status: 1, createdAt: 1 });

export type EmailVerificationBatchDocument = InferSchemaType<typeof emailVerificationBatchSchema>;

export const EmailVerificationBatchModel: Model<EmailVerificationBatchDocument> =
  model<EmailVerificationBatchDocument>('EmailVerificationBatch', emailVerificationBatchSchema);

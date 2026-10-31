import { Schema, model, type InferSchemaType, type Types } from 'mongoose';
import { HEALTH_CHECK_CODES, HEALTH_CHECK_STATUSES } from './mail-health.types';

const checkSchema = new Schema(
  {
    code: { type: String, enum: HEALTH_CHECK_CODES, required: true },
    status: { type: String, enum: HEALTH_CHECK_STATUSES, required: true },
    message: { type: String, default: '' },
    fix: { type: String, default: '' },
    record: { type: String, default: '' },
    suggested: { type: String, default: '' },
  },
  { _id: false },
);

/**
 * The last health check of one domain a company's CRM mailboxes send from (one row per domain
 * per company, replaced on every check). `previousScore` is the score before it, which is what
 * the daily pass compares against to decide whether to alert.
 */
const mailDomainHealthSchema = new Schema(
  {
    domain: { type: String, required: true, trim: true, lowercase: true },
    score: { type: Number, required: true },
    previousScore: { type: Number, default: null },
    checks: { type: [checkSchema], default: [] },
    checkedAt: { type: Date, required: true },
  },
  { timestamps: true },
);
// (organizationId, domain) once the tenancy plugin adds the company: see GmailAccount.
mailDomainHealthSchema.index({ domain: 1 }, { unique: true });

export type MailDomainHealthDocument = InferSchemaType<typeof mailDomainHealthSchema> & {
  _id: Types.ObjectId;
};

export const MailDomainHealthModel = model('MailDomainHealth', mailDomainHealthSchema);

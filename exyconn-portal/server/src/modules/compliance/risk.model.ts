import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import {
  COMPLIANCE_CATEGORIES,
  MANAGEMENT_STANDARDS,
  RISK_SCALE_MAX,
  RISK_SCALE_MIN,
  RISK_STATUSES,
  RISK_TREATMENTS,
} from './compliance.constants';

/**
 * One risk in the company's register — the record every one of the four standards asks for
 * (ISO 9001 §6.1, 27001 §6.1.2, 45001 §6.1.2, 14001 §6.1.2) and the one an auditor opens first.
 *
 * Both ratings are kept, not just the current one: the inherent rating is what the risk would
 * be with nothing done about it, the residual is what is left after the controls named here.
 * Storing only the second loses the argument for why the controls exist.
 *
 * The reference is drawn from the shared sequence, so a finding, a meeting minute or an
 * auditor's note can cite "RISK-0007" and mean exactly one row.
 */
const riskSchema = new Schema(
  {
    reference: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    /** Which management systems this risk answers to; a company may be certified to several. */
    standards: { type: [String], enum: MANAGEMENT_STANDARDS, default: [] },
    category: { type: String, enum: COMPLIANCE_CATEGORIES, required: true },
    /** What the risk is ABOUT: a process, a system, a site, an information asset. */
    subject: { type: String, default: '', trim: true },
    /** Who carries it. A risk with no owner is a note, not a risk. */
    ownerId: { type: String, default: '' },
    ownerName: { type: String, default: '', trim: true },
    likelihood: { type: Number, required: true, min: RISK_SCALE_MIN, max: RISK_SCALE_MAX },
    impact: { type: Number, required: true, min: RISK_SCALE_MIN, max: RISK_SCALE_MAX },
    treatment: { type: String, enum: RISK_TREATMENTS, required: true, default: 'REDUCE' },
    /** The controls already in place or planned — what the residual rating below assumes. */
    controls: { type: String, default: '' },
    residualLikelihood: { type: Number, required: true, min: RISK_SCALE_MIN, max: RISK_SCALE_MAX },
    residualImpact: { type: Number, required: true, min: RISK_SCALE_MIN, max: RISK_SCALE_MAX },
    status: { type: String, enum: RISK_STATUSES, required: true, default: 'IDENTIFIED' },
    identifiedOn: { type: Date, required: true },
    /** When this rating must be looked at again; what the overdue list is built from. */
    reviewDueOn: { type: Date, default: null },
    closedOn: { type: Date, default: null },
  },
  { timestamps: true },
);

// One register per company (the tenancy plugin scopes this), read by rating and by review date.
riskSchema.index({ reference: 1 }, { unique: true });
riskSchema.index({ status: 1, reviewDueOn: 1 });

export type RiskDocument = InferSchemaType<typeof riskSchema>;
export const RiskModel: Model<RiskDocument> = model<RiskDocument>('Risk', riskSchema);

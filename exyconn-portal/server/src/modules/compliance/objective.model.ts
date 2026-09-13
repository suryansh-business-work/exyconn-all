import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import {
  COMPLIANCE_CATEGORIES,
  MANAGEMENT_STANDARDS,
  OBJECTIVE_FREQUENCIES,
  OBJECTIVE_SCOPES,
  OBJECTIVE_STATUSES,
} from './compliance.constants';

/**
 * An objective the company set itself and measures — ISO 9001 §6.2, 27001 §6.2, 45001 §6.2,
 * 14001 §6.2. The organisation's, not a person's: an employee's appraisal goals live in the
 * HR `Goal` model, and mixing the two would put someone's rating in front of an auditor.
 *
 * Three numbers rather than a percentage: where the measure started, where it must get to,
 * and where it is now. The percentage is derived from them (`objectiveAchievement`), so an
 * objective to REDUCE something reads correctly rather than looking like a failure.
 */
const objectiveSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    standards: { type: [String], enum: MANAGEMENT_STANDARDS, default: [] },
    category: { type: String, enum: COMPLIANCE_CATEGORIES, required: true },
    scope: { type: String, enum: OBJECTIVE_SCOPES, required: true, default: 'COMPANY' },
    /** The department or process it belongs to; empty for a company-wide objective. */
    area: { type: String, default: '', trim: true },
    ownerId: { type: String, default: '' },
    ownerName: { type: String, default: '', trim: true },
    /** How it is measured, in words — "complaints per 1,000 orders". */
    measure: { type: String, required: true, trim: true },
    unit: { type: String, default: '', trim: true },
    baseline: { type: Number, required: true, default: 0 },
    target: { type: Number, required: true },
    actual: { type: Number, required: true, default: 0 },
    frequency: { type: String, enum: OBJECTIVE_FREQUENCIES, required: true, default: 'QUARTERLY' },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    status: { type: String, enum: OBJECTIVE_STATUSES, required: true, default: 'PLANNED' },
    /** What is being done to get there, and by whom — the plan clause 6.2 asks for. */
    plan: { type: String, default: '' },
  },
  { timestamps: true },
);

objectiveSchema.index({ status: 1, periodEnd: -1 });

export type ObjectiveDocument = InferSchemaType<typeof objectiveSchema>;
export const ObjectiveModel: Model<ObjectiveDocument> = model<ObjectiveDocument>(
  'Objective',
  objectiveSchema,
);

import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { COMPLIANCE_CATEGORIES, MANAGEMENT_STANDARDS } from './compliance.constants';

/** Where the finding came from. One register whatever raised it. */
export const FINDING_SOURCES = [
  'INTERNAL_AUDIT',
  'EXTERNAL_AUDIT',
  'CUSTOMER_COMPLAINT',
  'INCIDENT',
  'MANAGEMENT_REVIEW',
  'EMPLOYEE_REPORT',
  'SUPPLIER',
  'OTHER',
] as const;

/**
 * How serious it is. A major nonconformity is a system failure, a minor one is a lapse, an
 * observation is a warning that has not failed yet, and an opportunity is an improvement
 * nobody is obliged to make — the four an auditor uses.
 */
export const FINDING_TYPES = [
  'MAJOR_NONCONFORMITY',
  'MINOR_NONCONFORMITY',
  'OBSERVATION',
  'OPPORTUNITY',
] as const;

/**
 * The corrective-action lifecycle, and the reason this is one record rather than two: a
 * nonconformity is not closed when something was done about it, but when somebody checked
 * that what was done worked (clause 10.2 — "review the effectiveness").
 */
export const FINDING_STATUSES = [
  'OPEN',
  'ACTION_AGREED',
  'IMPLEMENTED',
  'VERIFIED',
  'CLOSED',
] as const;

const findingSchema = new Schema(
  {
    reference: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    source: { type: String, enum: FINDING_SOURCES, required: true, default: 'INTERNAL_AUDIT' },
    /** The audit that raised it, when one did. */
    auditId: { type: String, default: '' },
    /** The risk it realises, when it is one already on the register. */
    riskId: { type: String, default: '' },
    standards: { type: [String], enum: MANAGEMENT_STANDARDS, default: [] },
    category: { type: String, enum: COMPLIANCE_CATEGORIES, required: true },
    /** The clause it fails, written as the standard numbers it: "27001:A.5.15". */
    clause: { type: String, default: '', trim: true },
    type: { type: String, enum: FINDING_TYPES, required: true, default: 'MINOR_NONCONFORMITY' },
    /** What was done at once to contain it, before anybody understood why it happened. */
    immediateAction: { type: String, default: '' },
    rootCause: { type: String, default: '' },
    /** What is being changed so it does not happen again. */
    correctiveAction: { type: String, default: '' },
    ownerId: { type: String, default: '' },
    ownerName: { type: String, default: '', trim: true },
    raisedOn: { type: Date, required: true },
    dueOn: { type: Date, default: null },
    status: { type: String, enum: FINDING_STATUSES, required: true, default: 'OPEN' },
    verifiedOn: { type: Date, default: null },
    verifiedByName: { type: String, default: '', trim: true },
    /** Whether the correction actually worked — the question clause 10.2 ends on. */
    effective: { type: Boolean, default: null },
    effectivenessNote: { type: String, default: '' },
    closedOn: { type: Date, default: null },
  },
  { timestamps: true },
);

findingSchema.index({ reference: 1 }, { unique: true });
findingSchema.index({ status: 1, dueOn: 1 });
findingSchema.index({ auditId: 1 });

export type FindingDocument = InferSchemaType<typeof findingSchema>;
export const FindingModel: Model<FindingDocument> = model<FindingDocument>(
  'Finding',
  findingSchema,
);

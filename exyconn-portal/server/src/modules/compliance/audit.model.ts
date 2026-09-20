import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { attachmentSchema } from '../../lib/attachments';
import { MANAGEMENT_STANDARDS } from './compliance.constants';

/** Who is auditing whom: our own audit, a certification body's, or one of a supplier. */
export const AUDIT_KINDS = ['INTERNAL', 'EXTERNAL', 'SUPPLIER'] as const;

export const AUDIT_STATUSES = ['PLANNED', 'IN_PROGRESS', 'REPORTED', 'CLOSED'] as const;

/**
 * One audit in the company's programme — clause 9.2 of each standard.
 *
 * The programme itself is not a second record: a year's programme is the audits planned for
 * it, which is what an auditor is shown. `criteria` is what was audited against (the clauses,
 * a policy, a contract) and `scope` is what was audited, because a finding needs both to mean
 * anything later.
 *
 * Findings live in their own register and point back here, so a nonconformity raised in an
 * audit and one raised by a customer complaint are tracked and closed the same way.
 */
const internalAuditSchema = new Schema(
  {
    reference: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    kind: { type: String, enum: AUDIT_KINDS, required: true, default: 'INTERNAL' },
    standards: { type: [String], enum: MANAGEMENT_STANDARDS, default: [] },
    /** What was audited: a process, a department, a site, a supplier. */
    scope: { type: String, required: true, trim: true },
    /** What it was audited AGAINST — clauses, a policy, a contract. */
    criteria: { type: String, default: '' },
    leadAuditorId: { type: String, default: '' },
    leadAuditorName: { type: String, default: '', trim: true },
    /** Who was audited; a name rather than a user, since it may be a team or a supplier. */
    auditeeName: { type: String, default: '', trim: true },
    plannedOn: { type: Date, required: true },
    performedOn: { type: Date, default: null },
    status: { type: String, enum: AUDIT_STATUSES, required: true, default: 'PLANNED' },
    /** The report: what was looked at and what was seen. */
    summary: { type: String, default: '' },
    /** The auditor's conclusion — whether the system conforms, and how well it works. */
    conclusion: { type: String, default: '' },
    /** The audit's own papers: the plan, the checklist, the report as it was issued. */
    evidence: { type: [attachmentSchema], default: [] },
  },
  { timestamps: true },
);

internalAuditSchema.index({ reference: 1 }, { unique: true });
internalAuditSchema.index({ status: 1, plannedOn: -1 });

export type InternalAuditDocument = InferSchemaType<typeof internalAuditSchema>;
export const InternalAuditModel: Model<InternalAuditDocument> = model<InternalAuditDocument>(
  'InternalAudit',
  internalAuditSchema,
);

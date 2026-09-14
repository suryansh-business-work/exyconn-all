import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { MANAGEMENT_STANDARDS } from './compliance.constants';

export const REVIEW_STATUSES = ['PLANNED', 'HELD', 'MINUTED'] as const;

/** One action leadership agreed in the meeting, and whether it has since been done. */
const reviewActionSchema = new Schema(
  {
    description: { type: String, required: true, trim: true },
    ownerName: { type: String, default: '', trim: true },
    dueOn: { type: Date, default: null },
    done: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);

/**
 * A management review — clause 9.3, the meeting at which the people who run the company look
 * at whether the management system is working and decide what to change.
 *
 * The inputs are kept as written text rather than pulled from the registers automatically:
 * the standard asks what leadership CONSIDERED, and a record that silently re-renders from
 * today's data would say something different every time it was opened, which is the one thing
 * a minute must never do.
 */
const managementReviewSchema = new Schema(
  {
    reference: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    standards: { type: [String], enum: MANAGEMENT_STANDARDS, default: [] },
    heldOn: { type: Date, required: true },
    chairName: { type: String, default: '', trim: true },
    /** Who was there, as written in the minute. */
    attendees: { type: String, default: '' },
    /** What was put in front of the meeting: audit results, objectives, findings, feedback. */
    inputs: { type: String, default: '' },
    /** What it concluded about the system's suitability, adequacy and effectiveness. */
    decisions: { type: String, default: '' },
    actions: { type: [reviewActionSchema], default: [] },
    status: { type: String, enum: REVIEW_STATUSES, required: true, default: 'PLANNED' },
  },
  { timestamps: true },
);

managementReviewSchema.index({ reference: 1 }, { unique: true });
managementReviewSchema.index({ heldOn: -1 });

export type ManagementReviewDocument = InferSchemaType<typeof managementReviewSchema>;
export const ManagementReviewModel: Model<ManagementReviewDocument> =
  model<ManagementReviewDocument>('ManagementReview', managementReviewSchema);

import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const REVIEW_STATUSES = ['OPEN', 'SELF_SUBMITTED', 'MANAGER_SUBMITTED', 'CLOSED'] as const;

const reviewSchema = new Schema(
  {
    employeeId: { type: String, required: true, index: true },
    /** Appraisal cycle label, e.g. "H1 2026". */
    cycle: { type: String, required: true, trim: true },
    selfAssessment: { type: String, default: '' },
    managerAssessment: { type: String, default: '' },
    competencies: { type: String, default: '' },
    score: { type: Number, default: null, min: 0, max: 10 },
    rating: { type: String, default: null },
    actionPlan: { type: String, default: '' },
    status: { type: String, enum: REVIEW_STATUSES, required: true, default: 'OPEN' },
  },
  { timestamps: true },
);

reviewSchema.index({ employeeId: 1, createdAt: -1 });

export type PerformanceReviewDocument = InferSchemaType<typeof reviewSchema>;
export const PerformanceReviewModel: Model<PerformanceReviewDocument> =
  model<PerformanceReviewDocument>('PerformanceReview', reviewSchema);

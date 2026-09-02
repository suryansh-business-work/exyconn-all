import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const GOAL_STATUSES = ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const;

const goalSchema = new Schema(
  {
    employeeId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    /** What success is measured on. */
    kpi: { type: String, default: '' },
    /** Share of the appraisal this goal carries, in percent. */
    weightage: { type: Number, required: true, min: 0, max: 100, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    /** Employee-updated completion, 0-100. */
    progress: { type: Number, required: true, min: 0, max: 100, default: 0 },
    status: { type: String, enum: GOAL_STATUSES, required: true, default: 'ACTIVE' },
    managerComment: { type: String, default: null },
  },
  { timestamps: true },
);

goalSchema.index({ employeeId: 1, endDate: -1 });

export type GoalDocument = InferSchemaType<typeof goalSchema>;
export const GoalModel: Model<GoalDocument> = model<GoalDocument>('Goal', goalSchema);

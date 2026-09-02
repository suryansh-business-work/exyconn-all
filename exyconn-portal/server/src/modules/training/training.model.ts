import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const TRAINING_STATUSES = ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'] as const;

const trainingSchema = new Schema(
  {
    employeeId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    provider: { type: String, default: '' },
    category: { type: String, default: '' },
    assignedOn: { type: Date, required: true, default: Date.now },
    dueOn: { type: Date, default: null },
    completedOn: { type: Date, default: null },
    status: { type: String, enum: TRAINING_STATUSES, required: true, default: 'ASSIGNED' },
    certificateUrl: { type: String, default: null },
  },
  { timestamps: true },
);

trainingSchema.index({ employeeId: 1, dueOn: 1 });

export type TrainingDocument = InferSchemaType<typeof trainingSchema>;
export const TrainingModel: Model<TrainingDocument> = model<TrainingDocument>(
  'Training',
  trainingSchema,
);

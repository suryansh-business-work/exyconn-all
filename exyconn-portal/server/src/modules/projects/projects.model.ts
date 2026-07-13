import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const PROJECT_STATUSES = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED'] as const;

const projectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: null },
    status: { type: String, enum: PROJECT_STATUSES, required: true, default: 'PLANNING' },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  { timestamps: true },
);

export type ProjectDocument = InferSchemaType<typeof projectSchema>;
export const ProjectModel: Model<ProjectDocument> = model<ProjectDocument>(
  'Project',
  projectSchema,
);

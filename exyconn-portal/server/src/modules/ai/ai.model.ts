import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const AI_JOB_STATUSES = ['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED'] as const;

const aiJobSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    prompt: { type: String, required: true, trim: true },
    status: { type: String, enum: AI_JOB_STATUSES, required: true, default: 'QUEUED' },
  },
  { timestamps: true },
);

export type AiJobDocument = InferSchemaType<typeof aiJobSchema>;
export const AiJobModel: Model<AiJobDocument> = model<AiJobDocument>('AiJob', aiJobSchema);

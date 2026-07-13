import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const BUG_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const BUG_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

const bugSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    severity: { type: String, enum: BUG_SEVERITIES, required: true, default: 'MEDIUM' },
    status: { type: String, enum: BUG_STATUSES, required: true, default: 'OPEN' },
    assignee: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true },
);

export type BugDocument = InferSchemaType<typeof bugSchema>;
export const BugModel: Model<BugDocument> = model<BugDocument>('Bug', bugSchema);

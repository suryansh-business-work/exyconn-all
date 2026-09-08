import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const BUG_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const BUG_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

const bugSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    severity: { type: String, enum: BUG_SEVERITIES, required: true, default: 'MEDIUM' },
    status: { type: String, enum: BUG_STATUSES, required: true, default: 'OPEN' },
    /** The project the bug was found in. `projectName` is denormalised from it on write. */
    projectId: { type: String, default: '', trim: true },
    projectName: { type: String, default: '', trim: true },
    /** Who is fixing it. `assigneeName` is denormalised from the user on write. */
    assigneeId: { type: String, default: '', trim: true },
    assigneeName: { type: String, default: '', trim: true },
    /**
     * Legacy: the free-text assignee bugs carried before they pointed at a user. Read-only —
     * nothing writes it any more, and it shows only while `assigneeName` is empty.
     */
    assignee: { type: String, default: '', trim: true },
    /** The board ticket this bug became, once promoted. Empty until then. */
    taskId: { type: String, default: '', trim: true },
    taskKey: { type: String, default: '', trim: true },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true },
);

export type BugDocument = InferSchemaType<typeof bugSchema>;
export const BugModel: Model<BugDocument> = model<BugDocument>('Bug', bugSchema);

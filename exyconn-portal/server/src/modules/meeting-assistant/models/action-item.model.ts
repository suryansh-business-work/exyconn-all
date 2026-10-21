import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { ACTION_STATUSES, PRIORITIES } from '../ma.enums';
import { evidenceSchema } from './evidence.schema';

const commentSchema = new Schema(
  {
    byId: { type: String, required: true },
    byName: { type: String, default: '' },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const historySchema = new Schema(
  {
    at: { type: Date, required: true },
    byId: { type: String, required: true },
    byName: { type: String, default: '' },
    field: { type: String, required: true },
    from: { type: String, default: '' },
    to: { type: String, default: '' },
  },
  { _id: false },
);

/**
 * One checklist item from a meeting. AI items carry a `fingerprint` so regenerating the
 * notes updates the same row (never a duplicate), and `editedFields` so a regeneration never
 * overwrites what a person changed. An owner or deadline the AI could not be sure of leaves
 * `needsConfirmation` set until a person confirms it.
 */
const actionItemSchema = new Schema(
  {
    meetingId: { type: String, required: true },
    meetingTitle: { type: String, default: '' },
    meetingCode: { type: String, default: '' },
    fingerprint: { type: String, default: null },
    title: { type: String, required: true, trim: true, maxlength: 500 },
    description: { type: String, default: '', maxlength: 5000 },
    assignedTo: { type: String, default: null, trim: true },
    assignedUserId: { type: String, default: null },
    /** Only ever a verified address: a portal account's email. */
    assignedEmail: { type: String, default: null },
    dueDate: { type: Date, default: null },
    /** The deadline as it was said ("by Friday"), kept when it could not be pinned to a date. */
    dueText: { type: String, default: null },
    priority: { type: String, enum: PRIORITIES, default: 'MEDIUM' },
    status: { type: String, enum: ACTION_STATUSES, default: 'PENDING' },
    sourceTimestampMs: { type: Number, default: null },
    evidence: { type: [evidenceSchema], default: [] },
    confidence: { type: Number, default: null, min: 0, max: 1 },
    aiGenerated: { type: Boolean, default: false },
    needsConfirmation: { type: Boolean, default: false },
    editedFields: { type: [String], default: [] },
    completedAt: { type: Date, default: null },
    createdById: { type: String, required: true },
    createdByName: { type: String, default: '' },
    updatedById: { type: String, default: null },
    updatedByName: { type: String, default: '' },
    /** Copied from the meeting so the checklist can be scoped without a join. */
    viewerIds: { type: [String], default: [] },
    comments: { type: [commentSchema], default: [] },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true },
);

actionItemSchema.index(
  { meetingId: 1, fingerprint: 1 },
  { unique: true, partialFilterExpression: { fingerprint: { $type: 'string' } } },
);
actionItemSchema.index({ status: 1, dueDate: 1 });
actionItemSchema.index({ viewerIds: 1, status: 1 });
actionItemSchema.index({ meetingCode: 1, status: 1 });

export type MaActionItemDocument = InferSchemaType<typeof actionItemSchema>;

export const MaActionItemModel: Model<MaActionItemDocument> = model<MaActionItemDocument>(
  'MaActionItem',
  actionItemSchema,
);

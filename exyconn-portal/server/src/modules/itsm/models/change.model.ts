import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { IT_CHANGE_STATUSES, IT_CHANGE_TYPES, IT_ENVIRONMENTS, IT_RISKS } from '../itsm.enums';

/**
 * A planned change to a system — a deployment, a config change, a migration. Its status is
 * its history: drafted, approved, scheduled, then implemented, failed or rolled back. The
 * audit log keeps every edit on top of that.
 */
const changeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: { type: String, enum: IT_CHANGE_TYPES, required: true, default: 'NORMAL' },
    risk: { type: String, enum: IT_RISKS, required: true, default: 'MEDIUM' },
    environment: { type: String, enum: IT_ENVIRONMENTS, required: true, default: 'PRODUCTION' },
    /** The system being changed, e.g. "Portal API". */
    system: { type: String, required: true, trim: true },
    status: { type: String, enum: IT_CHANGE_STATUSES, required: true, default: 'DRAFT' },
    plannedStart: { type: Date, required: true },
    plannedEnd: { type: Date, required: true },
    implementedAt: { type: Date, default: null },
    ownerName: { type: String, default: '', trim: true },
    rollbackPlan: { type: String, default: '', trim: true },
    requestedById: { type: String, default: '', trim: true },
    decidedByName: { type: String, default: '', trim: true },
    decidedAt: { type: Date, default: null },
    decisionNote: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export type ItChangeDocument = InferSchemaType<typeof changeSchema>;
export const ItChangeModel: Model<ItChangeDocument> = model<ItChangeDocument>(
  'ItChange',
  changeSchema,
);

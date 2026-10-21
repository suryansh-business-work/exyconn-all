import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { LEGAL_ITEM_KINDS } from './legal-group.model';

/**
 * One contract, policy or document handed to one employee, and who handed it over.
 *
 * Kept apart from the item so an item can go to many people and a person can hold many
 * items; the person reads theirs on their profile. Unique per (kind, item, person), so
 * assigning twice is a no-op rather than a duplicate row.
 */
const legalAssignmentSchema = new Schema(
  {
    kind: { type: String, enum: LEGAL_ITEM_KINDS, required: true },
    itemId: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    assignedById: { type: String, required: true },
    assignedByName: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

legalAssignmentSchema.index({ kind: 1, itemId: 1, userId: 1 }, { unique: true });

export type LegalAssignmentDocument = InferSchemaType<typeof legalAssignmentSchema>;
export const LegalAssignmentModel: Model<LegalAssignmentDocument> = model<LegalAssignmentDocument>(
  'LegalAssignment',
  legalAssignmentSchema,
);

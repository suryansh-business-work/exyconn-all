import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * One spell of an asset being held by one person.
 *
 * A row is opened when an asset is handed over and closed — `returnedAt` set — when it comes
 * back or moves on. Exactly one row per asset may be open at a time; that invariant is what
 * makes "who had this laptop in March" answerable, and what stops an employee who has left
 * from keeping a dangling open row against a machine somebody else is now using.
 *
 * The asset tag and the employee's name are denormalised because the history is read long
 * after the fact: an asset may be retired and an employee may have left, and a row that could
 * only be read by joining to records that no longer exist is not a history.
 */
const assetAssignmentSchema = new Schema(
  {
    assetId: { type: String, required: true, index: true },
    assetTag: { type: String, default: '', trim: true },
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, default: '', trim: true },
    assignedAt: { type: Date, required: true, default: Date.now },
    /** Null while the person still holds it. Set the moment it moves on. */
    returnedAt: { type: Date, default: null },
    assignedByName: { type: String, default: '', trim: true },
    note: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export type AssetAssignmentDocument = InferSchemaType<typeof assetAssignmentSchema>;

export const AssetAssignmentModel: Model<AssetAssignmentDocument> =
  model<AssetAssignmentDocument>('AssetAssignment', assetAssignmentSchema);

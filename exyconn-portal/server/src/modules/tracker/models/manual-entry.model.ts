import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { MANUAL_ENTRY_STATUSES } from '../tracker.constants';

/**
 * Work done away from the computer — a client meeting, a site visit, a phone call.
 *
 * Deliberately NOT an interval or a session. Everything in those is measured: the app
 * counted the input and took the screenshots. This is *claimed*, by a person, and it stays
 * a separate record with a separate approval so no report can ever quietly present the two
 * as the same kind of evidence. Only an APPROVED entry counts towards anything.
 */
const trackerManualEntrySchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    /** The project the time is booked against, resolved the same way a session's is. */
    projectId: { type: String, default: '', index: true },
    /** Denormalised, so a renamed project cannot rewrite an approved timesheet. */
    projectName: { type: String, default: '', trim: true },
    startedAt: { type: Date, required: true, index: true },
    endedAt: { type: Date, required: true },
    /** Derived from the window on write, so reports never re-derive it inconsistently. */
    durationMs: { type: Number, required: true, min: 0 },
    /** What the time was for. Required — unexplained claimed time is not reviewable. */
    note: { type: String, required: true, trim: true },
    status: {
      type: String,
      required: true,
      enum: MANUAL_ENTRY_STATUSES,
      default: 'PENDING',
      index: true,
    },
    /** User id of the reviewer; empty while the entry is still pending. */
    reviewedBy: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
    /** The reviewer's reason, which matters most when an entry is rejected. */
    reviewNote: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

trackerManualEntrySchema.index({ userId: 1, startedAt: -1 });
trackerManualEntrySchema.index({ status: 1, startedAt: -1 });

export type TrackerManualEntryDocument = InferSchemaType<typeof trackerManualEntrySchema>;
export const TrackerManualEntryModel: Model<TrackerManualEntryDocument> =
  model<TrackerManualEntryDocument>('TrackerManualEntry', trackerManualEntrySchema);

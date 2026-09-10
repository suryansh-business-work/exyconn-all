import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { PRESENCE_STATUSES } from '../tracker.constants';

/**
 * Grants an employee the right to use the desktop tracker. Without an active grant the
 * app refuses to sign in, so tracking can never start for someone who was not explicitly
 * given access (and emailed about it).
 */
const trackerAccessSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    grantedBy: { type: String, required: true },
    grantedAt: { type: Date, required: true, default: Date.now },
    revokedAt: { type: Date, default: null },
    revokedBy: { type: String, default: '' },
    isActive: { type: Boolean, required: true, default: true },
    /** Whether the employee has accepted the in-app consent screen, and when. */
    consentedAt: { type: Date, default: null },
    /**
     * The IANA zone this employee picked for themselves in the desktop app. Empty string =
     * they never picked one, and the house default (or their device's zone) applies.
     */
    timezone: { type: String, default: '', trim: true },
    /**
     * What the employee has said they are doing, from the desktop app.
     *
     * Their own statement, never inferred: a quiet keyboard means the keyboard was quiet, and
     * a tracker that decided on its own that somebody was at lunch would be telling their
     * manager something nobody actually said.
     */
    presence: { type: String, enum: PRESENCE_STATUSES, default: 'WORKING' },
    /** The employee's own words for it — "back at 2", "client call". Optional. */
    presenceNote: { type: String, default: '', trim: true },
    /** When they last said it, so "on lunch since 11am yesterday" reads as the stale claim it is. */
    presenceAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type TrackerAccessDocument = InferSchemaType<typeof trackerAccessSchema>;
export const TrackerAccessModel: Model<TrackerAccessDocument> = model<TrackerAccessDocument>(
  'TrackerAccess',
  trackerAccessSchema,
);

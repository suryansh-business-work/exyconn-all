import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { NOTIFICATION_KINDS } from './notification.model';

/**
 * What one person wants to be told about, and where.
 *
 * The kinds were split when notifications were built "so somebody who wants the comments but
 * not the likes has something to filter on later". This is later: the reminder sweep now
 * chases contracts, reviews, corrective actions and follow-ups, and without a way to turn a
 * kind down the bell becomes something people stop reading.
 *
 * A row exists only once somebody has changed something. Absent means the default, which is
 * every kind in the portal and none by email — chosen so that adding a new kind never
 * silently starts mailing anybody.
 */
const preferenceSchema = new Schema(
  {
    employeeId: { type: String, required: true },
    kind: { type: String, enum: NOTIFICATION_KINDS, required: true },
    inPortal: { type: Boolean, required: true, default: true },
    email: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

// One row per person per kind; the delivery path reads a person's whole set at once.
preferenceSchema.index({ employeeId: 1, kind: 1 }, { unique: true });

export type NotificationPreferenceDocument = InferSchemaType<typeof preferenceSchema>;
export const NotificationPreferenceModel: Model<NotificationPreferenceDocument> =
  model<NotificationPreferenceDocument>('NotificationPreference', preferenceSchema);

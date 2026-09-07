import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * Somebody who asked to be told when the platform breaks.
 *
 * Double opt-in: a row exists from the moment an address is entered, but nothing is sent
 * to it until `confirmedAt` is set — otherwise anyone could sign a stranger up for every
 * outage email we ever send. Only the SHA-256 of each token is stored, so a copy of the
 * collection cannot be turned into working confirm or unsubscribe links.
 */
const statusSubscriberSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    confirmedAt: { type: Date, default: null },
    /** Single-use: cleared the moment the subscription is confirmed. */
    tokenHash: { type: String, default: '' },
    /** Rotated on every notice, so the link in the newest email always works. */
    unsubscribeTokenHash: { type: String, default: '' },
  },
  { timestamps: true },
);

export type StatusSubscriberDocument = InferSchemaType<typeof statusSubscriberSchema>;

export const StatusSubscriberModel: Model<StatusSubscriberDocument> =
  model<StatusSubscriberDocument>('StatusSubscriber', statusSubscriberSchema);

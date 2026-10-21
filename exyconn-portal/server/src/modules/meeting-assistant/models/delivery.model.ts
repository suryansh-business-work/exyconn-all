import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { DELIVERY_STATUSES } from '../ma.enums';

/**
 * One summary email to one recipient for one version of the notes. The unique index is the
 * exactly-once guarantee: the row is inserted BEFORE the send, so a retried job finds it and
 * never mails the same person the same version twice.
 */
const deliverySchema = new Schema(
  {
    meetingId: { type: String, required: true },
    notesVersion: { type: Number, required: true, min: 1 },
    recipient: { type: String, required: true, trim: true, lowercase: true },
    status: { type: String, enum: DELIVERY_STATUSES, default: 'PENDING' },
    attempts: { type: Number, default: 0, min: 0 },
    error: { type: String, default: '' },
    sentAt: { type: Date, default: null },
    triggeredByName: { type: String, default: '' },
  },
  { timestamps: true },
);

deliverySchema.index({ meetingId: 1, notesVersion: 1, recipient: 1 }, { unique: true });

export type MaDeliveryDocument = InferSchemaType<typeof deliverySchema>;

export const MaDeliveryModel: Model<MaDeliveryDocument> = model<MaDeliveryDocument>(
  'MaEmailDelivery',
  deliverySchema,
);

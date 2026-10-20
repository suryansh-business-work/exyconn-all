import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { LOCATION_KINDS, LOCATION_SOURCES } from '../tracker.constants';

/**
 * One pin on an employee's day: where they marked attendance (ATTENDANCE), or where they had
 * moved to while tracking (MOVE). `day` is midnight UTC of their local date — the same key
 * attendance is stored on — so a day's pins and its attendance row are read together.
 */
const trackerLocationSchema = new Schema(
  {
    userId: { type: String, required: true },
    day: { type: Date, required: true },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
    accuracyM: { type: Number, required: true, min: 0 },
    source: { type: String, required: true, enum: LOCATION_SOURCES },
    kind: { type: String, required: true, enum: LOCATION_KINDS },
    capturedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

trackerLocationSchema.index({ userId: 1, day: 1, capturedAt: 1 });

export type TrackerLocationDocument = InferSchemaType<typeof trackerLocationSchema>;
export const TrackerLocationModel: Model<TrackerLocationDocument> = model<TrackerLocationDocument>(
  'TrackerLocation',
  trackerLocationSchema,
);

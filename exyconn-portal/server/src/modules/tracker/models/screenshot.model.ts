import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * A screenshot captured during an interval. The image itself lives on ImageKit; only its
 * URL is stored here. `blurred` records whether it was blurred at capture time, so the
 * portal can be honest about what a manager is actually looking at.
 */
const trackerScreenshotSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    intervalStartedAt: { type: Date, required: true },
    capturedAt: { type: Date, required: true },
    imageUrl: { type: String, required: true, trim: true },
    displayId: { type: String, default: '', trim: true },
    blurred: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

trackerScreenshotSchema.index({ userId: 1, capturedAt: -1 });

export type TrackerScreenshotDocument = InferSchemaType<typeof trackerScreenshotSchema>;
export const TrackerScreenshotModel: Model<TrackerScreenshotDocument> =
  model<TrackerScreenshotDocument>('TrackerScreenshot', trackerScreenshotSchema);

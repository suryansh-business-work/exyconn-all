import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * A screenshot captured during an interval. The image itself lives on ImageKit; only its
 * URL and file id are stored here. `blurred` records whether it was blurred at capture time, so the
 * portal can be honest about what a manager is actually looking at.
 */
const trackerScreenshotSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    intervalStartedAt: { type: Date, required: true },
    capturedAt: { type: Date, required: true },
    imageUrl: { type: String, required: true, trim: true },
    /**
     * The provider's id for the uploaded file, so retention can actually delete the image
     * and not just our row. Empty on screenshots captured before retention existed — those
     * expire from the database only, and the purge logs how many it could not remove.
     */
    fileId: { type: String, default: '', trim: true },
    displayId: { type: String, default: '', trim: true },
    blurred: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

trackerScreenshotSchema.index({ userId: 1, capturedAt: -1 });

export type TrackerScreenshotDocument = InferSchemaType<typeof trackerScreenshotSchema>;
export const TrackerScreenshotModel: Model<TrackerScreenshotDocument> =
  model<TrackerScreenshotDocument>('TrackerScreenshot', trackerScreenshotSchema);

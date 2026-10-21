import { Schema } from 'mongoose';

/**
 * The transcript line that supports an extracted item: kept with the item so anyone can
 * check what was actually said before trusting it.
 */
export const evidenceSchema = new Schema(
  {
    segmentId: { type: String, required: true },
    quote: { type: String, required: true, maxlength: 1000 },
    startMs: { type: Number, required: true, min: 0 },
    speakerLabel: { type: String, default: null },
  },
  { _id: false },
);

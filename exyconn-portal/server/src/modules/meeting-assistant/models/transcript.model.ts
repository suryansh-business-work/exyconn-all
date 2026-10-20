import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { TRANSCRIPT_SOURCES } from '../ma.enums';

/**
 * One line of a transcript. AI lines come from one uploaded audio chunk (`chunkSeq`, plus
 * the line's `index` within it); official lines from one Meet transcript entry. The unique
 * index is what makes a retried upload or a second import write nothing twice.
 */
const segmentSchema = new Schema(
  {
    meetingId: { type: String, required: true },
    source: { type: String, enum: TRANSCRIPT_SOURCES, required: true },
    /** Which capture stream an AI line came from: the meeting tab or the user's microphone. */
    stream: { type: String, enum: ['TAB', 'MIC', 'MEET'], required: true },
    chunkSeq: { type: Number, required: true, min: 0 },
    index: { type: Number, required: true, min: 0 },
    /** Offset from the meeting start, so lines from both streams interleave in order. */
    startMs: { type: Number, required: true, min: 0 },
    endMs: { type: Number, required: true, min: 0 },
    text: { type: String, required: true, maxlength: 20_000 },
    language: { type: String, default: null },
    /** The original evidence: a diarization label, a Meet participant name, or "You". */
    speakerLabel: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

segmentSchema.index(
  { meetingId: 1, source: 1, stream: 1, chunkSeq: 1, index: 1 },
  { unique: true },
);
segmentSchema.index({ meetingId: 1, startMs: 1 });
segmentSchema.index({ createdAt: 1 });

export type MaSegmentDocument = InferSchemaType<typeof segmentSchema>;

export const MaSegmentModel: Model<MaSegmentDocument> = model<MaSegmentDocument>(
  'MaTranscriptSegment',
  segmentSchema,
);

/**
 * A receipt for one uploaded audio chunk: claimed before transcription so two retries of
 * the same chunk cannot both call OpenAI, and kept so a retry of a finished chunk is a no-op.
 * The audio itself is never stored.
 */
const chunkSchema = new Schema(
  {
    meetingId: { type: String, required: true },
    stream: { type: String, enum: ['TAB', 'MIC'], required: true },
    seq: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['RUNNING', 'DONE', 'FAILED'], default: 'RUNNING' },
    durationMs: { type: Number, default: 0 },
    error: { type: String, default: '' },
  },
  { timestamps: true },
);

chunkSchema.index({ meetingId: 1, stream: 1, seq: 1 }, { unique: true });

export type MaChunkDocument = InferSchemaType<typeof chunkSchema>;

export const MaChunkModel: Model<MaChunkDocument> = model<MaChunkDocument>(
  'MaAudioChunk',
  chunkSchema,
);

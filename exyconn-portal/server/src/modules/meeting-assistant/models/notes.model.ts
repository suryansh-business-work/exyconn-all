import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { SUMMARY_STYLES } from '../ma.enums';

/** The written sections of a meeting's notes. Decisions and actions live in their own rows. */
const contentSchema = new Schema(
  {
    overview: { type: String, default: '' },
    executiveSummary: { type: String, default: '' },
    agenda: { type: [String], default: [] },
    discussionPoints: { type: [String], default: [] },
    risks: { type: [String], default: [] },
    blockers: { type: [String], default: [] },
    openQuestions: { type: [String], default: [] },
    followUps: { type: [String], default: [] },
    nextTopics: { type: [String], default: [] },
  },
  { _id: false },
);

const revisionSchema = new Schema(
  {
    version: { type: Number, required: true },
    byId: { type: String, required: true },
    byName: { type: String, default: '' },
    at: { type: Date, required: true },
    content: { type: contentSchema, required: true },
  },
  { _id: false },
);

/**
 * A meeting's AI notes. `original` is exactly what the model returned and is never edited;
 * `content` is the current version people read and change. `version` increments on every
 * change (generation or edit) and guards edits against overwriting each other.
 */
const notesSchema = new Schema(
  {
    meetingId: { type: String, required: true },
    version: { type: Number, default: 1, min: 1 },
    style: { type: String, enum: SUMMARY_STYLES, required: true },
    model: { type: String, required: true },
    generatedAt: { type: Date, required: true },
    original: { type: contentSchema, required: true },
    content: { type: contentSchema, required: true },
    edited: { type: Boolean, default: false },
    /** Earlier versions, newest last, capped (see notes.service). */
    revisions: { type: [revisionSchema], default: [] },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    costUsd: { type: Number, default: 0 },
  },
  { timestamps: true },
);

notesSchema.index({ meetingId: 1 }, { unique: true });

export type MaNotesDocument = InferSchemaType<typeof notesSchema>;
export type MaNotesContent = InferSchemaType<typeof contentSchema>;

export const MaNotesModel: Model<MaNotesDocument> = model<MaNotesDocument>('MaNotes', notesSchema);

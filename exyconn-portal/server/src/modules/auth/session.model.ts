import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * One sign-in, so a person can see where they are signed in and cut off a device they no
 * longer have.
 *
 * Before this the only revocation was `tokenVersion`, which retires EVERY token at once:
 * losing a laptop meant signing out of every browser and every phone, or doing nothing. A
 * row per sign-in makes the honest answer — "that one, not the rest" — possible.
 *
 * The token itself is not stored, not even hashed: the JWT carries this row's id, and the
 * row's job is only to say whether that session still stands.
 */
const sessionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    /** What the browser called itself, so the list reads as "Chrome on macOS", not a number. */
    userAgent: { type: String, default: '', trim: true },
    /** Where it signed in from. Kept for the person's own "was that me?" judgement. */
    ip: { type: String, default: '', trim: true },
    /**
     * Updated at most once every few minutes rather than on every request: this is a
     * "last seen roughly" for a human reading a list, not an access log.
     */
    lastSeenAt: { type: Date, required: true, default: Date.now },
    /** Set when the person (or a password change) ends it. The row is kept, never deleted. */
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// The context reads one session per request; the settings page reads one person's, newest first.
sessionSchema.index({ userId: 1, createdAt: -1 });

export type SessionDocument = InferSchemaType<typeof sessionSchema>;
export const SessionModel: Model<SessionDocument> = model<SessionDocument>(
  'Session',
  sessionSchema,
);

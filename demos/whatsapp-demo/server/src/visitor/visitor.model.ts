import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** Where a visitor first asked for a code: the services page on the website, or the demo's own sign-in. */
export const VISITOR_SOURCES = ['WEBSITE', 'DEMO_LOGIN'] as const;

export type VisitorSource = (typeof VISITOR_SOURCES)[number];

/**
 * A prospect who signs in to the WhatsApp demo with their email and a one-time code — the
 * lead Website › WhatsApp Leads lists.
 *
 * Not a portal user: a visitor holds a demo-only pass that opens the chat screens and nothing
 * else (see visitor.token.ts). Filed under the company that runs the website (the platform
 * operator), like the demos themselves. Blocking or deleting a visitor retires their pass.
 */
const visitorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    company: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    source: { type: String, enum: VISITOR_SOURCES, required: true },
    /** When they first entered a correct code; null until then. */
    verifiedAt: { type: Date, default: null },
    lastSignInAt: { type: Date, default: null },
    signInCount: { type: Number, required: true, default: 0 },
    blocked: { type: Boolean, required: true, default: false },
    /** Raised to retire every pass issued before it. */
    tokenVersion: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

export type VisitorDocument = InferSchemaType<typeof visitorSchema>;

export const WhatsappDemoVisitorModel: Model<VisitorDocument> = model<VisitorDocument>(
  'WhatsappDemoVisitor',
  visitorSchema,
);

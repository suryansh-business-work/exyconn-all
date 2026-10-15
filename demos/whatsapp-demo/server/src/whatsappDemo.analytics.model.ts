import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * What people do in the WhatsApp demo, kept for the admin analytics.
 *
 * Events are append-only and idempotent: the client generates each event's id and resends a
 * batch it is unsure about, so `(organizationId, eventId)` is unique and a repeat is simply
 * refused by the index. A session row is the running aggregate of its events, moved by
 * `$inc`/`$max` beside each insert, so the sessions grid never counts events per row.
 *
 * Nothing the customer typed is stored: a text step records the input KIND the client sends
 * as its label, and the AI parse records only its outcome.
 */
export const WHATSAPP_EVENT_TYPES = [
  'SESSION_START',
  'SESSION_END',
  'DEMO_OPENED',
  'FLOW_STARTED',
  'FLOW_COMPLETED',
  'FLOW_ABANDONED',
  'STEP',
  'REMINDER_DELIVERED',
  'DOCUMENT_OPENED',
  'QR_OPENED',
  'CHAT_CLEARED',
  'AI_CALL',
] as const;
export type WhatsappEventType = (typeof WHATSAPP_EVENT_TYPES)[number];

const eventSchema = new Schema(
  {
    eventId: { type: String, required: true },
    sessionId: { type: String, required: true },
    userId: { type: String, required: true },
    type: { type: String, enum: WHATSAPP_EVENT_TYPES, required: true },
    at: { type: Date, required: true },
    demoKey: { type: String, default: null },
    workflow: { type: String, default: null },
    node: { type: String, default: null },
    stepKind: { type: String, default: null },
    label: { type: String, default: null },
    durationMs: { type: Number, default: null },
    meta: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: false },
);

// The tenant plugin prefixes every unique index with organizationId, so this is the
// (organizationId, eventId) idempotency key.
eventSchema.index({ eventId: 1 }, { unique: true });
eventSchema.index({ sessionId: 1, at: 1 });
eventSchema.index({ type: 1, at: 1 });
eventSchema.index({ demoKey: 1, workflow: 1, type: 1, at: 1 });

const sessionSchema = new Schema(
  {
    sessionId: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, default: '' },
    userEmail: { type: String, default: '' },
    startedAt: { type: Date, required: true },
    lastEventAt: { type: Date, required: true },
    durationMs: { type: Number, required: true, default: 0 },
    device: { type: String, default: null },
    viewport: { type: String, default: null },
    demos: { type: [String], default: [] },
    flowsStarted: { type: Number, required: true, default: 0 },
    flowsCompleted: { type: Number, required: true, default: 0 },
    events: { type: Number, required: true, default: 0 },
  },
  { timestamps: false },
);

sessionSchema.index({ sessionId: 1 }, { unique: true });
sessionSchema.index({ startedAt: -1 });
sessionSchema.index({ lastEventAt: -1 });
sessionSchema.index({ userId: 1, startedAt: -1 });

export type WhatsappDemoEventDocument = InferSchemaType<typeof eventSchema>;
export type WhatsappDemoSessionDocument = InferSchemaType<typeof sessionSchema>;

export const WhatsappDemoEventModel: Model<WhatsappDemoEventDocument> =
  model<WhatsappDemoEventDocument>('WhatsappDemoEvent', eventSchema);
export const WhatsappDemoSessionModel: Model<WhatsappDemoSessionDocument> =
  model<WhatsappDemoSessionDocument>('WhatsappDemoSession', sessionSchema);

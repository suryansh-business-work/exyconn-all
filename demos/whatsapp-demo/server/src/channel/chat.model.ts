import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * One person's conversation with the company's real WhatsApp number: which industry they are
 * trying, the engine's state, the options their last messages offered, and reminders due.
 *
 * Nothing they typed is stored. `options` maps the short id a WhatsApp button or list row
 * carries back to the engine option it stands for; `seen` holds the last message ids, since
 * Meta delivers a webhook again whenever it is not sure the first one arrived.
 */
const whatsappChatSchema = new Schema(
  {
    /** The sender's WhatsApp id (their number, digits only). */
    waId: { type: String, required: true, unique: true },
    name: { type: String, default: '' },
    demoKey: { type: String, default: null },
    state: { type: Schema.Types.Mixed, default: null },
    options: { type: Schema.Types.Mixed, default: {} },
    pending: { type: [Schema.Types.Mixed], default: [] },
    /** The earliest pending reminder, for the reminder loop's query. */
    nextDueAt: { type: Date, default: null, index: true },
    seen: { type: [String], default: [] },
    /** Analytics session, renewed after a long silence. */
    sessionId: { type: String, default: null },
    lastEventAt: { type: Date, default: null },
  },
  { timestamps: true, minimize: false },
);

export type WhatsappChatDocument = InferSchemaType<typeof whatsappChatSchema>;

export const WhatsappChatModel: Model<WhatsappChatDocument> = model<WhatsappChatDocument>(
  'WhatsappChat',
  whatsappChatSchema,
);

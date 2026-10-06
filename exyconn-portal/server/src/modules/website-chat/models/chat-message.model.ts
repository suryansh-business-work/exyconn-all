import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { CHAT_CHANNELS, CHAT_SENDERS } from './chat-session.model';

export const CHAT_ATTACHMENT_KINDS = ['IMAGE', 'VIDEO', 'AUDIO'] as const;
export type ChatAttachmentKind = (typeof CHAT_ATTACHMENT_KINDS)[number];

/** A picture, clip or voice note sent with a message, hosted on ImageKit. */
const chatAttachmentSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    name: { type: String, default: '', trim: true },
    kind: { type: String, enum: CHAT_ATTACHMENT_KINDS, required: true },
    /** Decoded size in bytes. */
    size: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

/** A page the knowledge bot answered from, shown under its answer. */
const chatSourceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, default: '', trim: true },
  },
  { _id: false },
);

export const CHAT_FEEDBACK = ['UP', 'DOWN', ''] as const;

/** One message in a chat session, in either of its two threads. */
const chatMessageSchema = new Schema(
  {
    sessionId: { type: String, required: true, index: true },
    channel: { type: String, enum: CHAT_CHANNELS, required: true },
    sender: { type: String, enum: CHAT_SENDERS, required: true },
    /** The person or bot shown on the bubble; the agent's name for AGENT. */
    senderName: { type: String, default: '', trim: true },
    senderId: { type: String, default: '', trim: true },
    body: { type: String, default: '' },
    attachments: { type: [chatAttachmentSchema], default: [] },
    /** A bot answer's sources, and the follow-up questions it suggests. */
    sources: { type: [chatSourceSchema], default: [] },
    suggestions: { type: [String], default: [] },
    /** The visitor's thumbs up or down on a bot answer. */
    feedback: { type: String, enum: CHAT_FEEDBACK, default: '' },
    /** When the other side read it: the team for a visitor message, the visitor otherwise. */
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

chatMessageSchema.index({ sessionId: 1, createdAt: 1 });

export type ChatMessageDocument = InferSchemaType<typeof chatMessageSchema>;

export const ChatMessageModel: Model<ChatMessageDocument> = model<ChatMessageDocument>(
  'WebsiteChatMessage',
  chatMessageSchema,
);

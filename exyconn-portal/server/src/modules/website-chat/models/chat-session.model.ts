import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** The public site a chat was started on. */
export const CHAT_SITES = ['WEBSITE', 'TOOLS'] as const;
export type ChatSite = (typeof CHAT_SITES)[number];

export const CHAT_STATUSES = ['OPEN', 'CLOSED'] as const;
export type ChatStatus = (typeof CHAT_STATUSES)[number];

/** The two threads of a session: people answering, and the knowledge bot answering. */
export const CHAT_CHANNELS = ['LIVE', 'KNOWLEDGE'] as const;
export type ChatChannel = (typeof CHAT_CHANNELS)[number];

/** Who wrote a message. SYSTEM is the chat itself (handoff and offline notices). */
export const CHAT_SENDERS = ['VISITOR', 'AGENT', 'BOT', 'SYSTEM'] as const;
export type ChatSender = (typeof CHAT_SENDERS)[number];

/**
 * One conversation with a visitor of exyconn.com or tools.exyconn.com, opened after they
 * proved their email with a one-time code. Every session files a support ticket, so the desk
 * sees the conversation in its own queue too.
 *
 * Filed under the company that runs the website (the platform operator), like the WhatsApp
 * demo's visitors. Not a portal user: the visitor holds a chat-only pass (see chat.token.ts),
 * retired at once by raising `tokenVersion`.
 */
const chatSessionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: '', trim: true },
    site: { type: String, enum: CHAT_SITES, required: true },
    /** The page the chat was started from, as the browser reported it. */
    pageUrl: { type: String, default: '', trim: true },
    status: { type: String, enum: CHAT_STATUSES, required: true, default: 'OPEN', index: true },
    ticketId: { type: String, default: '', trim: true },
    ticketReference: { type: String, default: '', trim: true },
    assigneeId: { type: String, default: '', trim: true },
    assigneeName: { type: String, default: '', trim: true },
    lastMessageAt: { type: Date, default: null, index: true },
    lastMessagePreview: { type: String, default: '', trim: true },
    lastSender: { type: String, enum: [...CHAT_SENDERS, ''], default: '' },
    /** Visitor messages nobody on the team has read yet. */
    staffUnread: { type: Number, required: true, default: 0 },
    messageCount: { type: Number, required: true, default: 0 },
    /**
     * When the oldest visitor message nobody has answered in the live thread arrived; null
     * once a person replies. The handoff sweep moves the conversation to the knowledge bot
     * when this is older than the configured wait.
     */
    awaitingReplySince: { type: Date, default: null, index: true },
    handedOffAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    closedBy: { type: String, default: '', trim: true },
    /** Raised to retire every pass issued for this session. */
    tokenVersion: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

chatSessionSchema.index({ status: 1, awaitingReplySince: 1 });

export type ChatSessionDocument = InferSchemaType<typeof chatSessionSchema>;

export const ChatSessionModel: Model<ChatSessionDocument> = model<ChatSessionDocument>(
  'WebsiteChatSession',
  chatSessionSchema,
);

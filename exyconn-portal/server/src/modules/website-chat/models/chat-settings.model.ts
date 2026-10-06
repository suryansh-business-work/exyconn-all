import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** One weekday's opening hours, in the settings' timezone. `day` is 0 (Sunday) to 6. */
const chatDaySchema = new Schema(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    enabled: { type: Boolean, required: true, default: true },
    /** 24-hour "HH:mm". */
    start: { type: String, required: true, default: '09:00' },
    end: { type: String, required: true, default: '18:00' },
  },
  { _id: false },
);

/**
 * How the website chat behaves, one row per company (the operator's is the one that counts).
 * Created with these defaults the first time anything reads it, and edited in
 * Website > Chatbot > Settings.
 */
const chatSettingsSchema = new Schema(
  {
    enabled: { type: Boolean, required: true, default: true },
    botName: { type: String, required: true, trim: true, default: 'Exyconn Assistant' },
    welcomeMessage: {
      type: String,
      required: true,
      trim: true,
      default:
        'Hi there! Ask us anything about Exyconn — our team usually replies in a few minutes.',
    },
    offlineMessage: {
      type: String,
      required: true,
      trim: true,
      default:
        'Our team is offline right now. Our knowledge bot will answer meanwhile, and a person will follow up on your ticket.',
    },
    handoffMessage: {
      type: String,
      required: true,
      trim: true,
      default:
        'Nobody from the team is free yet, so our knowledge bot has picked up your question. A person will still follow up on your ticket.',
    },
    refusalMessage: {
      type: String,
      required: true,
      trim: true,
      default:
        'I can only help with questions about Exyconn, our services and our products. For anything else, please ask our team in the Chat with us tab.',
    },
    /** Extra instructions for the knowledge bot: tone, what to stress. Never widens its scope. */
    customInstructions: { type: String, default: '', trim: true },
    /** IANA timezone the opening hours are read in. */
    timezone: { type: String, required: true, trim: true, default: 'Asia/Kolkata' },
    weeklyHours: {
      type: [chatDaySchema],
      default: () =>
        [0, 1, 2, 3, 4, 5, 6].map((day) => ({
          day,
          enabled: day !== 0 && day !== 6,
          start: '09:00',
          end: '18:00',
        })),
    },
    /** How long a visitor waits for a person before the knowledge bot takes the question. */
    noReplyTimeoutSeconds: { type: Number, required: true, default: 120, min: 30, max: 3600 },
    botModel: { type: String, required: true, trim: true, default: 'gpt-4o' },
    /** How much knowledge text goes to the bot with each question (its context window). */
    maxContextChars: { type: Number, required: true, default: 12000, min: 2000, max: 60000 },
    allowUploads: { type: Boolean, required: true, default: true },
    maxUploadMb: { type: Number, required: true, default: 10, min: 1, max: 10 },
    soundEnabledByDefault: { type: Boolean, required: true, default: true },
    /** Emails the visitor the whole conversation when the chat is closed. */
    transcriptOnClose: { type: Boolean, required: true, default: true },
    /** A chat with no message from either side for this long is closed. */
    sessionTimeoutMinutes: { type: Number, required: true, default: 10, min: 2, max: 120 },
    /** The OpenAI model the knowledge is embedded with, for finding what a question is about. */
    embeddingModel: { type: String, required: true, trim: true, default: 'text-embedding-3-small' },
    /**
     * The team members a new chat may be handed to (portal user ids). Each chat goes to the
     * freest of them: online first, then the fewest open chats. Empty leaves chats unassigned.
     */
    agentIds: { type: [String], default: [] },
    /** Tells the assigned agent on Slack, in a thread they can answer the visitor from. */
    slackEnabled: { type: Boolean, required: true, default: false },
    knowledgeSyncedAt: { type: Date, default: null },
    knowledgeSyncCount: { type: Number, required: true, default: 0 },
    knowledgeSyncError: { type: String, default: '' },
  },
  { timestamps: true },
);

export type ChatSettingsDocument = InferSchemaType<typeof chatSettingsSchema>;

export const ChatSettingsModel: Model<ChatSettingsDocument> = model<ChatSettingsDocument>(
  'WebsiteChatSettings',
  chatSettingsSchema,
);

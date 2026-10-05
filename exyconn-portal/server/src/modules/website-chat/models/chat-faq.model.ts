import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** A question and answer shown in the chat widget's FAQs tab, lowest `sortOrder` first. */
const chatFaqSchema = new Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 300 },
    answer: { type: String, required: true, trim: true, maxlength: 2000 },
    sortOrder: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

export type ChatFaqDocument = InferSchemaType<typeof chatFaqSchema>;

export const ChatFaqModel: Model<ChatFaqDocument> = model<ChatFaqDocument>(
  'WebsiteChatFaq',
  chatFaqSchema,
);

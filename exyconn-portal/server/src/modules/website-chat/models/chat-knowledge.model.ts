import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** Where a piece of knowledge came from: the synced website, or written in the portal. */
export const KNOWLEDGE_SOURCES = ['WEBSITE', 'CUSTOM'] as const;

/**
 * What the knowledge bot may answer from. WEBSITE rows are replaced on every sync of
 * exyconn.com (pages, blog posts, case studies); CUSTOM rows are written by the website team
 * and never touched by a sync.
 */
const chatKnowledgeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 300 },
    url: { type: String, default: '', trim: true, maxlength: 500 },
    content: { type: String, required: true, maxlength: 20000 },
    source: { type: String, enum: KNOWLEDGE_SOURCES, required: true, default: 'CUSTOM' },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

chatKnowledgeSchema.index({ source: 1, isActive: 1 });

export type ChatKnowledgeDocument = InferSchemaType<typeof chatKnowledgeSchema>;

export const ChatKnowledgeModel: Model<ChatKnowledgeDocument> = model<ChatKnowledgeDocument>(
  'WebsiteChatKnowledge',
  chatKnowledgeSchema,
);

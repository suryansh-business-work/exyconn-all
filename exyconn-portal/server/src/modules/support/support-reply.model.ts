import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * One message on a ticket. `internal` marks a note the team writes to itself:
 * it belongs on the ticket's history but must never be shown to the employee who
 * raised it, so the employee-facing query filters on it.
 */
const supportReplySchema = new Schema(
  {
    ticketId: { type: String, required: true, index: true, trim: true },
    authorId: { type: String, required: true, trim: true },
    authorName: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    internal: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

export type SupportReplyDocument = InferSchemaType<typeof supportReplySchema>;

export const SupportReplyModel: Model<SupportReplyDocument> = model<SupportReplyDocument>(
  'SupportReply',
  supportReplySchema,
);

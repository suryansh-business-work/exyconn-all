import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * The mailbox the support desk reads. Mail arriving there becomes a ticket, or a reply
 * on the ticket whose reference it quotes.
 *
 * DB-backed like the outgoing SMTP config next to it, so the address support publishes
 * can be changed without a redeploy. Exactly one document is `isActive` at a time; with
 * none active the poller stands down rather than guessing which mailbox to read.
 */
const inboundMailConfigSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    host: { type: String, required: true, trim: true },
    port: { type: Number, required: true, default: 993 },
    secure: { type: Boolean, required: true, default: true },
    user: { type: String, required: true, trim: true },
    /** Never read back out of the API — see `tech.typeDefs`, which has no password field. */
    password: { type: String, required: true },
    mailbox: { type: String, required: true, default: 'INBOX', trim: true },
    pollSeconds: { type: Number, required: true, default: 120 },
    isActive: { type: Boolean, required: true, default: false },
    /**
     * Whether an imported message is deleted from the mailbox. Off by default: a message
     * that turned into a ticket is still the only copy of what the customer actually
     * sent, and marking it seen is enough to stop it being imported twice.
     */
    deleteAfterImport: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

export type InboundMailConfigDocument = InferSchemaType<typeof inboundMailConfigSchema>;

export const InboundMailConfigModel: Model<InboundMailConfigDocument> =
  model<InboundMailConfigDocument>('InboundMailConfig', inboundMailConfigSchema);

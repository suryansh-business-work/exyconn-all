import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * One conversation of a connected Gmail mailbox as CRM > Mail lists it: what the list shows
 * (who, subject, snippet, when, read and starred) and the Gmail labels its folders are cut by.
 * Kept by the mail sync (crm-mail.sync) so the list pages, searches and counts in Mongo
 * instead of asking Gmail on every page; the messages themselves are read live when a
 * conversation is opened. Company-scoped through the tenancy plugin like every CRM record.
 */
const crmMailThreadSchema = new Schema(
  {
    /** The connected mailbox (GmailAccount) the conversation is in. */
    accountId: { type: String, required: true, trim: true },
    mailbox: { type: String, required: true, trim: true, lowercase: true },
    /** Gmail's thread id: unique within one mailbox only. */
    threadId: { type: String, required: true, trim: true },
    /** Gmail's change marker: a thread is read again only when it moved on. */
    historyId: { type: String, default: '' },
    subject: { type: String, default: '' },
    /** The newest message's preview, HTML entities decoded: render it as text. */
    snippet: { type: String, default: '' },
    /** Who wrote the newest message. */
    fromName: { type: String, default: '' },
    fromAddress: { type: String, default: '', lowercase: true },
    /** Every address on the conversation, lower-cased: what search and record links use. */
    participants: { type: [String], default: [] },
    /** Gmail's labels on any of its messages (INBOX, SENT, STARRED, UNREAD, …). */
    labelIds: { type: [String], default: [] },
    unread: { type: Boolean, default: false },
    starred: { type: Boolean, default: false },
    messageCount: { type: Number, default: 0 },
    hasAttachments: { type: Boolean, default: false },
    /** Every RFC 5322 Message-ID, oldest first, so a reply threads under all of them. */
    messageIds: { type: [String], default: [] },
    lastAt: { type: Date, required: true },
  },
  { timestamps: true },
);
// Made per organization by the tenancy plugin.
crmMailThreadSchema.index({ accountId: 1, threadId: 1 }, { unique: true });
crmMailThreadSchema.index({ accountId: 1, labelIds: 1, lastAt: -1 });
crmMailThreadSchema.index({ lastAt: -1 });

export type CrmMailThreadDocument = InferSchemaType<typeof crmMailThreadSchema>;
export const CrmMailThreadModel: Model<CrmMailThreadDocument> = model<CrmMailThreadDocument>(
  'CrmMailThread',
  crmMailThreadSchema,
);

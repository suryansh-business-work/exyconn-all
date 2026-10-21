import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** What Legal keeps that can be shared with a client: a contract, a document or a policy. */
export const SHARED_ITEM_KINDS = ['CONTRACT', 'DOCUMENT', 'POLICY'] as const;
export type SharedItemKind = (typeof SHARED_ITEM_KINDS)[number];

/**
 * A Legal record (Contract, LegalDocument or Policy) shared with one client, so it shows in
 * their client hub. Only the link is stored: the title, status and signatures are read live
 * from the record itself, so the hub can never show a stale copy of a contract.
 */
const clientSharedItemSchema = new Schema(
  {
    clientId: { type: String, required: true, trim: true },
    kind: { type: String, enum: SHARED_ITEM_KINDS, required: true },
    refId: { type: String, required: true, trim: true },
    /** Why it was shared, shown to the client beside it. */
    note: { type: String, default: '', trim: true },
    sharedByName: { type: String, default: '', trim: true },
    /** When the client's contacts were emailed about it; claimed once, never re-sent. */
    notifiedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// One record is shared with one client once; the tenancy plugin scopes this per company.
clientSharedItemSchema.index({ clientId: 1, kind: 1, refId: 1 }, { unique: true });

export type ClientSharedItemDocument = InferSchemaType<typeof clientSharedItemSchema>;
export const ClientSharedItemModel: Model<ClientSharedItemDocument> =
  model<ClientSharedItemDocument>('ClientSharedItem', clientSharedItemSchema);

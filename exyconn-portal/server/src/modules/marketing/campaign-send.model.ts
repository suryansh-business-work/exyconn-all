import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { recipientSourceSchema } from './audience-snapshot.model';

/**
 * What happened to this recipient's copy. QUEUED is written before the send and replaced by
 * its outcome; one left QUEUED means the process stopped mid-send. SKIPPED is not a failure: the address was
 * suppressed or the contact had withdrawn consent, and the row exists so the gap between
 * the audience's size and the number sent has a name against it rather than being
 * unexplained arithmetic.
 */
export const CAMPAIGN_SEND_STATUSES = ['QUEUED', 'SENT', 'FAILED', 'SKIPPED'] as const;

/**
 * One recipient's copy of one campaign send.
 *
 * The campaign row only ever kept a count, so a failure was a number that went down and a
 * name nobody could recover — the reason lived in the server log until it rotated away.
 * This keeps the address and the transport's own words next to the campaign.
 */
const campaignSendSchema = new Schema(
  {
    campaignId: { type: String, required: true, trim: true, index: true },
    audienceListId: { type: String, required: true, trim: true },
    /**
     * One send of the campaign. With the address it is the idempotency key: a row is written
     * QUEUED before anything is sent and claimed before its email goes, so running the same
     * send again can never mail an address twice. Empty on rows from before runs existed.
     */
    runId: { type: String, default: '', trim: true },
    /** The frozen content this copy was rendered from — what "view in browser" shows. */
    revisionId: { type: String, default: '' },
    /** Delivery attempts made for this copy, retries included. */
    attempts: { type: Number, required: true, default: 0 },
    /** When a sender claimed this row; set once, so a second sender skips it. */
    claimedAt: { type: Date, default: null },
    /** The CRM records this address stood for at send time — frozen, for attribution. */
    sources: { type: [recipientSourceSchema], default: [] },
    to: { type: String, required: true, trim: true, index: true },
    recipientName: { type: String, default: '', trim: true },
    status: { type: String, enum: CAMPAIGN_SEND_STATUSES, required: true },
    /** Why it failed, in the transport's own words — or why it was skipped. Empty on success. */
    error: { type: String, default: '', trim: true },
    sentAt: { type: Date, required: true, default: Date.now },
    /**
     * SHA-256 of the opaque token in this recipient's tracking links.
     *
     * Hashed, and only ever the hash, for the same reasons the unsubscribe token is: the
     * link travels through mail clients, proxies and referrer headers, so it must not carry
     * the address — and a copy of this collection must not become a set of working links
     * that could be used to forge opens for somebody else.
     */
    trackingTokenHash: { type: String, default: '', index: true },
    /** When this recipient first opened it. Null until they do — and often for ever. */
    openedAt: { type: Date, default: null },
    /**
     * How many times the pixel loaded.
     *
     * Not "how many times they read it": mail clients prefetch, some cache the image and
     * never ask again, and many block it entirely. Opens are a floor, never a count.
     */
    openCount: { type: Number, required: true, default: 0 },
    lastClickedAt: { type: Date, default: null },
    clickCount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);
campaignSendSchema.index(
  { runId: 1, to: 1 },
  { unique: true, partialFilterExpression: { runId: { $gt: '' } } },
);

export type CampaignSendDocument = InferSchemaType<typeof campaignSendSchema>;
export const CampaignSendModel: Model<CampaignSendDocument> = model<CampaignSendDocument>(
  'CampaignSend',
  campaignSendSchema,
);

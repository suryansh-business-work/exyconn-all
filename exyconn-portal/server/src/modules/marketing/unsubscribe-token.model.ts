import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * One unsubscribe link, as it exists after the email has been sent.
 *
 * A stored random token rather than an HMAC of the address, for two reasons. The link
 * travels through mail clients, proxies and referrer headers, and an opaque token keeps
 * the recipient's address out of all of them — an HMAC has to carry the address it signs.
 * And rotating JWT_SECRET would silently break every unsubscribe link already sitting in
 * an inbox, which for a legal obligation is not an acceptable failure mode.
 *
 * Only the SHA-256 is stored, so a copy of the collection cannot be turned into working
 * links. There is no expiry: an unsubscribe link must work for as long as the email exists.
 */
const marketingUnsubscribeTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    /** The campaign that issued it, so the suppression can say what prompted it. */
    campaignId: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export type MarketingUnsubscribeTokenDocument = InferSchemaType<
  typeof marketingUnsubscribeTokenSchema
>;
export const MarketingUnsubscribeTokenModel: Model<MarketingUnsubscribeTokenDocument> =
  model<MarketingUnsubscribeTokenDocument>(
    'MarketingUnsubscribeToken',
    marketingUnsubscribeTokenSchema,
  );

import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * Why this address must not be marketed to again. BOUNCED is a hard bounce. UNSUBSCRIBED and
 * SPAM_COMPLAINT are the recipient's own withdrawal of consent, which is why taking either
 * off the list needs an administrator.
 */
export const SUPPRESSION_REASONS = [
  'UNSUBSCRIBED',
  'BOUNCED',
  'MANUAL',
  'SPAM_COMPLAINT',
  'DO_NOT_CONTACT',
  'OTHER',
] as const;

export type SuppressionReason = (typeof SUPPRESSION_REASONS)[number];

/** Reasons only an administrator may lift: the recipient asked, and that is not ours to undo. */
export const CONSENT_REASONS: ReadonlySet<SuppressionReason> = new Set([
  'UNSUBSCRIBED',
  'SPAM_COMPLAINT',
]);

/**
 * What created the row, set by the server from the action that wrote it — never typed in.
 * SUBSCRIBER is the recipient's own unsubscribe link; CRM is a contact's status in the CRM.
 */
export const SUPPRESSION_ORIGINS = [
  'ADMIN',
  'CRM',
  'CAMPAIGN',
  'SUBSCRIBER',
  'IMPORT',
  'API',
  'SYSTEM',
] as const;

export type SuppressionOrigin = (typeof SUPPRESSION_ORIGINS)[number];

/**
 * What a suppression stops. The sender has one marketing stream per organization, so that is
 * the only scope; transactional mail (sign-in codes, invoices, reminders) never reads this list.
 */
export const SUPPRESSION_SCOPES = ['ORGANIZATION_MARKETING'] as const;

export const MAX_SUPPRESSION_NOTE = 500;

/**
 * One address marketing may never write to again.
 *
 * Consent is not a property of a contact row: the same person appears as a client, as a
 * CRM contact and inside a segment, and "do not email me" has to outlive every one of
 * them. The address is the key, lower-cased and unique, so a second unsubscribe is a
 * no-op rather than a duplicate — and so a send can answer the question with one lookup.
 * Archiving a row only hides it from the list; the sender still reads it.
 */
const marketingSuppressionSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    reason: { type: String, enum: SUPPRESSION_REASONS, required: true, default: 'MANUAL' },
    /** Where it came from in detail — a campaign id, a contact id — or legacy free text. */
    source: { type: String, default: '', trim: true },
    origin: { type: String, enum: SUPPRESSION_ORIGINS, required: true, default: 'ADMIN' },
    scope: {
      type: String,
      enum: SUPPRESSION_SCOPES,
      required: true,
      default: 'ORGANIZATION_MARKETING',
    },
    /** Internal context; never shown outside the Marketing portal. */
    note: { type: String, default: '', trim: true, maxlength: MAX_SUPPRESSION_NOTE },
    addedById: { type: String, default: '' },
    addedByName: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);
marketingSuppressionSchema.index({ reason: 1 });
marketingSuppressionSchema.index({ origin: 1 });
marketingSuppressionSchema.index({ createdAt: -1 });

export type MarketingSuppressionDocument = InferSchemaType<typeof marketingSuppressionSchema>;
export const MarketingSuppressionModel: Model<MarketingSuppressionDocument> =
  model<MarketingSuppressionDocument>('MarketingSuppression', marketingSuppressionSchema);

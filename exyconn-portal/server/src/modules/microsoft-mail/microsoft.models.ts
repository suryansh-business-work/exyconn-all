import { Schema, model, type InferSchemaType, type Model, type Types } from 'mongoose';
import { GMAIL_ACCOUNT_STATUSES } from '../gmail/gmail.models';

const STATE_TTL_SECONDS = 10 * 60;

/**
 * The Microsoft Entra app the CRM's Outlook / Microsoft 365 mailboxes connect through (Tech >
 * Environment Variables > Email accounts (OAuth)). One row for the install, like the Gmail client; the
 * client secret is write-only.
 */
const microsoftMailConfigSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    clientId: { type: String, default: '', trim: true },
    clientSecret: { type: String, default: '' },
    /** The Entra tenant the app signs in against: `common`, `organizations` or a tenant id. */
    tenant: { type: String, default: 'common', trim: true },
    enabled: { type: Boolean, default: false },
    updatedByName: { type: String, default: '' },
  },
  { timestamps: true },
);

/**
 * One Microsoft mailbox connected to a company's CRM, company-scoped like GmailAccount (one
 * row per address per company). The refresh token is sealed (utils/secretBox) and never
 * leaves the server; connecting the same mailbox again replaces it.
 */
const microsoftMailAccountSchema = new Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    refreshToken: { type: String, required: true },
    /** Set on a personal mailbox (Settings > Mailboxes); null for the company's CRM ones. */
    ownerUserId: { type: String, default: null },
    /** The owner's default mailbox for new email; only meaningful on a personal mailbox. */
    isDefault: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true },
    status: { type: String, enum: GMAIL_ACCOUNT_STATUSES, default: 'CONNECTED' },
    /** Why the last call to Microsoft failed, in Microsoft's words; '' when it worked. */
    lastError: { type: String, default: '' },
    /** When `lastError` happened; null while the mailbox works. */
    lastErrorAt: { type: Date, default: null },
    connectedAt: { type: Date, default: Date.now },
    connectedByName: { type: String, default: '' },
    lastUsedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
// (organizationId, email, ownerUserId) once the tenancy plugin adds the company: see GmailAccount.
microsoftMailAccountSchema.index({ email: 1, ownerUserId: 1 }, { unique: true });

/** A connection in progress, from "Connect Microsoft" to Microsoft's callback. */
const microsoftOAuthStateSchema = new Schema({
  nonce: { type: String, required: true, unique: true },
  codeVerifier: { type: String, required: true },
  returnTo: { type: String, required: true },
  actorId: { type: String, default: '' },
  actorName: { type: String, default: '' },
  organizationId: { type: String, default: '' },
  /** Set when the person is connecting their own mailbox rather than one for the CRM. */
  ownerUserId: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now, expires: STATE_TTL_SECONDS },
});

export type MicrosoftMailConfigDocument = InferSchemaType<typeof microsoftMailConfigSchema>;
export type MicrosoftMailAccountDocument = InferSchemaType<typeof microsoftMailAccountSchema> & {
  _id: Types.ObjectId;
};
export type MicrosoftOAuthStateDocument = InferSchemaType<typeof microsoftOAuthStateSchema>;

export const MicrosoftMailConfigModel: Model<MicrosoftMailConfigDocument> =
  model<MicrosoftMailConfigDocument>('MicrosoftMailConfig', microsoftMailConfigSchema);
export const MicrosoftMailAccountModel = model('MicrosoftMailAccount', microsoftMailAccountSchema);
export const MicrosoftOAuthStateModel: Model<MicrosoftOAuthStateDocument> =
  model<MicrosoftOAuthStateDocument>('MicrosoftOAuthState', microsoftOAuthStateSchema);

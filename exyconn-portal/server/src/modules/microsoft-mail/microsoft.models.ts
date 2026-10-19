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
 * One Microsoft mailbox connected to the operator's CRM. The refresh token is sealed
 * (utils/secretBox) and never leaves the server; connecting the same mailbox again replaces it.
 */
const microsoftMailAccountSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    refreshToken: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    status: { type: String, enum: GMAIL_ACCOUNT_STATUSES, default: 'CONNECTED' },
    /** Why the last call to Microsoft failed, in Microsoft's words; '' when it worked. */
    lastError: { type: String, default: '' },
    connectedAt: { type: Date, default: Date.now },
    connectedByName: { type: String, default: '' },
    lastUsedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

/** A connection in progress, from "Connect Microsoft" to Microsoft's callback. */
const microsoftOAuthStateSchema = new Schema({
  nonce: { type: String, required: true, unique: true },
  codeVerifier: { type: String, required: true },
  returnTo: { type: String, required: true },
  actorId: { type: String, default: '' },
  actorName: { type: String, default: '' },
  organizationId: { type: String, default: '' },
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

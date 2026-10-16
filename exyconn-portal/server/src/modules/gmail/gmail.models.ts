import { Schema, model, type InferSchemaType, type Model, type Types } from 'mongoose';

const STATE_TTL_SECONDS = 10 * 60;

/**
 * The Google OAuth client the CRM's Gmail accounts connect through (Tech > Environment
 * Variables > Gmail). One row; the client secret is revealed one look at a time, like every
 * other credential there. `connectedEmail`/`refreshToken` are the single mailbox of old
 * releases: moved into a GmailAccount at boot (gmail.accounts migration) and left in place so
 * a rollback still finds its connection.
 */
const gmailConfigSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    clientId: { type: String, default: '', trim: true },
    clientSecret: { type: String, default: '' },
    enabled: { type: Boolean, default: false },
    /** The mailbox Google connected, e.g. sales@exyconn.com; '' until connected. */
    connectedEmail: { type: String, default: '', trim: true, lowercase: true },
    refreshToken: { type: String, default: '' },
    connectedAt: { type: Date, default: null },
    /** Why the last call to Gmail failed, in Google's words; '' when it worked. */
    lastError: { type: String, default: '' },
    updatedByName: { type: String, default: '' },
  },
  { timestamps: true },
);

export const GMAIL_ACCOUNT_STATUSES = ['CONNECTED', 'NEEDS_RECONNECT'] as const;
export type GmailAccountStatus = (typeof GMAIL_ACCOUNT_STATUSES)[number];

/**
 * One Gmail mailbox connected to the operator's CRM (CRM > Configuration > Connect Gmail).
 * Many may be connected; only the enabled ones are read and sent from. The refresh token is
 * sealed (utils/secretBox) and never leaves the server. Connecting the same Google account
 * again replaces its token on this row, so an address is connected at most once.
 */
const gmailAccountSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    refreshToken: { type: String, required: true },
    /** Whether the CRM reads and sends from this mailbox ("Use for CRM"). */
    enabled: { type: Boolean, default: true },
    status: { type: String, enum: GMAIL_ACCOUNT_STATUSES, default: 'CONNECTED' },
    /** Why the last call to Gmail failed, in Google's words; '' when it worked. */
    lastError: { type: String, default: '' },
    connectedAt: { type: Date, default: Date.now },
    connectedByName: { type: String, default: '' },
    lastSyncAt: { type: Date, default: null },
  },
  { timestamps: true },
);

/** A connection in progress, from "Connect Gmail" to Google's callback. */
const gmailOAuthStateSchema = new Schema({
  nonce: { type: String, required: true, unique: true },
  codeVerifier: { type: String, required: true },
  returnTo: { type: String, required: true },
  updatedByName: { type: String, default: '' },
  /** Who started it and in which company, so the callback can audit the connection. */
  actorId: { type: String, default: '' },
  organizationId: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now, expires: STATE_TTL_SECONDS },
});

/**
 * One Gmail message with a CRM contact, kept so the timeline can show it without asking Gmail.
 * Written when a contact's emails are synced and whenever the CRM sends one; the company's
 * own data, so it is scoped to the company like every CRM record.
 */
const crmEmailMessageSchema = new Schema(
  {
    gmailId: { type: String, required: true, trim: true },
    threadId: { type: String, required: true, trim: true, index: true },
    /** The connected mailbox (GmailAccount) it was read from or sent by; '' on old rows. */
    accountId: { type: String, default: '', index: true },
    /** That mailbox's address, kept so a disconnected account's mail still says whose it was. */
    mailbox: { type: String, default: '', trim: true, lowercase: true },
    /** The RFC 5322 Message-ID, so a reply can thread under it. */
    messageId: { type: String, default: '', trim: true },
    direction: { type: String, enum: ['IN', 'OUT'], required: true },
    from: { type: String, default: '', trim: true },
    to: { type: [String], default: [] },
    cc: { type: [String], default: [] },
    /** Every address on the message, lower-cased: what the timeline matches a contact by. */
    participants: { type: [String], default: [], index: true },
    subject: { type: String, default: '', trim: true },
    snippet: { type: String, default: '' },
    bodyText: { type: String, default: '' },
    sentAt: { type: Date, required: true, index: true },
    sentByName: { type: String, default: '' },
  },
  { timestamps: true },
);
crmEmailMessageSchema.index({ gmailId: 1 }, { unique: true });

export type GmailConfigDocument = InferSchemaType<typeof gmailConfigSchema>;
export type GmailAccountDocument = InferSchemaType<typeof gmailAccountSchema> & {
  _id: Types.ObjectId;
};
export type CrmEmailMessageDocument = InferSchemaType<typeof crmEmailMessageSchema>;

export const GmailConfigModel: Model<GmailConfigDocument> = model<GmailConfigDocument>(
  'GmailConfig',
  gmailConfigSchema,
);
export const GmailAccountModel = model('GmailAccount', gmailAccountSchema);
export const GmailOAuthStateModel = model('GmailOAuthState', gmailOAuthStateSchema);
export const CrmEmailMessageModel: Model<CrmEmailMessageDocument> = model<CrmEmailMessageDocument>(
  'CrmEmailMessage',
  crmEmailMessageSchema,
);

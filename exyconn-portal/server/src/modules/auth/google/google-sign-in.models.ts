import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** How long a person has between leaving for Google and coming back. */
const STATE_TTL_SECONDS = 10 * 60;
/** How long the portal has to redeem the ticket the callback hands it. */
const TICKET_TTL_SECONDS = 2 * 60;

/**
 * The install's Google OAuth client behind "Continue with Google" on the portal sign-in page
 * (Tech > Environment Variables > Google sign-in). One row, keyed 'default'.
 */
const googleSignInConfigSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    clientId: { type: String, default: '', trim: true },
    /** Write-only through the API; revealed one look at a time (tech.reveal.ts). */
    clientSecret: { type: String, default: '' },
    enabled: { type: Boolean, default: false },
    updatedByName: { type: String, default: '' },
  },
  { timestamps: true },
);

/** A sign-in in progress: the callback arrives with no session, only this nonce. */
const googleSignInStateSchema = new Schema({
  nonce: { type: String, required: true, unique: true },
  /** PKCE verifier, sent with the code so a stolen code is useless on its own. */
  codeVerifier: { type: String, required: true },
  /** The portal page the person started on, an allowed portal origin. */
  returnTo: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: STATE_TTL_SECONDS },
});

/**
 * What the callback hands the portal instead of a session: a one-time ticket, stored hashed,
 * that the sign-in page redeems over GraphQL so the token reaches the browser the usual way.
 */
const googleSignInTicketSchema = new Schema({
  ticketHash: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: TICKET_TTL_SECONDS },
});

export type GoogleSignInConfigDocument = InferSchemaType<typeof googleSignInConfigSchema>;

export const GoogleSignInConfigModel: Model<GoogleSignInConfigDocument> =
  model<GoogleSignInConfigDocument>('GoogleSignInConfig', googleSignInConfigSchema);
export const GoogleSignInStateModel = model('GoogleSignInState', googleSignInStateSchema);
export const GoogleSignInTicketModel = model('GoogleSignInTicket', googleSignInTicketSchema);

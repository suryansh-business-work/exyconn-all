import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import {
  OAUTH_STATE_TTL_SECONDS,
  SOCIAL_ACCOUNT_KINDS,
  SOCIAL_APPS,
  SOCIAL_NETWORKS,
} from './social.constants';

/**
 * One provider's OAuth app (client id and secret), shared by every company on the install and
 * managed from Tech › Environment Variables › Social apps. The secret is write-only.
 */
const socialAppConfigSchema = new Schema(
  {
    app: { type: String, enum: SOCIAL_APPS, required: true, unique: true },
    clientId: { type: String, trim: true, default: '' },
    clientSecret: { type: String, trim: true, default: '' },
    enabled: { type: Boolean, required: true, default: false },
    /**
     * LinkedIn only: the provider refused the company-page scopes (the app lacks the Community
     * Management API product), so connections ask for the member scopes alone. Saving the app
     * again in Tech clears it.
     */
    pagesRefused: { type: Boolean, default: false },
  },
  { timestamps: true },
);

/**
 * A company's connected social account. Tokens are sealed (utils/secretBox) and never leave
 * the server; the API shows who is connected, not how.
 */
const socialAccountSchema = new Schema(
  {
    network: { type: String, enum: SOCIAL_NETWORKS, required: true },
    app: { type: String, enum: SOCIAL_APPS, required: true },
    /** The provider's own id for the member, page, channel or profile. */
    externalId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    handle: { type: String, trim: true, default: '' },
    avatarUrl: { type: String, trim: true, default: '' },
    /** A person's own account, or an organization's page (a LinkedIn company page). */
    kind: { type: String, enum: SOCIAL_ACCOUNT_KINDS, default: 'PERSON' },
    /**
     * Set on an account that acts through another's token — a LinkedIn page through the
     * member who administers it — whose own token fields stay empty, so the token is stored once.
     */
    tokenAccountId: { type: String, default: null, index: true },
    /** The scopes the provider granted, where it says (LinkedIn does). */
    scopes: { type: [String], default: undefined },
    accessToken: { type: String, default: '' },
    refreshToken: { type: String, default: '' },
    /** Null when the provider's token does not expire (a Facebook Page token). */
    expiresAt: { type: Date, default: null },
    connectedBy: { type: String, required: true },
    /** When its posts and their numbers were last read from the network. */
    lastSyncedAt: { type: Date, default: null },
    /** Why the last read failed, in the network's words; '' when it worked. */
    syncError: { type: String, default: '' },
    /**
     * False while paused: not offered in Compose, not synced, and its scheduled posts held.
     * Rows from before the switch lack it, so read anything but `false` as active.
     */
    active: { type: Boolean, default: true },
    /** When the provider stopped reaching it (a page the member no longer administers). */
    disconnectedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
socialAccountSchema.index({ network: 1, externalId: 1 }, { unique: true });

/**
 * A connection in progress, from "Connect" to the provider's callback. The callback arrives
 * with no session, so this is what says which company and person it belongs to. Deleted when
 * used, and by Mongo after ten minutes if it never is.
 */
const socialOAuthStateSchema = new Schema({
  nonce: { type: String, required: true, unique: true },
  app: { type: String, enum: SOCIAL_APPS, required: true },
  organizationId: { type: String, required: true },
  userId: { type: String, required: true },
  /** PKCE verifier (X requires it; sent to every provider that accepts it). */
  codeVerifier: { type: String, required: true },
  /** The Marketing page to return to. */
  returnTo: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: OAUTH_STATE_TTL_SECONDS },
});

export type SocialAppConfigDocument = InferSchemaType<typeof socialAppConfigSchema>;
export type SocialAccountDocument = InferSchemaType<typeof socialAccountSchema>;
export type SocialOAuthStateDocument = InferSchemaType<typeof socialOAuthStateSchema>;

export const SocialAppConfigModel: Model<SocialAppConfigDocument> = model<SocialAppConfigDocument>(
  'SocialAppConfig',
  socialAppConfigSchema,
);
export const SocialAccountModel: Model<SocialAccountDocument> = model<SocialAccountDocument>(
  'SocialAccount',
  socialAccountSchema,
);
export const SocialOAuthStateModel: Model<SocialOAuthStateDocument> =
  model<SocialOAuthStateDocument>('SocialOAuthState', socialOAuthStateSchema);

import { env } from '../../config/env';
import { runAsPlatform } from '../../lib/tenant';
import { badRequest, notFound } from '../../utils/errors';
import { seal } from '../../utils/secretBox';
import { secretHint } from '../tech/tech.secrets';
import {
  exchangeForTokens,
  randomToken,
  sha256,
  verifiedEmailOf,
} from '../auth/google/google-sign-in.oauth';
import { gmailClient } from './gmail.client';
import { GmailConfigModel, GmailOAuthStateModel, type GmailConfigDocument } from './gmail.models';

const KEY = 'default';
export const GMAIL_CALLBACK_PATH = '/oauth/gmail';
/** Read and send as the mailbox; modify lets a sent reply land in its thread. */
const SCOPES = 'openid email https://www.googleapis.com/auth/gmail.modify';
const PORTAL_ORIGINS: ReadonlySet<string> = new Set(env.corsOrigins);

export const gmailRedirectUri = () => `${env.apiPublicUrl}${GMAIL_CALLBACK_PATH}/callback`;

export const readGmailConfig = () =>
  runAsPlatform(() =>
    GmailConfigModel.findOneAndUpdate(
      { key: KEY },
      { $setOnInsert: { key: KEY } },
      { upsert: true, new: true },
    ).lean<GmailConfigDocument>(),
  );

/** What Tech sees: never a secret or a token, only whether they are there. */
export function presentGmailConfig(doc: GmailConfigDocument) {
  return {
    id: KEY,
    clientId: doc.clientId,
    hasClientSecret: doc.clientSecret !== '',
    clientSecretHint: secretHint(doc.clientSecret),
    enabled: doc.enabled,
    connectedEmail: doc.connectedEmail,
    connected: doc.refreshToken !== '',
    connectedAt: doc.connectedAt,
    lastError: doc.lastError,
    redirectUri: gmailRedirectUri(),
    updatedAt: doc.updatedAt,
  };
}

export interface GmailConfigInput {
  clientId: string;
  /** Blank keeps the stored secret. */
  clientSecret: string;
  enabled: boolean;
}

const update = async (fields: Partial<GmailConfigDocument>) => {
  const saved = await runAsPlatform(() =>
    GmailConfigModel.findOneAndUpdate(
      { key: KEY },
      { $set: fields },
      { new: true },
    ).lean<GmailConfigDocument>(),
  );
  if (!saved) notFound('Gmail config');
  return saved;
};

export async function saveGmailConfig(input: GmailConfigInput, actorName: string) {
  const clientSecret = input.clientSecret.trim();
  await readGmailConfig();
  return update({
    clientId: input.clientId.trim(),
    enabled: input.enabled,
    updatedByName: actorName,
    ...(clientSecret === '' ? {} : { clientSecret }),
  });
}

/** Google's consent page for the mailbox; the callback stores its refresh token. */
export async function startGmailConnect(returnTo: string, actorName: string): Promise<string> {
  const config = await readGmailConfig();
  if (!config.clientId || !config.clientSecret) {
    badRequest('Save the Google client ID and secret first.');
  }
  if (!PORTAL_ORIGINS.has(new URL(returnTo).origin)) {
    badRequest('That is not a portal address.');
  }
  const nonce = randomToken(24);
  const codeVerifier = randomToken(48);
  await runAsPlatform(() =>
    GmailOAuthStateModel.create({ nonce, codeVerifier, returnTo, updatedByName: actorName }),
  );
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: gmailRedirectUri(),
    response_type: 'code',
    scope: SCOPES,
    state: nonce,
    code_challenge: sha256(codeVerifier),
    code_challenge_method: 'S256',
    access_type: 'offline',
    // Always ask, so Google always hands back a refresh token.
    prompt: 'consent',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export const takeGmailState = (nonce: string) =>
  runAsPlatform(() => GmailOAuthStateModel.findOneAndDelete({ nonce }).lean());

/** The callback's work: trade the code, keep the refresh token sealed, note the mailbox. */
export async function finishGmailConnect(
  state: { codeVerifier: string; updatedByName?: string | null },
  code: string,
): Promise<string> {
  const config = await readGmailConfig();
  const tokens = await exchangeForTokens(config, code, state.codeVerifier, gmailRedirectUri());
  if (!tokens.refresh_token || !tokens.id_token) {
    throw new Error('Google did not grant offline access. Try Connect again.');
  }
  const email = verifiedEmailOf(tokens.id_token, config.clientId);
  await update({
    refreshToken: seal(tokens.refresh_token),
    connectedEmail: email,
    connectedAt: new Date(),
    lastError: '',
    updatedByName: state.updatedByName ?? '',
  });
  return email;
}

export const disconnectGmail = (actorName: string) =>
  update({ refreshToken: '', connectedEmail: '', connectedAt: null, updatedByName: actorName });

/** Proves the stored connection by reading the mailbox's own address. */
export async function testGmail(): Promise<string> {
  const config = await readGmailConfig();
  if (!config.refreshToken) {
    badRequest('Connect a Gmail account first.');
  }
  try {
    const profile = await gmailClient.profile(config);
    await update({ lastError: '' });
    return `Gmail answered as ${profile.emailAddress}.`;
  } catch (error) {
    await update({ lastError: error instanceof Error ? error.message : 'Gmail did not answer.' });
    throw error;
  }
}

import { readGoogleConfig } from '../auth/google/google-sign-in.config';
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
import { EMAIL_ACCOUNTS_UNAVAILABLE, gmailClient } from './gmail.client';
import { enabledMailboxes, noteAccountOutcome, saveConnectedAccount } from './gmail.accounts';
import {
  GmailAccountModel,
  GmailConfigModel,
  GmailOAuthStateModel,
  type GmailConfigDocument,
} from './gmail.models';

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

/**
 * What Tech sees: never a secret or a token, only whether they are there. The account count
 * spans every company (Tech is the platform's staff); no address is shown.
 */
export async function presentGmailConfig(doc: GmailConfigDocument) {
  const accountCount = await runAsPlatform(() => GmailAccountModel.countDocuments());
  return {
    id: KEY,
    clientId: doc.clientId,
    hasClientSecret: doc.clientSecret !== '',
    clientSecretHint: secretHint(doc.clientSecret),
    enabled: doc.enabled,
    accountCount,
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

export async function saveGmailConfig(input: GmailConfigInput, actorName: string) {
  const clientSecret = input.clientSecret.trim();
  await readGmailConfig();
  const saved = await runAsPlatform(() =>
    GmailConfigModel.findOneAndUpdate(
      { key: KEY },
      {
        $set: {
          clientId: input.clientId.trim(),
          enabled: input.enabled,
          updatedByName: actorName,
          ...(clientSecret === '' ? {} : { clientSecret }),
        },
      },
      { new: true },
    ).lean<GmailConfigDocument>(),
  );
  if (!saved) notFound('Gmail config');
  return saved;
}

/**
 * Points Gmail at the Google client already saved for Google sign-in, and turns it on. One
 * Google OAuth client can serve both: it needs the Gmail redirect URI added and the Gmail API
 * enabled on its project, which the Tech screen says alongside the button.
 */
export async function useGoogleSignInClientForGmail(actorName: string) {
  const google = await readGoogleConfig();
  if (!google.clientId || !google.clientSecret) {
    badRequest(
      'Save the Google sign-in client first (Tech > Environment Variables > Google sign-in).',
    );
  }
  await readGmailConfig();
  const saved = await runAsPlatform(() =>
    GmailConfigModel.findOneAndUpdate(
      { key: KEY },
      {
        $set: {
          clientId: google.clientId,
          clientSecret: google.clientSecret,
          enabled: true,
          updatedByName: actorName,
        },
      },
      { new: true },
    ).lean<GmailConfigDocument>(),
  );
  if (!saved) notFound('Gmail config');
  return saved;
}

/** Who is connecting, kept with the state so the callback can name them in the audit. */
export interface ConnectActor {
  id: string;
  name: string;
  organizationId: string;
}

/**
 * Google's consent page for one more mailbox (or the same one again, to renew its token);
 * the callback stores its refresh token as a GmailAccount of the actor's company.
 */
export async function startGmailConnect(returnTo: string, actor: ConnectActor): Promise<string> {
  const config = await readGmailConfig();
  if (!config.clientId || !config.clientSecret) {
    badRequest(EMAIL_ACCOUNTS_UNAVAILABLE);
  }
  if (!PORTAL_ORIGINS.has(new URL(returnTo).origin)) {
    badRequest('That is not a portal address.');
  }
  const nonce = randomToken(24);
  const codeVerifier = randomToken(48);
  await runAsPlatform(() =>
    GmailOAuthStateModel.create({
      nonce,
      codeVerifier,
      returnTo,
      updatedByName: actor.name,
      actorId: actor.id,
      organizationId: actor.organizationId,
    }),
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
    // Always ask, so Google always hands back a refresh token; and let them pick an account.
    prompt: 'consent select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export const takeGmailState = (nonce: string) =>
  runAsPlatform(() => GmailOAuthStateModel.findOneAndDelete({ nonce }).lean());

/**
 * The callback's work: trade the code, keep the refresh token sealed on the mailbox's row, in
 * the company that started the connection (the callback itself has no session).
 */
export async function finishGmailConnect(
  state: { codeVerifier: string; updatedByName?: string | null; organizationId?: string | null },
  code: string,
): Promise<string> {
  if (!state.organizationId) {
    throw new Error('This Gmail connection was not started from a company. Connect again.');
  }
  const config = await readGmailConfig();
  const tokens = await exchangeForTokens(config, code, state.codeVerifier, gmailRedirectUri());
  if (!tokens.refresh_token || !tokens.id_token) {
    throw new Error('Google did not grant offline access. Try Connect again.');
  }
  const email = verifiedEmailOf(tokens.id_token, config.clientId);
  await saveConnectedAccount(
    state.organizationId,
    email,
    seal(tokens.refresh_token),
    state.updatedByName ?? '',
  );
  return email;
}

/** Proves every enabled account of the caller's company by reading each mailbox's own address. */
export async function testGmail(): Promise<string> {
  const mailboxes = await enabledMailboxes();
  if (mailboxes.length === 0) {
    badRequest('Connect a Gmail account in CRM > Connect Gmail first.');
  }
  const results = await Promise.all(
    mailboxes.map(async (mailbox) => {
      try {
        const profile = await gmailClient.profile(mailbox);
        await noteAccountOutcome(mailbox.id, null);
        return `${profile.emailAddress}: ok`;
      } catch (error) {
        await noteAccountOutcome(mailbox.id, error);
        return `${mailbox.email}: ${error instanceof Error ? error.message : 'no answer'}`;
      }
    }),
  );
  return `Gmail answered for ${results.join('; ')}.`;
}

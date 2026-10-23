import { env } from '../../config/env';
import { runAsPlatform } from '../../lib/tenant';
import { badRequest } from '../../utils/errors';
import { secretHint } from '../tech/tech.secrets';
import { randomToken, sha256 } from '../auth/google/google-sign-in.oauth';
import {
  MICROSOFT_SCOPES,
  mailboxAddress,
  microsoftApp,
  microsoftAuthorizeUrl,
  refreshMailbox,
  requestTokens,
} from './microsoft.client';
import {
  enabledMicrosoftMailboxes,
  noteMicrosoftOutcome,
  saveMicrosoftAccount,
} from './microsoft.accounts';
import {
  MicrosoftMailAccountModel,
  MicrosoftMailConfigModel,
  MicrosoftOAuthStateModel,
  type MicrosoftMailConfigDocument,
  type MicrosoftOAuthStateDocument,
} from './microsoft.models';

const KEY = 'default';
export const MICROSOFT_CALLBACK_PATH = '/oauth/microsoft';
const PORTAL_ORIGINS: ReadonlySet<string> = new Set(env.corsOrigins);

export const microsoftRedirectUri = () => `${env.apiPublicUrl}${MICROSOFT_CALLBACK_PATH}/callback`;

export const readMicrosoftConfig = () =>
  runAsPlatform(() =>
    MicrosoftMailConfigModel.findOneAndUpdate(
      { key: KEY },
      { $setOnInsert: { key: KEY } },
      { upsert: true, new: true },
    ).lean<MicrosoftMailConfigDocument>(),
  );

/** What Tech sees: never the secret, only whether it is there; the count spans every company. */
export async function presentMicrosoftConfig(doc: MicrosoftMailConfigDocument) {
  const accountCount = await runAsPlatform(() => MicrosoftMailAccountModel.countDocuments());
  return {
    id: KEY,
    clientId: doc.clientId,
    tenant: doc.tenant || 'common',
    hasClientSecret: doc.clientSecret !== '',
    clientSecretHint: secretHint(doc.clientSecret),
    enabled: doc.enabled,
    accountCount,
    redirectUri: microsoftRedirectUri(),
    updatedAt: doc.updatedAt,
  };
}

export interface MicrosoftMailConfigInput {
  clientId: string;
  /** Blank keeps the stored secret. */
  clientSecret: string;
  /** Blank means `common` (any work, school or personal Microsoft account). */
  tenant: string;
  enabled: boolean;
}

const TENANT = /^[\w.-]{1,100}$/;

export async function saveMicrosoftConfig(input: MicrosoftMailConfigInput, actorName: string) {
  const clientSecret = input.clientSecret.trim();
  const tenant = input.tenant.trim() || 'common';
  if (!TENANT.test(tenant)) {
    badRequest('The tenant is common, organizations, consumers, a tenant id or a domain.');
  }
  return runAsPlatform(() =>
    MicrosoftMailConfigModel.findOneAndUpdate(
      { key: KEY },
      {
        $set: {
          clientId: input.clientId.trim(),
          tenant,
          enabled: input.enabled,
          updatedByName: actorName,
          ...(clientSecret === '' ? {} : { clientSecret }),
        },
      },
      { upsert: true, new: true },
    ).lean<MicrosoftMailConfigDocument>(),
  );
}

export interface MicrosoftConnectActor {
  id: string;
  name: string;
  organizationId: string;
}

/**
 * Microsoft's consent page for one more mailbox (or the same one, to renew its token). A
 * `loginHint` (the address being reconnected) goes straight to that account.
 */
export async function startMicrosoftConnect(
  returnTo: string,
  actor: MicrosoftConnectActor,
  loginHint?: string | null,
) {
  const app = await microsoftApp();
  if (!PORTAL_ORIGINS.has(new URL(returnTo).origin)) {
    badRequest('That is not a portal address.');
  }
  const nonce = randomToken(24);
  const codeVerifier = randomToken(48);
  await runAsPlatform(() =>
    MicrosoftOAuthStateModel.create({
      nonce,
      codeVerifier,
      returnTo,
      actorId: actor.id,
      actorName: actor.name,
      organizationId: actor.organizationId,
    }),
  );
  const params = new URLSearchParams({
    client_id: app.clientId,
    redirect_uri: microsoftRedirectUri(),
    response_type: 'code',
    response_mode: 'query',
    scope: MICROSOFT_SCOPES,
    state: nonce,
    code_challenge: sha256(codeVerifier),
    code_challenge_method: 'S256',
  });
  if (loginHint) {
    params.set('login_hint', loginHint);
  } else {
    params.set('prompt', 'select_account');
  }
  return `${microsoftAuthorizeUrl(app)}?${params.toString()}`;
}

export const takeMicrosoftState = (nonce: string) =>
  runAsPlatform(() =>
    MicrosoftOAuthStateModel.findOneAndDelete({ nonce }).lean<MicrosoftOAuthStateDocument>(),
  );

/**
 * The callback's work: trade the code, keep the refresh token sealed on the mailbox's row, in
 * the company that started the connection (the callback itself has no session).
 */
export async function finishMicrosoftConnect(
  state: Pick<MicrosoftOAuthStateDocument, 'codeVerifier' | 'actorName' | 'organizationId'>,
  code: string,
): Promise<string> {
  if (!state.organizationId) {
    throw new Error('This Microsoft connection was not started from a company. Connect again.');
  }
  const app = await microsoftApp();
  const tokens = await requestTokens(app, {
    grant_type: 'authorization_code',
    code,
    code_verifier: state.codeVerifier,
    redirect_uri: microsoftRedirectUri(),
  });
  if (!tokens.refresh_token) {
    throw new Error('Microsoft did not grant offline access. Try Connect again.');
  }
  const email = await mailboxAddress(tokens.access_token);
  await saveMicrosoftAccount(
    state.organizationId,
    email,
    tokens.refresh_token,
    state.actorName ?? '',
  );
  return email;
}

/** Proves every enabled mailbox of the caller's company by reading its own address. */
export async function testMicrosoftMail(): Promise<string> {
  const mailboxes = await enabledMicrosoftMailboxes();
  if (mailboxes.length === 0) {
    badRequest('Connect a Microsoft mailbox in CRM > Integrations first.');
  }
  const results = await Promise.all(
    mailboxes.map(async (mailbox) => {
      try {
        const tokens = await refreshMailbox(mailbox);
        const address = await mailboxAddress(tokens.access_token);
        await noteMicrosoftOutcome(mailbox.id, { refreshToken: tokens.refresh_token });
        return `${address}: ok`;
      } catch (error) {
        await noteMicrosoftOutcome(mailbox.id, { error });
        return `${mailbox.email}: ${error instanceof Error ? error.message : 'no answer'}`;
      }
    }),
  );
  return `Microsoft answered for ${results.join('; ')}.`;
}

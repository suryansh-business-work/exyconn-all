import { meteredFetch, pathAction } from '../tech/usage/usage.meter';
import { runAsPlatform } from '../../lib/tenant';
import { ConfigurationError } from '../../utils/errors';
import { open } from '../../utils/secretBox';
import { MicrosoftMailConfigModel, type MicrosoftMailConfigDocument } from './microsoft.models';

const GRAPH = 'https://graph.microsoft.com/v1.0';
/** How much of a refusal's body is kept: enough for Graph's whole JSON error. */
const ERROR_DETAIL_LIMIT = 2000;
/** Send as the mailbox, read who it is, and keep a refresh token. Nothing else is asked for. */
export const MICROSOFT_SCOPES = 'offline_access Mail.Send User.Read';

/** The Entra app the mailboxes connect through. */
export interface MicrosoftApp {
  clientId: string;
  clientSecret: string;
  tenant: string;
}

/** One connected mailbox, with the app it was connected through. */
export interface MicrosoftMailbox extends MicrosoftApp {
  id: string;
  email: string;
  /** Sealed (utils/secretBox). */
  refreshToken: string;
}

/**
 * Microsoft no longer honours the stored connection (revoked, expired, password changed): only
 * connecting the mailbox again fixes it, so the account is marked NEEDS_RECONNECT.
 */
export class MicrosoftAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MicrosoftAuthError';
  }
}

const tenantOf = (app: MicrosoftApp) => encodeURIComponent(app.tenant || 'common');
export const microsoftAuthorizeUrl = (app: MicrosoftApp) =>
  `https://login.microsoftonline.com/${tenantOf(app)}/oauth2/v2.0/authorize`;
const tokenUrl = (app: MicrosoftApp) =>
  `https://login.microsoftonline.com/${tenantOf(app)}/oauth2/v2.0/token`;

/** The app Tech saved and turned on, or a message saying what Tech still has to do. */
export async function microsoftApp(): Promise<MicrosoftMailConfigDocument> {
  const config = await runAsPlatform(() =>
    MicrosoftMailConfigModel.findOne({ key: 'default' }).lean<MicrosoftMailConfigDocument>(),
  );
  if (!config?.enabled || !config.clientId || !config.clientSecret) {
    throw new ConfigurationError(
      'Microsoft mail is not set up. Save the app in Tech > Environment Variables > Email accounts (OAuth).',
    );
  }
  return config;
}

export interface MicrosoftTokens {
  access_token: string;
  refresh_token?: string;
}

/** One call to Microsoft's token endpoint; a refusal throws with Microsoft's reason. */
export async function requestTokens(
  app: MicrosoftApp,
  grant: Record<string, string>,
): Promise<MicrosoftTokens> {
  const response = await meteredFetch('MICROSOFT', 'POST oauth token', tokenUrl(app), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: app.clientId,
      client_secret: app.clientSecret,
      scope: MICROSOFT_SCOPES,
      ...grant,
    }),
  });
  const body = (await response.json()) as Partial<MicrosoftTokens> & {
    error?: string;
    error_description?: string;
  };
  if (body.error === 'invalid_grant') {
    throw new MicrosoftAuthError('Microsoft refused the stored connection. Connect it again.');
  }
  if (!response.ok || !body.access_token) {
    // The description carries trace ids and timestamps; its first line says what went wrong.
    const reason = (body.error_description ?? body.error ?? 'no reason').split(/\r?\n/)[0];
    throw new Error(`Microsoft refused: ${reason}`);
  }
  return { access_token: body.access_token, refresh_token: body.refresh_token };
}

/**
 * A fresh access token for the mailbox. Microsoft may hand back a new refresh token as well;
 * it is returned so the caller can keep it (the old one keeps working until it expires).
 */
export const refreshMailbox = (mailbox: MicrosoftMailbox) =>
  requestTokens(mailbox, {
    grant_type: 'refresh_token',
    refresh_token: open(mailbox.refreshToken),
  });

/** One Microsoft Graph call with an access token; a refusal throws with Graph's reason. */
export async function graph<T>(accessToken: string, path: string, init: RequestInit = {}) {
  const response = await meteredFetch(
    'MICROSOFT',
    pathAction(init.method ?? 'GET', path),
    `${GRAPH}${path}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    },
  );
  if (!response.ok) {
    const detail = (await response.text()).slice(0, ERROR_DETAIL_LIMIT);
    const message = `Microsoft Graph ${path.split('?')[0]} failed (${response.status}): ${detail}`;
    throw response.status === 401 ? new MicrosoftAuthError(message) : new Error(message);
  }
  // sendMail answers 202 with no body.
  return (response.status === 202 ? null : await response.json()) as T;
}

/** The mailbox's own address: its primary SMTP address, else its sign-in name. */
export async function mailboxAddress(accessToken: string): Promise<string> {
  const me = await graph<{ mail?: string | null; userPrincipalName?: string }>(
    accessToken,
    '/me?$select=mail,userPrincipalName',
  );
  const address = (me.mail ?? me.userPrincipalName ?? '').trim().toLowerCase();
  if (!address.includes('@')) {
    throw new Error('Microsoft did not say which mailbox this is.');
  }
  return address;
}

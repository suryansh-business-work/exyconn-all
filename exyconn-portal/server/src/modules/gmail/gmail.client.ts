import { runAsPlatform } from '../../lib/tenant';
import { ConfigurationError } from '../../utils/errors';
import { open } from '../../utils/secretBox';
import { TOKEN_URL } from '../auth/google/google-sign-in.oauth';
import { GmailConfigModel, type GmailConfigDocument } from './gmail.models';
import { rawMessage, type GmailPart, type OutgoingEmail } from './gmail.mime';

const API = 'https://gmail.googleapis.com/gmail/v1/users/me';
/** How much of a refusal's body is kept: enough for Google's whole JSON error, links included. */
const ERROR_DETAIL_LIMIT = 2000;

export interface GmailMessage {
  id: string;
  threadId: string;
  internalDate?: string;
  snippet?: string;
  labelIds?: string[];
  payload?: GmailPart;
}

/** One connected mailbox, with the OAuth client it was connected through. */
export interface Mailbox {
  clientId: string;
  clientSecret: string;
  /** Sealed (utils/secretBox). */
  refreshToken: string;
  email: string;
}

/**
 * Google no longer honours the stored connection (revoked, expired, password changed): only
 * connecting the mailbox again fixes it, so the account is marked NEEDS_RECONNECT.
 */
export class GmailAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GmailAuthError';
  }
}

/** Gmail answered with an error other than an auth refusal; `status` is its HTTP status. */
export class GmailApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'GmailApiError';
  }
}

/** What a CRM user is told while Tech has not set the OAuth apps up; the setup detail is Tech's. */
export const EMAIL_ACCOUNTS_UNAVAILABLE =
  'Email accounts are not available yet. Ask your administrator.';

/**
 * A CRM call that needs the platform's OAuth app. While Tech has not set it up, the CRM user is
 * told plainly to ask their administrator instead of being shown where Tech saves the app.
 */
export async function forCrmUser<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof ConfigurationError) {
      throw new ConfigurationError(EMAIL_ACCOUNTS_UNAVAILABLE);
    }
    throw error;
  }
}

/** The OAuth client Tech saved, or a message saying what Tech still has to do. */
export async function gmailClientConfig(): Promise<GmailConfigDocument> {
  const config = await runAsPlatform(() => GmailConfigModel.findOne({ key: 'default' }).lean());
  if (!config?.enabled || !config.clientId || !config.clientSecret) {
    throw new ConfigurationError(
      'Gmail is not set up. Save the Google client in Tech > Environment Variables > Email accounts (OAuth).',
    );
  }
  return config;
}

/** A fresh access token from the stored refresh token (Google's tokens live an hour). */
async function accessToken(mailbox: Mailbox): Promise<string> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: mailbox.clientId,
      client_secret: mailbox.clientSecret,
      refresh_token: open(mailbox.refreshToken),
      grant_type: 'refresh_token',
    }),
  });
  const body = (await response.json()) as {
    access_token?: string;
    error_description?: string;
    error?: string;
  };
  if (body.error === 'invalid_grant') {
    const reason = (body.error_description ?? 'the token expired').replace(/\.$/, '');
    throw new GmailAuthError(
      `Google refused the connection to ${mailbox.email}: ${reason}. Connect it again.`,
    );
  }
  if (!response.ok || !body.access_token) {
    throw new Error(
      `Gmail refused the stored connection: ${body.error_description ?? body.error ?? 'no reason'}.`,
    );
  }
  return body.access_token;
}

/** One call to the Gmail API with an access token; a refusal throws with Google's reason. */
async function gmailWithToken<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, ERROR_DETAIL_LIMIT);
    const message = `Gmail ${path.split('?')[0]} failed (${response.status}): ${detail}`;
    throw response.status === 401
      ? new GmailAuthError(message)
      : new GmailApiError(message, response.status);
  }
  return (await response.json()) as T;
}

/** One call to the Gmail API as the mailbox; a refusal throws with Google's reason. */
async function gmail<T>(mailbox: Mailbox, path: string, init: RequestInit = {}): Promise<T> {
  return gmailWithToken<T>(await accessToken(mailbox), path, init);
}

/** A Gmail API caller for work that makes many calls: one access token for all of them. */
export type GmailCall = <T>(path: string, init?: RequestInit) => Promise<T>;

/** Fetches one access token and returns a caller that reuses it (Google's tokens live an hour). */
export async function openGmailSession(mailbox: Mailbox): Promise<GmailCall> {
  const token = await accessToken(mailbox);
  return <T>(path: string, init: RequestInit = {}) => gmailWithToken<T>(token, path, init);
}

export const gmailClient = {
  profile: (mailbox: Mailbox) => gmail<{ emailAddress: string }>(mailbox, '/profile'),

  /** The ids of the newest threads matching a Gmail search, e.g. "from:a@x.com OR to:a@x.com". */
  async threadIds(mailbox: Mailbox, query: string, max: number): Promise<string[]> {
    const params = new URLSearchParams({ q: query, maxResults: String(max) });
    const page = await gmail<{ threads?: Array<{ id: string }> }>(
      mailbox,
      `/threads?${params.toString()}`,
    );
    return (page.threads ?? []).map((thread) => thread.id);
  },

  async thread(mailbox: Mailbox, id: string): Promise<GmailMessage[]> {
    const thread = await gmail<{ messages?: GmailMessage[] }>(
      mailbox,
      `/threads/${encodeURIComponent(id)}?format=full`,
    );
    return thread.messages ?? [];
  },

  send: (mailbox: Mailbox, email: OutgoingEmail, threadId?: string) =>
    gmail<GmailMessage>(mailbox, '/messages/send', {
      method: 'POST',
      body: JSON.stringify({ raw: rawMessage(email), ...(threadId ? { threadId } : {}) }),
    }),

  message: (mailbox: Mailbox, id: string) =>
    gmail<GmailMessage>(mailbox, `/messages/${encodeURIComponent(id)}?format=full`),
};

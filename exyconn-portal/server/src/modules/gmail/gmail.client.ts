import { runAsPlatform } from '../../lib/tenant';
import { ConfigurationError } from '../../utils/errors';
import { open } from '../../utils/secretBox';
import { TOKEN_URL } from '../auth/google/google-sign-in.oauth';
import { GmailConfigModel, type GmailConfigDocument } from './gmail.models';
import { rawMessage, type GmailPart, type OutgoingEmail } from './gmail.mime';

const API = 'https://gmail.googleapis.com/gmail/v1/users/me';

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

/** The OAuth client Tech saved, or a message saying what Tech still has to do. */
export async function gmailClientConfig(): Promise<GmailConfigDocument> {
  const config = await runAsPlatform(() => GmailConfigModel.findOne({ key: 'default' }).lean());
  if (!config?.enabled || !config.clientId || !config.clientSecret) {
    throw new ConfigurationError(
      'Gmail is not set up. Save the Google client in Tech > Environment Variables > Gmail.',
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

/** One call to the Gmail API as the mailbox; a refusal throws with Google's reason. */
async function gmail<T>(mailbox: Mailbox, path: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken(mailbox);
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    const message = `Gmail ${path.split('?')[0]} failed (${response.status}): ${detail}`;
    throw response.status === 401 ? new GmailAuthError(message) : new Error(message);
  }
  return (await response.json()) as T;
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

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

/** The connected mailbox's config, or a message saying what Tech still has to do. */
export async function connectedConfig(): Promise<GmailConfigDocument> {
  const config = await runAsPlatform(() => GmailConfigModel.findOne({ key: 'default' }).lean());
  if (!config?.enabled || !config.refreshToken || !config.clientId) {
    throw new ConfigurationError(
      'Gmail is not connected. Connect it in Tech > Environment Variables > Gmail.',
    );
  }
  return config;
}

/** A fresh access token from the stored refresh token (Google's tokens live an hour). */
async function accessToken(config: GmailConfigDocument): Promise<string> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: open(config.refreshToken),
      grant_type: 'refresh_token',
    }),
  });
  const body = (await response.json()) as {
    access_token?: string;
    error_description?: string;
    error?: string;
  };
  if (!response.ok || !body.access_token) {
    throw new Error(
      `Gmail refused the stored connection: ${body.error_description ?? body.error ?? 'no reason'}. Connect it again in Tech.`,
    );
  }
  return body.access_token;
}

/** One call to the Gmail API as the connected mailbox; a refusal throws with Google's reason. */
async function gmail<T>(
  config: GmailConfigDocument,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await accessToken(config);
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
    throw new Error(`Gmail ${path.split('?')[0]} failed (${response.status}): ${detail}`);
  }
  return (await response.json()) as T;
}

export const gmailClient = {
  profile: (config: GmailConfigDocument) => gmail<{ emailAddress: string }>(config, '/profile'),

  /** The ids of the newest threads matching a Gmail search, e.g. "from:a@x.com OR to:a@x.com". */
  async threadIds(config: GmailConfigDocument, query: string, max: number): Promise<string[]> {
    const params = new URLSearchParams({ q: query, maxResults: String(max) });
    const page = await gmail<{ threads?: Array<{ id: string }> }>(
      config,
      `/threads?${params.toString()}`,
    );
    return (page.threads ?? []).map((thread) => thread.id);
  },

  async thread(config: GmailConfigDocument, id: string): Promise<GmailMessage[]> {
    const thread = await gmail<{ messages?: GmailMessage[] }>(
      config,
      `/threads/${encodeURIComponent(id)}?format=full`,
    );
    return thread.messages ?? [];
  },

  send: (config: GmailConfigDocument, email: OutgoingEmail, threadId?: string) =>
    gmail<GmailMessage>(config, '/messages/send', {
      method: 'POST',
      body: JSON.stringify({ raw: rawMessage(email), ...(threadId ? { threadId } : {}) }),
    }),

  message: (config: GmailConfigDocument, id: string) =>
    gmail<GmailMessage>(config, `/messages/${encodeURIComponent(id)}?format=full`),
};

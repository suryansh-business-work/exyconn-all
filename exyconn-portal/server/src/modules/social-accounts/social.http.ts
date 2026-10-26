import { meteredFetch, pathAction } from '../tech/usage/usage.meter';

/** The network and endpoint a social call went to, e.g. api.linkedin.com/v2/ugcPosts. */
const socialAction = (url: string): string => {
  const { host, pathname } = new URL(url);
  return pathAction('', `${host}${pathname}`).trim();
};

/**
 * The two HTTP calls every provider needs: a form POST for the token exchange, and an
 * authenticated GET. A provider's own error text is kept — "redirect_uri mismatch" is what
 * the person setting the app up needs to read.
 */
export class SocialProviderError extends Error {
  /** The HTTP status the provider answered with, when the refusal came from a reply. */
  readonly status: number | null;

  constructor(provider: string, detail: string, status: number | null = null) {
    super(`${provider} refused the connection: ${detail}`);
    this.name = 'SocialProviderError';
    this.status = status;
  }
}

type Json = Record<string, unknown>;

async function read(provider: string, response: Response): Promise<Json> {
  const body = (await response.json().catch(() => ({}))) as Json;
  if (!response.ok) {
    const error = body.error as Json | string | undefined;
    const detail =
      (typeof error === 'object' ? error?.message : error) ??
      body.error_description ??
      body.message ??
      // X words its refusals as `detail`.
      body.detail ??
      `HTTP ${response.status}`;
    throw new SocialProviderError(
      provider,
      typeof detail === 'string' ? detail : JSON.stringify(detail),
      response.status,
    );
  }
  return body;
}

/** The `Authorization` header for providers that take the app's id and secret as Basic auth. */
export function basicAuthHeader(clientId: string, clientSecret: string): Record<string, string> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  return { Authorization: `Basic ${credentials}` };
}

export async function postForm(
  provider: string,
  url: string,
  form: Record<string, string>,
  headers: Record<string, string> = {},
): Promise<Json> {
  const response = await meteredFetch('SOCIAL', socialAction(url), url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      ...headers,
    },
    body: new URLSearchParams(form).toString(),
  });
  return read(provider, response);
}

export async function getJson(
  provider: string,
  url: string,
  accessToken?: string,
  headers: Record<string, string> = {},
): Promise<Json> {
  const response = await meteredFetch('SOCIAL', socialAction(url), url, {
    headers: {
      Accept: 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });
  return read(provider, response);
}

/** What a JSON request answered: the body, and the headers some providers put ids in. */
export interface JsonReply {
  body: Json;
  headers: Headers;
}

/**
 * Any authenticated JSON request — a POST whose new id comes back in a header (LinkedIn's
 * `x-restli-id`), or a DELETE. An empty reply (204) reads as an empty body.
 */
export async function sendJson(
  provider: string,
  url: string,
  init: Readonly<{
    method: 'POST' | 'DELETE';
    accessToken?: string;
    body?: unknown;
    headers?: Record<string, string>;
  }>,
): Promise<JsonReply> {
  const response = await meteredFetch('SOCIAL', socialAction(url), url, {
    method: init.method,
    headers: {
      Accept: 'application/json',
      ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(init.accessToken ? { Authorization: `Bearer ${init.accessToken}` } : {}),
      ...init.headers,
    },
    ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
  });
  return { body: await read(provider, response), headers: response.headers };
}

/** An authenticated JSON POST — what publishing uses. */
export async function postJson(
  provider: string,
  url: string,
  body: unknown,
  accessToken: string,
  headers: Record<string, string> = {},
): Promise<Json> {
  const response = await meteredFetch('SOCIAL', socialAction(url), url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...headers,
    },
    body: JSON.stringify(body),
  });
  return read(provider, response);
}

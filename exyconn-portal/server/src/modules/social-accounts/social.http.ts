/**
 * The two HTTP calls every provider needs: a form POST for the token exchange, and an
 * authenticated GET. A provider's own error text is kept — "redirect_uri mismatch" is what
 * the person setting the app up needs to read.
 */
export class SocialProviderError extends Error {
  constructor(provider: string, detail: string) {
    super(`${provider} refused the connection: ${detail}`);
    this.name = 'SocialProviderError';
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
      `HTTP ${response.status}`;
    throw new SocialProviderError(provider, String(detail));
  }
  return body;
}

export async function postForm(
  provider: string,
  url: string,
  form: Record<string, string>,
  headers: Record<string, string> = {},
): Promise<Json> {
  const response = await fetch(url, {
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

export async function getJson(provider: string, url: string, accessToken?: string): Promise<Json> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
  return read(provider, response);
}

/** An authenticated JSON POST — what publishing uses. */
export async function postJson(
  provider: string,
  url: string,
  body: unknown,
  accessToken: string,
  headers: Record<string, string> = {},
): Promise<Json> {
  const response = await fetch(url, {
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

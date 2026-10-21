import { createHash, randomBytes } from 'node:crypto';
import { env } from '../../../config/env';

export const GOOGLE_CALLBACK_PATH = '/oauth/google';

/** The address Google sends the browser back to; registered as the client's redirect URI. */
export const googleRedirectUri = () => `${env.apiPublicUrl}${GOOGLE_CALLBACK_PATH}/callback`;

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ISSUERS: ReadonlySet<string> = new Set([
  'accounts.google.com',
  'https://accounts.google.com',
]);

interface GoogleClient {
  clientId: string;
  clientSecret: string;
}

/** A URL-safe random value, for a nonce, a PKCE verifier or a one-time ticket. */
export const randomToken = (bytes: number) => randomBytes(bytes).toString('base64url');

export const sha256 = (value: string) => createHash('sha256').update(value).digest('base64url');

/** Google's consent page for this client, asking only for the email (OpenID Connect). */
export function authorizeUrl(clientId: string, nonce: string, codeVerifier: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: googleRedirectUri(),
    response_type: 'code',
    scope: 'openid email',
    state: nonce,
    code_challenge: sha256(codeVerifier),
    code_challenge_method: 'S256',
    prompt: 'select_account',
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

/** Trades the code for Google's ID token; a refusal throws with Google's own reason. */
export async function exchangeCode(
  client: GoogleClient,
  code: string,
  codeVerifier: string,
  redirectUri = googleRedirectUri(),
): Promise<string> {
  const tokens = await exchangeForTokens(client, code, codeVerifier, redirectUri);
  if (!tokens.id_token) {
    throw new Error('Google refused the sign-in: no ID token');
  }
  return tokens.id_token;
}

export interface GoogleTokens {
  id_token?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  /** The space-separated scopes Google actually granted. */
  scope?: string;
}

/** Trades an authorisation code for Google's tokens; a refusal throws with Google's reason. */
export async function exchangeForTokens(
  client: GoogleClient,
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<GoogleTokens> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: client.clientId,
      client_secret: client.clientSecret,
      code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });
  const body = (await response.json()) as GoogleTokens & {
    error?: string;
    error_description?: string;
  };
  if (!response.ok) {
    throw new Error(
      `Google refused: ${body.error ?? 'no reason'} ${body.error_description ?? ''}`.trim(),
    );
  }
  return body;
}

interface IdTokenClaims {
  iss?: string;
  aud?: string;
  exp?: number;
  email?: string;
  email_verified?: boolean;
}

/**
 * The verified email in an ID token. The token came straight from Google's token endpoint over
 * TLS, in exchange for our own secret, so OpenID Connect lets its claims be trusted without
 * checking the signature (Core 3.1.3.7); the issuer, audience and expiry are still checked.
 */
export function verifiedEmailOf(idToken: string, clientId: string): string {
  const payload = idToken.split('.')[1] ?? '';
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as IdTokenClaims;
  const fresh = (claims.exp ?? 0) * 1000 > Date.now();
  if (!ISSUERS.has(claims.iss ?? '') || claims.aud !== clientId || !fresh) {
    throw new Error('Google’s answer was not meant for this portal.');
  }
  if (!claims.email || claims.email_verified !== true) {
    throw new Error('Google has not verified that email address.');
  }
  return claims.email;
}

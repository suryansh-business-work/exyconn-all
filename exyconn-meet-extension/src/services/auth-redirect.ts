import type { PkcePair } from '../utils/pkce';

export interface ConnectUrlInput {
  portalUrl: string;
  connectPath: string;
  extensionId: string;
  redirectUri: string;
  pkce: PkcePair;
}

/** The portal page that signs the extension in (OAuth 2.0 authorization code + PKCE S256). */
export function buildConnectUrl(input: ConnectUrlInput): string {
  const url = new URL(input.connectPath, input.portalUrl);
  url.searchParams.set('client_id', input.extensionId);
  url.searchParams.set('redirect_uri', input.redirectUri);
  url.searchParams.set('code_challenge', input.pkce.challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', input.pkce.state);
  return url.href;
}

/** A sign-in that did not complete, with an English source string to show. */
export class SignInError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SignInError';
  }
}

/**
 * The authorization code from the portal's redirect. The `state` must be the one this
 * sign-in sent, or the answer belongs to someone else's request (CSRF) and is refused.
 */
export function readAuthRedirect(responseUrl: string | undefined, expectedState: string): string {
  if (responseUrl === undefined || responseUrl.length === 0) {
    throw new SignInError('Sign-in was cancelled');
  }
  const params = new URL(responseUrl).searchParams;
  if (params.has('error')) {
    throw new SignInError('The portal did not allow the sign-in');
  }
  if (params.get('state') !== expectedState) {
    throw new SignInError('The sign-in answer did not match this request');
  }
  const code = params.get('code');
  if (code === null || code.length === 0) {
    throw new SignInError('The portal sent no sign-in code');
  }
  return code;
}

import { CHROME_EXTENSION_REDIRECT } from '@exyconn/regex';
import type { MaAuthorizeExtensionInput } from '@exyconn/shell/graphql/generated';

/** The PKCE sign-in request the extension opened this page with, or null when one is missing. */
export function readConnectRequest(params: URLSearchParams): MaAuthorizeExtensionInput | null {
  const request = {
    extensionId: params.get('client_id') ?? '',
    redirectUri: params.get('redirect_uri') ?? '',
    codeChallenge: params.get('code_challenge') ?? '',
    codeChallengeMethod: params.get('code_challenge_method') ?? '',
    state: params.get('state') ?? '',
  };
  return Object.values(request).every(Boolean) ? request : null;
}

/**
 * Where Cancel sends the browser: back to the extension with `error=access_denied`, but only
 * when the redirect is a Chrome extension's own address — never an arbitrary site.
 */
export function deniedRedirect(redirectUri: string, state: string): string | null {
  if (!CHROME_EXTENSION_REDIRECT.test(redirectUri)) {
    return null;
  }
  const url = new URL(redirectUri);
  url.searchParams.set('error', 'access_denied');
  url.searchParams.set('state', state);
  return url.toString();
}

import { describe, expect, it } from 'vitest';
import { deniedRedirect, readConnectRequest } from '../../../src/connect/connect-params';

const REDIRECT = 'https://abcdefghijklmnopabcdefghijklmnop.chromiumapp.org/cb';
const QUERY = `client_id=ext&redirect_uri=${encodeURIComponent(REDIRECT)}&code_challenge=abc&code_challenge_method=S256&state=xyz`;

describe('readConnectRequest', () => {
  it('reads the PKCE request the extension opened the page with', () => {
    expect(readConnectRequest(new URLSearchParams(QUERY))).toEqual({
      extensionId: 'ext',
      redirectUri: REDIRECT,
      codeChallenge: 'abc',
      codeChallengeMethod: 'S256',
      state: 'xyz',
    });
  });

  it('refuses a request with any part missing', () => {
    expect(readConnectRequest(new URLSearchParams(QUERY.replace('state=xyz', '')))).toBeNull();
    expect(readConnectRequest(new URLSearchParams())).toBeNull();
  });
});

describe('deniedRedirect', () => {
  it("sends Cancel back to the extension's own address with access_denied and the state", () => {
    const url = new URL(deniedRedirect(REDIRECT, 'xyz') ?? '');
    expect(url.origin + url.pathname).toBe(REDIRECT);
    expect(url.searchParams.get('error')).toBe('access_denied');
    expect(url.searchParams.get('state')).toBe('xyz');
  });

  it('never redirects to an address that is not a Chrome extension', () => {
    expect(deniedRedirect('https://evil.example.com/cb', 'xyz')).toBeNull();
  });
});

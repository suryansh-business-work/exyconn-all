import { createHash, randomBytes } from 'node:crypto';
import {
  authorizeExtension,
  exchangeCode,
  type AuthorizeInput,
  type TokenResponse,
} from '../../../../src/modules/meeting-assistant/extension.auth';
import type { MaActor } from '../../../../src/modules/meeting-assistant/ma.access';
import { EXTENSION_ID } from './ma.env';

/** The extension's sign-in redirect and the device it reports. */
export const REDIRECT = `https://${EXTENSION_ID}.chromiumapp.org/callback`;
export const DEVICE = {
  deviceLabel: 'Work laptop',
  extensionVersion: '1.0.0',
  userAgent: 'Chrome',
};

/** A PKCE pair as the extension makes one. */
export function pkce() {
  const verifier = randomBytes(32).toString('base64url');
  return { verifier, challenge: createHash('sha256').update(verifier).digest('base64url') };
}

export const authorizeInput = (
  challenge: string,
  overrides: Partial<AuthorizeInput> = {},
): AuthorizeInput => ({
  extensionId: EXTENSION_ID,
  redirectUri: REDIRECT,
  codeChallenge: challenge,
  codeChallengeMethod: 'S256',
  state: 'state-1',
  ...overrides,
});

/** Runs the portal half of the sign-in and returns the one-time code and its verifier. */
export async function issueCode(actor: MaActor) {
  const { verifier, challenge } = pkce();
  const url = new URL(await authorizeExtension(actor, authorizeInput(challenge)));
  return { code: url.searchParams.get('code') ?? '', verifier, url };
}

export const grantOf = (code: string, verifier: string) => ({
  code,
  codeVerifier: verifier,
  redirectUri: REDIRECT,
  extensionId: EXTENSION_ID,
});

/** The whole sign-in: the tokens a freshly connected extension holds. */
export async function signIn(actor: MaActor): Promise<TokenResponse> {
  const { code, verifier } = await issueCode(actor);
  return exchangeCode(grantOf(code, verifier), DEVICE);
}

import { base64Url } from './base64';

/** 48 random bytes → a 64-character verifier, inside RFC 7636's 43–128 range. */
const VERIFIER_BYTES = 48;
const STATE_BYTES = 16;

export interface PkcePair {
  verifier: string;
  challenge: string;
  state: string;
}

/** Cryptographically random bytes, URL-safe encoded. */
export function randomToken(byteLength: number): string {
  return base64Url(globalThis.crypto.getRandomValues(new Uint8Array(byteLength)));
}

/** The S256 challenge for a verifier: base64url(SHA-256(verifier)). */
export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier),
  );
  return base64Url(new Uint8Array(digest));
}

/** A fresh verifier, its challenge and an anti-CSRF `state` for one sign-in. */
export async function createPkcePair(): Promise<PkcePair> {
  const verifier = randomToken(VERIFIER_BYTES);
  return { verifier, challenge: await pkceChallenge(verifier), state: randomToken(STATE_BYTES) };
}

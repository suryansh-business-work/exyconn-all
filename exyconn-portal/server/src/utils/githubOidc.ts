import { createPublicKey, type JsonWebKey, type KeyObject } from 'node:crypto';
import jwt from 'jsonwebtoken';

/** Who issues GitHub Actions OIDC tokens, and where its signing keys are published. */
export const GITHUB_OIDC_ISSUER = 'https://token.actions.githubusercontent.com';
const JWKS_URL = `${GITHUB_OIDC_ISSUER}/.well-known/jwks`;

/** How long the signing keys are trusted before they are read again. */
const JWKS_TTL_MS = 60 * 60_000;

/** The claims of a GitHub Actions run that the portal checks or records. */
export interface GithubRunClaims {
  repository: string;
  ref: string;
  event_name: string;
  workflow_ref: string;
  sha: string;
  run_id: string;
  run_number: string;
  actor: string;
}

/** A token GitHub did not sign, or one for another audience, repository, branch or workflow. */
export class OidcRefusal extends Error {}

let keyCache: { at: number; keys: Map<string, KeyObject> } | null = null;

async function fetchKeys(): Promise<Map<string, KeyObject>> {
  const response = await fetch(JWKS_URL, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) {
    throw new Error(`GitHub's OIDC keys could not be read (${response.status})`);
  }
  const { keys } = (await response.json()) as { keys: (JsonWebKey & { kid: string })[] };
  const map = new Map(keys.map((key) => [key.kid, createPublicKey({ key, format: 'jwk' })]));
  keyCache = { at: Date.now(), keys: map };
  return map;
}

/** The key a token names; the cached set first, read again once for a key it does not know yet. */
async function signingKey(kid: string): Promise<KeyObject> {
  const cached = keyCache && Date.now() - keyCache.at < JWKS_TTL_MS ? keyCache.keys : null;
  const key = cached?.get(kid) ?? (await fetchKeys()).get(kid);
  if (!key) {
    throw new OidcRefusal('The token is signed with a key GitHub does not publish.');
  }
  return key;
}

/** Only these events run on a branch the way a merge does: a push, or a manual run of it. */
const RUN_EVENTS: ReadonlySet<string> = new Set(['push', 'workflow_dispatch']);

export interface OidcExpectation {
  audience: string;
  repository: string;
  ref: string;
  /** The workflow file, e.g. `.github/workflows/meet-extension-release.yml`. */
  workflowPath: string;
}

/**
 * Verifies a GitHub Actions OIDC token: RS256 by one of GitHub's published keys, issued by
 * GitHub for `audience`, from `repository` on `ref`, run by `workflowPath` on a push or a manual
 * dispatch. Returns its claims, or throws {@link OidcRefusal}.
 */
export async function verifyGithubOidc(
  token: string,
  expected: OidcExpectation,
): Promise<GithubRunClaims> {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded?.header.kid || decoded.header.alg !== 'RS256') {
    throw new OidcRefusal('Not a GitHub Actions OIDC token.');
  }
  // Outside the try: GitHub's keys failing to load is the server's failure, not a refusal.
  const key = await signingKey(decoded.header.kid);
  let claims: GithubRunClaims;
  try {
    claims = jwt.verify(token, key, {
      algorithms: ['RS256'],
      issuer: GITHUB_OIDC_ISSUER,
      audience: expected.audience,
    }) as GithubRunClaims;
  } catch (error) {
    throw new OidcRefusal(`The token was refused: ${(error as Error).message}`);
  }
  const workflow = `${expected.repository}/${expected.workflowPath}@${expected.ref}`;
  if (
    claims.repository !== expected.repository ||
    claims.ref !== expected.ref ||
    claims.workflow_ref !== workflow ||
    !RUN_EVENTS.has(claims.event_name)
  ) {
    throw new OidcRefusal('The token is not from the release workflow on the allowed branch.');
  }
  return claims;
}

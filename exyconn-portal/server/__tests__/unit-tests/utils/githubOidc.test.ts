import { generateKeyPairSync, type KeyObject } from 'node:crypto';
import jwt from 'jsonwebtoken';
import {
  GITHUB_OIDC_ISSUER,
  OidcRefusal,
  verifyGithubOidc,
  type OidcExpectation,
} from '../../../src/utils/githubOidc';

/** Two of "GitHub's" signing keys, made here: the second one is published only after a rotation. */
const keyA = generateKeyPairSync('rsa', { modulusLength: 2048 });
const keyB = generateKeyPairSync('rsa', { modulusLength: 2048 });
const stranger = generateKeyPairSync('rsa', { modulusLength: 2048 });

const jwk = (publicKey: KeyObject, kid: string) => ({
  ...publicKey.export({ format: 'jwk' }),
  kid,
  alg: 'RS256',
  use: 'sig',
});

const EXPECTED: OidcExpectation = {
  audience: 'https://portal-server.example.com',
  repository: 'acme/portal',
  ref: 'refs/heads/main',
  workflowPath: '.github/workflows/meet-extension-release.yml',
};

const CLAIMS = {
  repository: 'acme/portal',
  ref: 'refs/heads/main',
  event_name: 'push',
  workflow_ref: 'acme/portal/.github/workflows/meet-extension-release.yml@refs/heads/main',
  sha: 'a'.repeat(40),
  run_id: '123',
  run_number: '45',
  actor: 'octocat',
};

interface SignOptions {
  key?: KeyObject;
  kid?: string;
  issuer?: string;
  audience?: string;
  expiresIn?: number;
}

function sign(claims: Record<string, unknown> = {}, options: SignOptions = {}): string {
  return jwt.sign({ ...CLAIMS, ...claims }, options.key ?? keyA.privateKey, {
    algorithm: 'RS256',
    keyid: options.kid ?? 'key-a',
    issuer: options.issuer ?? GITHUB_OIDC_ISSUER,
    audience: options.audience ?? EXPECTED.audience,
    expiresIn: options.expiresIn ?? 300,
  });
}

let fetchMock: jest.SpyInstance;
/** A fresh response per read: a body can be read once. */
const publish = (...keys: ReturnType<typeof jwk>[]) =>
  fetchMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ keys }))));

/** Each test starts with an empty key cache: the module is loaded afresh. */
let verify: typeof verifyGithubOidc;
let Refusal: typeof OidcRefusal;

beforeEach(() => {
  fetchMock = jest.spyOn(globalThis, 'fetch');
  publish(jwk(keyA.publicKey, 'key-a'));
  jest.isolateModules(() => {
    const fresh = jest.requireActual('../../../src/utils/githubOidc');
    verify = fresh.verifyGithubOidc;
    Refusal = fresh.OidcRefusal;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

const refusalOf = async (token: string, expected = EXPECTED) => {
  const error = await verify(token, expected).catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(Refusal);
  return (error as Error).message;
};

describe('verifyGithubOidc', () => {
  it("accepts the release workflow's token from main and returns its claims", async () => {
    const claims = await verify(sign(), EXPECTED);

    expect(claims).toMatchObject(CLAIMS);
    expect(fetchMock).toHaveBeenCalledWith(
      `${GITHUB_OIDC_ISSUER}/.well-known/jwks`,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('accepts a manual run of the workflow too', async () => {
    await expect(verify(sign({ event_name: 'workflow_dispatch' }), EXPECTED)).resolves.toMatchObject(
      { event_name: 'workflow_dispatch' },
    );
  });

  it('refuses anything that is not an RS256 JWT with a key id', async () => {
    const hs256 = jwt.sign(CLAIMS, 'shared-secret', { algorithm: 'HS256', keyid: 'key-a' });
    const noKid = jwt.sign(CLAIMS, keyA.privateKey, { algorithm: 'RS256' });

    expect(await refusalOf('')).toBe('Not a GitHub Actions OIDC token.');
    expect(await refusalOf('not.a.jwt')).toBe('Not a GitHub Actions OIDC token.');
    expect(await refusalOf(hs256)).toBe('Not a GitHub Actions OIDC token.');
    expect(await refusalOf(noKid)).toBe('Not a GitHub Actions OIDC token.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses a token from another issuer or for another audience, or one that expired', async () => {
    expect(await refusalOf(sign({}, { issuer: 'https://evil.example.com' }))).toMatch(
      /^The token was refused: jwt issuer invalid/,
    );
    expect(await refusalOf(sign({}, { audience: 'https://other.example.com' }))).toMatch(
      /^The token was refused: jwt audience invalid/,
    );
    expect(await refusalOf(sign({}, { expiresIn: -10 }))).toBe(
      'The token was refused: jwt expired',
    );
  });

  it('refuses a bad signature: a known key id signed by another key', async () => {
    expect(await refusalOf(sign({}, { key: stranger.privateKey }))).toBe(
      'The token was refused: invalid signature',
    );
  });

  it.each([
    ['repository', { repository: 'evil/portal' }],
    ['ref', { ref: 'refs/heads/feature' }],
    [
      'workflow_ref',
      { workflow_ref: 'acme/portal/.github/workflows/other.yml@refs/heads/main' },
    ],
    ['event_name', { event_name: 'pull_request' }],
  ])('refuses a token whose %s is not the release workflow on main', async (_claim, patch) => {
    expect(await refusalOf(sign(patch))).toBe(
      'The token is not from the release workflow on the allowed branch.',
    );
  });

  it('reads the keys again once for a key it does not know: a rotation', async () => {
    await verify(sign(), EXPECTED);
    publish(jwk(keyA.publicKey, 'key-a'), jwk(keyB.publicKey, 'key-b'));

    await expect(
      verify(sign({}, { key: keyB.privateKey, kid: 'key-b' }), EXPECTED),
    ).resolves.toMatchObject({ repository: 'acme/portal' });
    await verify(sign({}, { key: keyB.privateKey, kid: 'key-b' }), EXPECTED);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('refuses a key GitHub does not publish, even after reading the keys again', async () => {
    expect(await refusalOf(sign({}, { key: stranger.privateKey, kid: 'unknown' }))).toBe(
      'The token is signed with a key GitHub does not publish.',
    );
  });

  it('reuses the keys for an hour, then reads them again', async () => {
    const now = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(now);
    await verify(sign(), EXPECTED);
    clock.mockReturnValue(now + 59 * 60_000);
    await verify(sign(), EXPECTED);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    clock.mockReturnValue(now + 61 * 60_000);
    await verify(sign(), EXPECTED);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("fails, without refusing the token, when GitHub's keys cannot be read", async () => {
    fetchMock.mockImplementation(() => Promise.resolve(new Response('busy', { status: 503 })));

    const error = await verify(sign(), EXPECTED).catch((caught: unknown) => caught);

    expect(error).not.toBeInstanceOf(Refusal);
    expect((error as Error).message).toBe("GitHub's OIDC keys could not be read (503)");
  });
});

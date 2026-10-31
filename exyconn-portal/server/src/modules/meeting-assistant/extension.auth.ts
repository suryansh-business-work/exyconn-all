import { createHash, randomBytes } from 'node:crypto';
import { env } from '../../config/env';
import { organizationOf, runAsPlatform, runForOrganization } from '../../lib/tenant';
import { signExtensionToken, EXTENSION_TOKEN_TTL_SECONDS } from '../../utils/jwt';
import { badRequest } from '../../utils/errors';
import { UserModel } from '../admin/user.model';
import { recordAudit } from '../audit';
import { MaAuthCodeModel, MaExtensionSessionModel } from './models';
import { getMaSettings } from './settings.service';
import { MA_AUDIT_MODULE } from './ma.enums';
import { proveSecondFactor, verifyCredentials } from '../auth/auth.service';
import { assertWorkspaceOpen } from '../auth/workspace-status';
import { mfaIsOn } from '../auth/mfa.service';
import { signMfaChallenge } from '../../utils/jwt';
import type { MaActor } from './ma.access';

/** A one-time code is worth this long: the browser hands it straight back to the extension. */
const CODE_TTL_MS = 60_000;
/** A signed-in extension stays signed in this long without use; every refresh extends it. */
export const REFRESH_TTL_MS = 30 * 24 * 60 * 60_000;
const PKCE_CHALLENGE = /^[\w-]{43}$/;
const PKCE_VERIFIER = /^[\w.~-]{43,128}$/;

/** A refused token request, answered as OAuth's `{ error, error_description }`. */
export class TokenRefusal extends Error {
  constructor(
    readonly code: 'invalid_request' | 'invalid_grant' | 'access_denied' | 'unsupported_grant_type',
    message: string,
  ) {
    super(message);
    this.name = 'TokenRefusal';
  }
}

const hashOf = (value: string) => createHash('sha256').update(value).digest('hex');
const s256 = (verifier: string) => createHash('sha256').update(verifier).digest('base64url');
const randomSecret = () => randomBytes(32).toString('base64url');

export interface AuthorizeInput {
  extensionId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  state: string;
}

/** One of the extension builds this portal trusts. */
function extensionTrusted(extensionId: string): boolean {
  return env.meetAssistant.extensionIds.includes(extensionId);
}

/** The redirect a Chrome extension's identity flow listens on, for exactly this extension. */
export function extensionRedirectAllowed(extensionId: string, redirectUri: string): boolean {
  return (
    extensionTrusted(extensionId) &&
    redirectUri.startsWith(`https://${extensionId}.chromiumapp.org/`)
  );
}

/**
 * Step one of the extension's sign-in (authorization code + PKCE): the signed-in person
 * allowed it in the portal, so issue a one-time code bound to this extension, this redirect
 * and this challenge. Returns where to send the browser.
 */
export async function authorizeExtension(actor: MaActor, input: AuthorizeInput): Promise<string> {
  if (input.codeChallengeMethod !== 'S256' || !PKCE_CHALLENGE.test(input.codeChallenge)) {
    badRequest(
      'The extension sent an invalid sign-in request. Update the extension and try again.',
    );
  }
  if (!extensionRedirectAllowed(input.extensionId, input.redirectUri)) {
    badRequest('This extension is not one this portal trusts.');
  }
  if (input.state.length === 0 || input.state.length > 200) {
    badRequest('The extension sent an invalid sign-in request.');
  }
  const code = randomSecret();
  await MaAuthCodeModel.create({
    codeHash: hashOf(code),
    userId: actor.id,
    extensionId: input.extensionId,
    redirectUri: input.redirectUri,
    codeChallenge: input.codeChallenge,
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  });
  const url = new URL(input.redirectUri);
  url.searchParams.set('code', code);
  url.searchParams.set('state', input.state);
  return url.toString();
}

export interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
}

export interface DeviceInfo {
  deviceLabel: string;
  extensionVersion: string;
  userAgent: string;
}

/** The person may still use the assistant: active account, company switched on, allowed. */
async function usableAccount(userId: string) {
  const user = await UserModel.findById(userId)
    .select('name email roles isActive isBlocked tokenVersion')
    .lean();
  if (!user?.isActive || user.isBlocked) {
    throw new TokenRefusal('access_denied', 'This account cannot sign in.');
  }
  const settings = await getMaSettings();
  if (
    !settings.enabled ||
    (settings.allowedUserIds.length > 0 && !settings.allowedUserIds.includes(userId))
  ) {
    throw new TokenRefusal(
      'access_denied',
      'The Meeting Assistant is not enabled for this account.',
    );
  }
  return user;
}

async function issue(
  sessionId: string,
  userId: string,
  organizationId: string,
  refresh: string,
): Promise<TokenResponse> {
  const user = await usableAccount(userId);
  const accessToken = signExtensionToken({
    id: userId,
    roles: user.roles,
    email: user.email,
    organizationId,
    tv: user.tokenVersion ?? 0,
    esid: sessionId,
  });
  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: EXTENSION_TOKEN_TTL_SECONDS,
    refresh_token: refresh,
    refresh_expires_in: Math.floor(REFRESH_TTL_MS / 1000),
  };
}

export interface CodeGrant {
  code: string;
  codeVerifier: string;
  redirectUri: string;
  extensionId: string;
}

/** Step two: the extension trades its code and verifier for a session. Spends the code. */
export async function exchangeCode(grant: CodeGrant, device: DeviceInfo): Promise<TokenResponse> {
  if (!PKCE_VERIFIER.test(grant.codeVerifier)) {
    throw new TokenRefusal('invalid_request', 'Invalid code verifier.');
  }
  const code = await runAsPlatform(() =>
    MaAuthCodeModel.findOneAndUpdate(
      { codeHash: hashOf(grant.code), usedAt: null, expiresAt: { $gt: new Date() } },
      { $set: { usedAt: new Date() } },
      { new: true },
    ).lean(),
  );
  const matches =
    code?.extensionId === grant.extensionId &&
    code.redirectUri === grant.redirectUri &&
    code.codeChallenge === s256(grant.codeVerifier);
  const organizationId = code ? organizationOf(code) : null;
  if (!code || !matches || !organizationId) {
    throw new TokenRefusal('invalid_grant', 'The sign-in code is invalid or has expired.');
  }
  return startSession(code.userId, organizationId, grant.extensionId, device);
}

/** A new extension session for someone who has proved who they are, with its first tokens. */
function startSession(
  userId: string,
  organizationId: string,
  extensionId: string,
  device: DeviceInfo,
): Promise<TokenResponse> {
  return runForOrganization(organizationId, async () => {
    await usableAccount(userId);
    const refresh = randomSecret();
    const session = await MaExtensionSessionModel.create({
      userId,
      extensionId,
      refreshHash: hashOf(refresh),
      ...device,
      lastSeenAt: new Date(),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    });
    await recordAudit(
      { user: null },
      {
        action: 'LOGIN',
        module: MA_AUDIT_MODULE,
        entityId: session._id,
        entityLabel: device.deviceLabel || 'Chrome extension',
        summary: `Signed in to the Meeting Assistant Chrome extension (${device.extensionVersion || 'unknown version'})`,
        actor: { id: userId },
      },
    );
    return issue(session._id.toHexString(), userId, organizationId, refresh);
  });
}

/** The extension id a meeting bot's session is filed under, apart from real browsers. */
export const BOT_EXTENSION_ID = 'meet-bot';

/**
 * A session for the meeting bot acting for its owner: the same narrow extension token, so the
 * bot can run only what the extension can, and only for that person. Revoked when the trip ends.
 */
export function startBotSession(
  userId: string,
  organizationId: string,
  botName: string,
): Promise<TokenResponse> {
  return startSession(userId, organizationId, BOT_EXTENSION_ID, {
    deviceLabel: botName,
    extensionVersion: 'meeting-bot',
    userAgent: 'Exyconn meeting bot',
  });
}

/** With two-factor on, a password buys only this: a five-minute challenge for the code. */
export interface MfaRequired {
  mfa_required: true;
  mfa_challenge: string;
}

/** What a sign-in step answers: tokens, or a demand for the second factor. */
export type SignInStep = TokenResponse | MfaRequired;

/**
 * Runs one of the portal's own sign-in checks and answers its refusal as OAuth's
 * `invalid_grant`, keeping the portal's message (wrong password, locked, expired code).
 */
async function proved<T>(check: () => Promise<T>): Promise<T> {
  try {
    return await check();
  } catch (error) {
    if (error instanceof Error && 'extensions' in error) {
      throw new TokenRefusal('invalid_grant', error.message);
    }
    throw error;
  }
}

export interface PasswordGrant {
  email: string;
  password: string;
  extensionId: string;
  ip: string;
}

/**
 * Signs the extension in with the person's portal email and password, typed into the
 * extension itself. The same checks as the portal sign-in apply — throttling, lockout, a
 * suspended company — and two-factor, when it is on, still has to be passed.
 *
 * The extension id is not checked here: the caller states it in the request body, so it
 * proves nothing (anyone can send a listed id), and an unpacked build's id follows its folder
 * path. The password is the proof, exactly as on the portal sign-in. The id only guards the
 * redirect flow above, where Chrome binds it to the extension's own chromiumapp.org address.
 */
export async function signInWithPassword(
  grant: PasswordGrant,
  device: DeviceInfo,
): Promise<SignInStep> {
  const user = await proved(() => verifyCredentials(grant.email, grant.password, grant.ip));
  const organizationId = organizationOf(user);
  await proved(() => assertWorkspaceOpen(organizationId));
  if (!organizationId) {
    throw new TokenRefusal('access_denied', 'This account cannot sign in.');
  }
  if (await mfaIsOn(user.id)) {
    return { mfa_required: true, mfa_challenge: signMfaChallenge(user.id) };
  }
  return startSession(user.id, organizationId, grant.extensionId, device);
}

export interface MfaGrant {
  challenge: string;
  code: string;
  extensionId: string;
  ip: string;
}

/** The second half of a two-factor sign-in from the extension (see proveSecondFactor). */
export async function completeMfaSignIn(grant: MfaGrant, device: DeviceInfo): Promise<SignInStep> {
  const user = await proved(() => proveSecondFactor(grant.challenge, grant.code, grant.ip));
  const organizationId = organizationOf(user);
  if (!organizationId) {
    throw new TokenRefusal('access_denied', 'This account cannot sign in.');
  }
  return startSession(user.id, organizationId, grant.extensionId, device);
}

/**
 * Renews the access token and rotates the refresh token. A refresh token that was already
 * rotated away is being replayed — someone copied it — so the whole session is revoked.
 */
export async function refreshSession(
  refreshToken: string,
  extensionVersion: string,
): Promise<TokenResponse> {
  const hash = hashOf(refreshToken);
  const session = await runAsPlatform(() => MaExtensionSessionModel.findOne({ refreshHash: hash }));
  if (!session) {
    await runAsPlatform(() =>
      MaExtensionSessionModel.updateOne(
        { previousRefreshHash: hash, revokedAt: null },
        { $set: { revokedAt: new Date(), revokedReason: 'Refresh token reused' } },
      ),
    );
    throw new TokenRefusal('invalid_grant', 'Sign in again.');
  }
  const organizationId = organizationOf(session);
  if (session.revokedAt || session.expiresAt < new Date() || !organizationId) {
    throw new TokenRefusal('invalid_grant', 'Sign in again.');
  }
  const next = randomSecret();
  const rotated = await runAsPlatform(() =>
    MaExtensionSessionModel.updateOne(
      { _id: session._id, refreshHash: hash },
      {
        $set: {
          previousRefreshHash: hash,
          refreshHash: hashOf(next),
          lastSeenAt: new Date(),
          expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
          ...(extensionVersion ? { extensionVersion: extensionVersion.slice(0, 40) } : {}),
        },
      },
    ),
  );
  if (rotated.modifiedCount !== 1) {
    throw new TokenRefusal('invalid_grant', 'Sign in again.');
  }
  return runForOrganization(organizationId, () =>
    issue(session._id.toHexString(), session.userId, organizationId, next),
  );
}

/** Signs one extension out. Unknown tokens are ignored: revoking is never an oracle. */
export async function revokeByRefreshToken(refreshToken: string): Promise<void> {
  await runAsPlatform(() =>
    MaExtensionSessionModel.updateOne(
      { refreshHash: hashOf(refreshToken), revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: 'Signed out' } },
    ),
  );
}

/** Whether an extension session still stands, for buildContext on every request. */
export async function extensionSessionIsLive(sessionId: string, userId: string): Promise<boolean> {
  const session = await runAsPlatform(() =>
    MaExtensionSessionModel.findById(sessionId).select('userId revokedAt expiresAt').lean(),
  );
  return Boolean(
    session?.userId === userId && !session.revokedAt && session.expiresAt > new Date(),
  );
}

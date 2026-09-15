import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env';
import type { Role } from '../constants/roles';

export interface TokenPayload {
  id: string;
  roles: Role[];
  email: string;
  /**
   * The company this session belongs to; null for a platform administrator, who stands
   * above the companies. Every query the session makes is confined to it (see lib/tenant).
   */
  organizationId?: string | null;
  /** Set only on desktop tracker tokens — identifies the registered device. */
  deviceId?: string;
  /**
   * The user's `tokenVersion` when the token was issued. Raising the version on the user
   * (a password change or reset) retires every token issued before it. Absent on tokens
   * issued before revocation existed, which read as version 0.
   */
  tv?: number;
}

const ALGORITHM = 'HS256';
const ISSUER = 'exyconn-portal';
/** Who a token is for: a portal session, or a tracker device. Neither is accepted as the other. */
const PORTAL_AUDIENCE = 'portal';
const DEVICE_AUDIENCE = 'tracker-device';

/** Signs a JWT for an authenticated user. */
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    algorithm: ALGORITHM,
    expiresIn: env.jwtExpiresIn,
    issuer: ISSUER,
    audience: PORTAL_AUDIENCE,
    jwtid: randomUUID(),
  } as jwt.SignOptions);
}

/**
 * Signs a non-expiring token for a registered tracker device, so an employee never has
 * to sign in again on the desktop app.
 *
 * Safe only because it is paired with a device record: every request re-checks that the
 * device still exists, has not been revoked, and still holds THIS token (see buildContext),
 * so a lost laptop can be cut off from the portal without rotating JWT_SECRET (which would
 * sign out every portal user). Never issue one of these without a matching TrackerDevice row.
 */
export function signDeviceToken(payload: TokenPayload & { deviceId: string }): string {
  return jwt.sign(payload, env.jwtSecret, {
    algorithm: ALGORITHM,
    issuer: ISSUER,
    audience: DEVICE_AUDIENCE,
    jwtid: randomUUID(),
  });
}

/**
 * How a token is verified. The algorithm is always pinned, so a token can never pick its own
 * (`none`, or an asymmetric one keyed with the secret).
 *
 * TRANSITION: issuer and audience are only enforced when the token carries them. Tokens
 * issued before they were added have neither, and are still accepted so nobody is signed out
 * by the deploy. Portal session tokens last 7 days, so this branch can be removed 7 days after
 * rollout — EXCEPT for device tokens, which never expire: a legacy device token (recognised by
 * its deviceId) is still safe to accept, because buildContext binds it to the device row's
 * token hash. Remove the branch for those only once every device has signed in again.
 */
function verifyOptionsFor(token: string): jwt.VerifyOptions {
  const pinned: jwt.VerifyOptions = { algorithms: [ALGORITHM] };
  const claims = jwt.decode(token, { json: true });
  if (!claims?.iss && !claims?.aud) {
    return pinned;
  }
  const audience = typeof claims.deviceId === 'string' ? DEVICE_AUDIENCE : PORTAL_AUDIENCE;
  return { ...pinned, issuer: ISSUER, audience };
}

/** Verifies and decodes a JWT, returning null when invalid. */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, env.jwtSecret, verifyOptionsFor(token)) as TokenPayload;
  } catch {
    return null;
  }
}

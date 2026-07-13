import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { Role } from '../constants/roles';

export interface TokenPayload {
  id: string;
  roles: Role[];
  email: string;
  /** Set only on desktop tracker tokens — identifies the registered device. */
  deviceId?: string;
}

/** Signs a JWT for an authenticated user. */
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
}

/**
 * Signs a non-expiring token for a registered tracker device, so an employee never has
 * to sign in again on the desktop app.
 *
 * Safe only because it is paired with a device record: every tracker resolver re-checks
 * that the device still exists and has not been revoked, so a lost laptop can be cut off
 * from the portal without rotating JWT_SECRET (which would sign out every portal user).
 * Never issue one of these without a matching TrackerDevice row.
 */
export function signDeviceToken(payload: TokenPayload & { deviceId: string }): string {
  return jwt.sign(payload, env.jwtSecret);
}

/** Verifies and decodes a JWT, returning null when invalid. */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, env.jwtSecret) as TokenPayload;
  } catch {
    return null;
  }
}

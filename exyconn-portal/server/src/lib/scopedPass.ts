import jwt from 'jsonwebtoken';
import { derivedKey } from '../utils/derivedKey';

/**
 * A pass for somebody who is not a portal user — a WhatsApp demo visitor, a client hub
 * contact — each signed with its own derived key and audience, so no pass can be presented
 * as a portal session, as another kind of pass, or the other way round.
 *
 * A pass names its holder and the holder's token version; the holder's record is read on
 * every request, so blocking the holder or raising the version retires it at once.
 */
export type PassPurpose = 'whatsapp-demo-visitor' | 'client-hub';

const ALGORITHM = 'HS256';
const ISSUER = 'exyconn-portal';
const key = (purpose: PassPurpose) => derivedKey(purpose);

export interface PassClaims {
  /** The holder's record id. */
  sub: string;
  tv: number;
}

/** Signs a pass; `expiresIn` (e.g. '30d') is left out for a pass that lasts until revoked. */
export function signPass(purpose: PassPurpose, claims: PassClaims, expiresIn?: string): string {
  return jwt.sign({ tv: claims.tv }, key(purpose), {
    algorithm: ALGORITHM,
    audience: purpose,
    issuer: ISSUER,
    subject: claims.sub,
    ...(expiresIn ? { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] } : {}),
  });
}

/** The pass's claims, or null when it is not a live pass of this kind signed by this server. */
export function readPass(purpose: PassPurpose, token: string): PassClaims | null {
  try {
    const claims = jwt.verify(token, key(purpose), {
      algorithms: [ALGORITHM],
      audience: purpose,
      issuer: ISSUER,
    }) as jwt.JwtPayload;
    return typeof claims.sub === 'string' && typeof claims.tv === 'number'
      ? { sub: claims.sub, tv: claims.tv }
      : null;
  } catch {
    return null;
  }
}

import jwt from 'jsonwebtoken';
import { derivedKey } from '../../../utils/derivedKey';

/**
 * The demo visitor's pass, sent by the demo app as the `x-demo-visitor` header.
 *
 * Signed with its own derived key and audience, so it can never be presented as a portal
 * session (and a portal token can never be presented as a pass). It carries no expiry by
 * design — sign-in is email and code only, with no password to fall back on — and stands for
 * as long as the visitor record does: blocking a visitor or raising their token version
 * retires it at once (see visitor.service.ts).
 */
export const VISITOR_HEADER = 'x-demo-visitor';

const ALGORITHM = 'HS256';
const AUDIENCE = 'whatsapp-demo-visitor';
const ISSUER = 'exyconn-portal';
const key = () => derivedKey('whatsapp-demo-visitor');

interface VisitorClaims {
  vid: string;
  tv: number;
}

export function signVisitorPass(visitorId: string, tokenVersion: number): string {
  const claims: VisitorClaims = { vid: visitorId, tv: tokenVersion };
  return jwt.sign(claims, key(), { algorithm: ALGORITHM, audience: AUDIENCE, issuer: ISSUER });
}

/** The pass's claims, or null when it is not a pass this server signed. */
export function readVisitorPass(token: string): VisitorClaims | null {
  try {
    const claims = jwt.verify(token, key(), {
      algorithms: [ALGORITHM],
      audience: AUDIENCE,
      issuer: ISSUER,
    }) as Partial<VisitorClaims>;
    return typeof claims.vid === 'string' && typeof claims.tv === 'number'
      ? { vid: claims.vid, tv: claims.tv }
      : null;
  } catch {
    return null;
  }
}

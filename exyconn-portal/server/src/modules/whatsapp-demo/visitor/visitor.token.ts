import { readPass, signPass } from '../../../lib/scopedPass';

/**
 * The demo visitor's pass, sent by the demo app as the `x-demo-visitor` header (see
 * lib/scopedPass). It carries no expiry by design — sign-in is email and code only, with no
 * password to fall back on — and stands for as long as the visitor record does: blocking a
 * visitor or raising their token version retires it at once (see visitor.service.ts).
 */
export const VISITOR_HEADER = 'x-demo-visitor';

export const signVisitorPass = (visitorId: string, tokenVersion: number): string =>
  signPass('whatsapp-demo-visitor', { sub: visitorId, tv: tokenVersion });

/** The pass's claims, or null when it is not a visitor pass this server signed. */
export function readVisitorPass(token: string): { vid: string; tv: number } | null {
  const claims = readPass('whatsapp-demo-visitor', token);
  return claims ? { vid: claims.sub, tv: claims.tv } : null;
}

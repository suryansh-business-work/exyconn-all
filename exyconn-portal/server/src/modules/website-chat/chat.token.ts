import { readPass, signPass } from '../../lib/scopedPass';

/**
 * A website chat visitor's pass, kept by the widget and presented when its socket opens. It
 * names one chat session; closing the session does not retire it (the visitor can still read
 * the conversation and start a new one), raising the session's token version does.
 */
const PASS_LIFETIME = '30d';

export const signChatPass = (sessionId: string, tokenVersion: number): string =>
  signPass('website-chat', { sub: sessionId, tv: tokenVersion }, PASS_LIFETIME);

/** The pass's claims, or null when it is not a live chat pass this server signed. */
export function readChatPass(token: string): { sessionId: string; tv: number } | null {
  const claims = readPass('website-chat', token);
  return claims ? { sessionId: claims.sub, tv: claims.tv } : null;
}

import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../../config/env';
import { derivedKey } from '../../utils/derivedKey';

/** A signed download link is good for this long after it is issued. */
export const DOWNLOAD_LINK_TTL_MS = 5 * 60_000;
export const MA_DOWNLOAD_PATH = '/meet-assistant/download';

export type DownloadKind = 'release' | 'recording';

/** What a link grants: one file, to one person, in one company, until it expires. */
export interface DownloadGrant {
  kind: DownloadKind;
  id: string;
  stream?: string;
  userId: string;
  organizationId: string | null;
  exp: number;
}

const key = () => derivedKey('meet-assistant-downloads');
const sign = (payload: string) => createHmac('sha256', key()).update(payload).digest('base64url');

/**
 * A short-lived link that downloads one file without a session (a browser download carries no
 * Bearer token). The grant is signed, so nothing in it can be changed; it names the person, and
 * the download is refused once it expires.
 */
export function signedDownloadUrl(grant: Omit<DownloadGrant, 'exp'>, now = Date.now()) {
  const exp = now + DOWNLOAD_LINK_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ ...grant, exp })).toString('base64url');
  const token = `${payload}.${sign(payload)}`;
  return {
    url: `${env.apiPublicUrl}${MA_DOWNLOAD_PATH}?token=${encodeURIComponent(token)}`,
    expiresAt: new Date(exp),
  };
}

/** The grant a token carries, or null when it is forged, malformed or expired. */
export function readDownloadToken(token: string, now = Date.now()): DownloadGrant | null {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) {
    return null;
  }
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return null;
  }
  try {
    const grant = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as DownloadGrant;
    return grant.exp > now ? grant : null;
  } catch {
    return null;
  }
}

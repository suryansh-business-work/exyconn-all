import { createHash, randomBytes } from 'node:crypto';

/**
 * Rewriting a campaign's HTML so opens and clicks can be counted, and reading the results
 * back. Pure string work — no database, no Express — so every rewriting edge is a table test.
 */

/** Where the pixel and the redirect live. Public, unauthenticated, and deliberately short. */
export const TRACKING_PATH = '/m';

/** A 1×1 transparent GIF. The smallest thing that is still a valid image. */
export const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

/** A fresh opaque token, and the hash that is all we ever store of it. */
export function newTrackingToken(): { token: string; tokenHash: string } {
  const token = randomBytes(24).toString('base64url');
  return { token, tokenHash: hashTrackingToken(token) };
}

export function hashTrackingToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Only http(s) is followed. A rewritten `javascript:` link would be a redirect to a script. */
function isFollowable(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/** `href="..."` in the campaign body. Single or double quoted, as real-world HTML is. */
const HREF = /href\s*=\s*("([^"]*)"|'([^']*)')/gi;

/**
 * Points every followable link at the click redirect, carrying where it was going.
 *
 * Links that are not http(s) are left exactly as they are: `mailto:`, anchors and — the one
 * that matters — anything the rewriting would turn into a redirect to a script. The
 * unsubscribe link is left alone too, since bouncing a legal obligation through a tracker
 * that could be down is not a trade worth making.
 */
export function rewriteLinks(
  html: string,
  origin: string,
  token: string,
  skip: string[] = [],
): string {
  return html.replaceAll(HREF, (match, _quoted: string, doubled?: string, singled?: string) => {
    const url = doubled ?? singled ?? '';
    if (!isFollowable(url) || skip.some((exempt) => exempt && url.includes(exempt))) {
      return match;
    }
    const target = `${origin}${TRACKING_PATH}/c/${token}?u=${encodeURIComponent(url)}`;
    return `href="${target}"`;
  });
}

/**
 * Appends the open pixel.
 *
 * Last thing in the body, so a mail client that stops rendering early has still shown the
 * content. It is an image and nothing else: no script, no iframe, nothing that would get the
 * whole email filed as spam.
 */
export function appendPixel(html: string, origin: string, token: string): string {
  const src = `${origin}${TRACKING_PATH}/o/${token}.gif`;
  return `${html}<img src="${src}" width="1" height="1" alt="" style="display:none" />`;
}

/** Everything one recipient's copy needs before it goes out. */
export function instrument(
  html: string,
  origin: string,
  token: string,
  skip: string[] = [],
): string {
  return appendPixel(rewriteLinks(html, origin, token, skip), origin, token);
}

/**
 * The URL a click redirect was asked to follow, or null if it is not one we will follow.
 *
 * An open redirect is the risk here: this endpoint is public, and without the scheme check
 * anybody could hand out a link on our domain that lands wherever they like.
 */
export function safeRedirectTarget(raw: string | undefined): string | null {
  if (!raw) {
    return null;
  }
  return isFollowable(raw) ? raw : null;
}

/** Where a signed-in user lands when there is no (or no safe) attempted URL. */
export const DEFAULT_REDIRECT = '/portal';

/**
 * Open-redirect guard for the `?next=` login param.
 *
 * Only a same-origin absolute path is accepted. `//evil.com` and `/\evil.com`
 * are protocol-relative URLs that navigate off-site, so they fall back to the
 * portal home, as does anything that is not rooted at `/`.
 */
export function safeNext(next: string | null): string {
  if (!next?.startsWith('/')) return DEFAULT_REDIRECT;
  if (next.startsWith('//') || next.startsWith('/\\')) return DEFAULT_REDIRECT;
  return next;
}

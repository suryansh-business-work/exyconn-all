/** What the URL says the active tab is, and whether the URL needs correcting. */
export interface ResolvedSlug {
  /** The tab to show — the one named in the URL, or the first tab as the default. */
  slug: string;
  /** True when the URL does not already name this tab, so it should be rewritten. */
  needsRedirect: boolean;
}

/**
 * Reads the tab slug out of a pathname.
 *
 * Only the segment directly after `basePath` is considered, so a deeper route
 * under a tab (a detail page, say) still resolves to its parent tab. An unknown
 * or missing slug falls back to the first tab and asks to be redirected, which
 * keeps the URL and the visible tab in agreement.
 */
export function resolveSlug(
  pathname: string,
  basePath: string,
  slugs: readonly string[],
): ResolvedSlug {
  const fallback = slugs[0] ?? '';
  if (!pathname.startsWith(`${basePath}/`)) {
    return { slug: fallback, needsRedirect: Boolean(fallback) };
  }
  const segment = pathname.slice(basePath.length + 1).split('/')[0];
  if (!slugs.includes(segment)) {
    return { slug: fallback, needsRedirect: Boolean(fallback) };
  }
  return { slug: segment, needsRedirect: false };
}

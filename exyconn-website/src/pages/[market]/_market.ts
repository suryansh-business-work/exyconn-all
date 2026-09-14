import { marketByPath, type Market } from "../../lib/i18n/markets";

/**
 * The market a page is being rendered for, or null when the first path segment is not one.
 *
 * Every page under `[market]/` starts with this: `/xyz/about-us` matches the route as far as
 * Astro is concerned, and it is this check that turns it into a 404 instead of an English
 * page served at a URL that means nothing.
 */
export function marketFrom(params: { market?: string }): Market | null {
  return marketByPath(params.market);
}

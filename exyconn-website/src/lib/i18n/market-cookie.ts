/**
 * Where the market a reader picked in the footer's picker is remembered.
 *
 * Only a choice is stored here — never the market a page happened to be read in — so a
 * reader who arrived on /en-us from a search result is still sent to the market their
 * browser asks for next time, until they pick one themselves. The name changed from
 * `exy_market` when that rule came in, so values written for every page view are ignored.
 *
 * It lives apart from `market-links.ts` because the picker's browser script writes it, and
 * that must not pull the whole market registry into the client bundle.
 */
export const MARKET_COOKIE = "exy_market_choice";

/** A year: the choice is a preference, not a session. */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** The cookie that remembers the market at URL segment `path` for every page on the site. */
export function choiceCookie(path: string): string {
  return `${MARKET_COOKIE}=${encodeURIComponent(path)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

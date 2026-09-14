import { marketByPath, marketUrl, type Market } from "./markets";

/**
 * Where the reader's last-chosen market is remembered.
 *
 * A link that carries no market — typed by hand, opened from an email, built by a script like
 * the search box — would otherwise be sent to whatever the browser's language suggests, and a
 * reader who had just picked "Canada - Français" would be thrown back to the default.
 */
export const MARKET_COOKIE = "exy_market";

/** A year: the choice is a preference, not a session. */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const APEX_ORIGIN = "https://exyconn.com";

/** Paths that are not pages and must never gain a market: assets, the API, crawler files. */
const NOT_A_PAGE = /^\/(?:_|assets\/|api\/|health|robots\.txt|sitemap\.xml|llms\.txt|favicon)/;
const HAS_EXTENSION = /\.[a-zA-Z0-9]+$/;

/** The opening tag of a link or a form — the only two places a reader navigates from. */
const NAVIGATING_TAG = /<(a|form)\b[^>]*>/gi;

/** `href="…"`, `href='…'` or `action=…` inside one of those tags. */
const TARGET_ATTRIBUTE = /(\s(?:href|action)\s*=\s*)(["'])([^"']*)\2/gi;

/** The `Set-Cookie` value that remembers `market` for every page on the site. */
export function marketCookie(market: Market): string {
  return `${MARKET_COOKIE}=${market.path}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

/** The market a request's cookies remember, or null when there is none (or it is not one). */
export function rememberedMarket(cookieHeader: string | null): Market | null {
  if (!cookieHeader) {
    return null;
  }
  for (const part of cookieHeader.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === MARKET_COOKIE) {
      return marketByPath(decodeURIComponent(value.join("=")));
    }
  }
  return null;
}

/**
 * The same link, inside `market` — or `null` when it should be left exactly as written.
 *
 * Left alone: other sites, anchors, `mailto:`/`tel:`, assets and the API, and anything that
 * already names a market (the market picker's own links point at OTHER markets on purpose).
 */
export function localiseHref(href: string, market: Market): string | null {
  let path = href;
  if (href.startsWith(APEX_ORIGIN)) {
    path = href.slice(APEX_ORIGIN.length) || "/";
  }
  if (!path.startsWith("/") || path.startsWith("//")) {
    return null;
  }

  const [beforeHash, hash = ""] = path.split("#", 2);
  const [pathname, query = ""] = beforeHash.split("?", 2);
  if (NOT_A_PAGE.test(pathname) || (HAS_EXTENSION.test(pathname) && !pathname.endsWith(".html"))) {
    return null;
  }
  const [, firstSegment = ""] = pathname.split("/");
  if (marketByPath(firstSegment)) {
    return null;
  }

  const suffix = (query ? `?${query}` : "") + (hash ? `#${hash}` : "");
  return `${marketUrl(market, pathname)}${suffix}`;
}

/**
 * Keeps every internal link on a page inside the market it is being read in.
 *
 * The site's links are written once, without a market (`/contact`), because the same page
 * serves all 86 of them. Rewriting them here — after translation, and after the per-LANGUAGE
 * page cache, since `fr-fr` and `fr-ca` share one cached page but not their links — means a
 * reader who chose a market stays in it however they move around.
 */
export function localiseLinks(html: string, market: Market): string {
  return html.replace(NAVIGATING_TAG, (tag) =>
    tag.replace(TARGET_ATTRIBUTE, (whole, prefix: string, quote: string, value: string) => {
      const localised = localiseHref(value, market);
      return localised === null ? whole : `${prefix}${quote}${localised}${quote}`;
    })
  );
}

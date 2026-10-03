import { MARKET_COOKIE, choiceCookie } from "./market-cookie";
import {
  DEFAULT_MARKET,
  chooseMarket,
  marketByPath,
  marketUrl,
  splitMarketPath,
  type Market,
} from "./markets";

export { MARKET_COOKIE } from "./market-cookie";

const APEX_ORIGIN = "https://exyconn.com";

/** Paths that are not pages and must never gain a market: assets, the API, crawler files. */
const NOT_A_PAGE = /^\/(?:_|assets\/|api\/|health|robots\.txt|sitemap\.xml|llms\.txt|favicon)/;
const HAS_EXTENSION = /\.[a-zA-Z0-9]+$/;

/** The opening tag of a link or a form — the only two places a reader navigates from. */
const NAVIGATING_TAG = /<(a|form)\b[^>]*>/gi;

/** `href="…"`, `href='…'` or `action=…` inside one of those tags. */
const TARGET_ATTRIBUTE = /(\s(?:href|action)\s*=\s*)(["'])([^"']*)\2/gi;

/** The cookie value that remembers `market` as the reader's choice. */
export function marketCookie(market: Market): string {
  return choiceCookie(market.path);
}

/** The market a reader chose, from a request's cookies, or null when they never chose one. */
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

/**
 * Crawlers, link unfurlers and AI agents. They are never sent anywhere by language: each one
 * gets the `x-default` market, so what a search engine indexes does not depend on where its
 * crawler happens to run, and every other market is found through the page's hreflang links.
 */
const CRAWLER = /bot\b|crawl|spider|slurp|externalhit|externalagent|-ai\b|-user\b/i;

/**
 * The market of the page a reader just came from on this site, or null.
 *
 * A link a script builds — the search box's results — carries no market, and a reader who was
 * reading /fr-ca should stay there rather than be sent to whatever their browser asks for.
 */
function referringMarket(referer: string | null, host: string): Market | null {
  if (!referer || !URL.canParse(referer)) {
    return null;
  }
  const from = new URL(referer);
  return from.host === host ? splitMarketPath(from.pathname).market : null;
}

/**
 * Which market a URL that names none is sent to, in this order:
 *  1. a crawler always gets the default (`x-default`) market;
 *  2. the market the reader chose in the picker (the cookie);
 *  3. the market of the page on this site they followed the link from;
 *  4. the best match for their browser's languages (`Accept-Language`), with the country the
 *     edge reports only choosing between one language's markets;
 *  5. the default market.
 */
export function marketForRequest(request: Request): Market {
  const { headers } = request;
  if (CRAWLER.test(headers.get("user-agent") ?? "")) {
    return DEFAULT_MARKET;
  }
  return (
    rememberedMarket(headers.get("cookie")) ??
    referringMarket(headers.get("referer"), new URL(request.url).host) ??
    chooseMarket(
      headers.get("accept-language"),
      headers.get("cf-ipcountry") ?? headers.get("x-country")
    )
  );
}

/**
 * A temporary (302) redirect from a URL without a market to the same page in the reader's
 * market. It depends on who is asking, so no shared cache may keep it for anyone else.
 */
export function marketRedirect(request: Request, pathname: string, search: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${marketUrl(marketForRequest(request), pathname)}${search}`,
      "Cache-Control": "private, no-store",
      Vary: "Accept-Language, Cookie, Referer, User-Agent",
    },
  });
}

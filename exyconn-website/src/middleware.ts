import { defineMiddleware } from "astro:middleware";
import { chooseMarket, marketUrl, splitMarketPath, type Market } from "./lib/i18n/markets";
import { collectStrings, translateHtml } from "./lib/i18n/html-translate";
import { cachePage, cachedPage } from "./lib/i18n/page-cache";
import { loadMessages, translateMissing, type Messages } from "./lib/i18n/translations";
import { localiseLinks, marketCookie, rememberedMarket } from "./lib/i18n/market-links";

const APEX_HOST = "exyconn.com";

/** Paths that are not pages: assets, the API, and the files a crawler asks for by name. */
const NOT_A_PAGE = /^\/(?:_|assets\/|api\/|health|robots\.txt|sitemap\.xml|llms\.txt|favicon)/;

/** True for anything with a file extension — an image, a stylesheet, a font. */
const HAS_EXTENSION = /\.[a-zA-Z0-9]+$/;

const isPage = (pathname: string) =>
  !NOT_A_PAGE.test(pathname) && (!HAS_EXTENSION.test(pathname) || pathname.endsWith(".html"));

/**
 * Serves one page in one market's language.
 *
 * English is the source, so an English market is served exactly as it was rendered. Anything
 * else is translated through the portal's catalogue, cached, and whatever had no translation
 * yet is sent to the portal to be machine-translated for the next reader — which is what
 * makes a market that nobody has translated by hand still readable.
 */
async function localise(market: Market, path: string, response: Response): Promise<Response> {
  if (!(response.headers.get("content-type") ?? "").includes("text/html")) {
    return response;
  }
  const html = await pageText(market, path, response);
  const headers = new Headers(response.headers);
  // The body is rewritten, so the length the renderer sent no longer describes it.
  headers.delete("content-length");
  // Remember the choice, so a link without a market — typed, from an email, built by the
  // search box — comes back here rather than to whatever the browser's language suggests.
  headers.append("Set-Cookie", marketCookie(market));
  return new Response(localiseLinks(html, market), { status: response.status, headers });
}

/**
 * The page's HTML in the market's language. English is the source, so it is served as it
 * was rendered; links are localised afterwards either way, per request, because the cache is
 * per LANGUAGE and two markets that share one (fr-fr, fr-ca) must not share their links.
 */
async function pageText(market: Market, path: string, response: Response): Promise<string> {
  if (market.language === "en") {
    return response.text();
  }
  const messages = await loadMessages(market.language);
  const cached = cachedPage(market.path, path, messages);
  return cached ?? (await translatePage(market, path, await response.text(), messages));
}

/**
 * How long the first reader of a page in a new language waits for the model.
 *
 * Long enough for a few batches to come back, so they read the page in their language rather
 * than in English; short enough that nobody waits on a slow model. Whatever is still being
 * translated when it runs out is finished in the background for the next reader.
 */
const FIRST_READER_BUDGET_MS = 6000;

async function translatePage(
  market: Market,
  path: string,
  html: string,
  catalogue: Messages
): Promise<string> {
  let messages = catalogue;
  const missing = collectStrings(html).filter((source) => messages[source] === undefined);
  if (missing.length > 0) {
    // Translate now, for this reader, instead of serving English and translating for the next.
    messages = await translateMissing(market.language, missing, FIRST_READER_BUDGET_MS);
  }
  const translated = translateHtml(html, (source) => messages[source]);
  // Cached against the catalogue it was translated with: when later batches land, that is a
  // different object, and the next reader gets a fresh render with the new words.
  cachePage(market.path, path, translated, messages);
  return translated;
}

/**
 * Site-wide middleware:
 *  - 301 redirect www.exyconn.com -> exyconn.com (kills 72 duplicate title/content/meta-description issues)
 *  - 301 redirect any path with a trailing slash (except "/") -> non-trailing-slash (matches astro.config trailingSlash:'never')
 *  - Strict-Transport-Security (HSTS) + baseline security headers on every response
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const url = context.url;
  const host = context.request.headers.get("host") || "";

  // 1. Force apex (no www) on production hostnames only
  const lowerHost = host.toLowerCase();
  if (lowerHost === `www.${APEX_HOST}`) {
    const target = `https://${APEX_HOST}${url.pathname}${url.search}`;
    return new Response(null, {
      status: 301,
      headers: { Location: target, "Cache-Control": "public, max-age=3600" },
    });
  }

  // 2. Force non-trailing-slash canonical (skip "/" and asset paths with file extensions)
  if (
    url.pathname.length > 1 &&
    url.pathname.endsWith("/") &&
    !/\.[a-zA-Z0-9]+\/$/.test(url.pathname)
  ) {
    const target = url.pathname.replace(/\/+$/, "") + url.search;
    return new Response(null, {
      status: 301,
      headers: { Location: target, "Cache-Control": "public, max-age=3600" },
    });
  }

  // 3. Every page lives under a market — exyconn.com/en-in/about-us — which Astro routes
  // through src/pages/[market]. A URL with no market is caught by the catch-all route, which
  // sends the reader to the market their browser and their country suggest.
  const { market, rest } = splitMarketPath(url.pathname);
  if (isPage(url.pathname)) {
    if (!market) {
      // An old link, or somebody typing exyconn.com/about-us: send them to the market they
      // chose last, else the one their browser and their country suggest, keeping the page.
      const chosen =
        rememberedMarket(context.request.headers.get("cookie")) ??
        chooseMarket(
          context.request.headers.get("accept-language"),
          context.request.headers.get("cf-ipcountry") ?? context.request.headers.get("x-country")
        );
      return context.redirect(`${marketUrl(chosen, url.pathname)}${url.search}`, 302);
    }
    context.locals.market = market;
    const page = await next();
    return withSecurityHeaders(await localise(market, rest, page));
  }

  const response = await next();

  // 4. Apply security headers to all HTML responses (don't mutate redirects/streams unnecessarily)
  const contentType = response.headers.get("content-type") || "";
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  response.headers.set("X-Frame-Options", "SAMEORIGIN");

  if (contentType.includes("text/html")) {
    response.headers.set("X-DNS-Prefetch-Control", "on");
  }

  return response;
});

/** The same headers every response carries, applied to one that bypassed `next()`. */
function withSecurityHeaders(response: Response): Response {
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-DNS-Prefetch-Control", "on");
  return response;
}

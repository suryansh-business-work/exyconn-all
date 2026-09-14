import { defineMiddleware } from "astro:middleware";
import { chooseMarket, marketUrl, splitMarketPath, type Market } from "./lib/i18n/markets";
import { collectStrings, translateHtml } from "./lib/i18n/html-translate";
import { cachePage, cachedPage } from "./lib/i18n/page-cache";
import { loadMessages, requestTranslations } from "./lib/i18n/translations";

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
  if (market.language === "en") {
    return response;
  }
  const messages = await loadMessages(market.language);
  const cached = cachedPage(market.language, path, messages);
  const html = cached ?? translatePage(market, path, await response.text(), messages);
  return new Response(html, {
    status: response.status,
    headers: response.headers,
  });
}

function translatePage(
  market: Market,
  path: string,
  html: string,
  messages: Readonly<Record<string, string>>
): string {
  const translated = translateHtml(html, (source) => messages[source]);
  cachePage(market.language, path, translated, messages);
  // Everything the catalogue could not answer, so the next reader gets it in their language.
  const missing = collectStrings(html).filter((source) => messages[source] === undefined);
  requestTranslations(market.language, missing);
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
      // An old link, or somebody typing exyconn.com/about-us: send them to the market their
      // browser and their country suggest, keeping the page they asked for.
      const chosen = chooseMarket(
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
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
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
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
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

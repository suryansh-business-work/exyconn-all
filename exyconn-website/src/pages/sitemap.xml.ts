import type { APIRoute } from "astro";

import { DEFAULT_MARKET, MARKETS, marketByPath, marketUrl, type Market } from "../lib/i18n/markets";
import { publishedPaths, withPaths } from "../lib/cms";
import { aiServicePaths } from "../lib/cms/ai-services";
import { sitePages } from "../lib/content/site-pages";

const SITE_URL = "https://exyconn.com";

/**
 * One market's entry for a page, listing every other market as an alternate.
 *
 * That is what tells a search engine these are the same page in different languages rather
 * than eighty-six near-duplicates — without it, it picks one and drops the rest.
 */
/** The `<lastmod>` line of a page that knows when it last changed; none for one that does not. */
const lastmodLine = (lastmod: string | undefined): string =>
  lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : "";

function urlEntry(market: Market, page: string, lastmod: string | undefined): string {
  const path = page === "" ? "/" : page;
  const alternates = [
    ...MARKETS.map(
      (market) =>
        `    <xhtml:link rel="alternate" hreflang="${market.locale}" href="${SITE_URL}${marketUrl(market, path)}" />`
    ),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${marketUrl(DEFAULT_MARKET, path)}" />`,
  ].join("\n");

  const depthPriority = page.split("/").length <= 2 ? "0.8" : "0.6";
  const priority = page === "" ? "1.0" : depthPriority;
  return `  <url>
    <loc>${SITE_URL}${marketUrl(market, path)}</loc>${lastmodLine(lastmod)}
    <changefreq>${page === "" ? "daily" : "weekly"}</changefreq>
    <priority>${priority}</priority>
${alternates}
  </url>`;
}

/** A page of a CMS site served without markets: one URL, on the site's own domain. */
function plainEntry(origin: string, page: string, lastmod: string | undefined): string {
  return `  <url>
    <loc>${origin}${page === "" ? "/" : page}</loc>${lastmodLine(lastmod)}
  </url>`;
}

/**
 * The market site's index: one sitemap per market. Every page in every market with all its
 * alternates in one file came to ~80 MB, past the 50 MB a search engine reads of a sitemap.
 */
function marketIndex(lastmod: string): string {
  const sitemaps = MARKETS.map(
    (market) => `  <sitemap>
    <loc>${SITE_URL}/sitemap.xml?market=${market.path}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>`;
}

function urlSet(entries: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>`;
}

function xmlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

/**
 * `/sitemap.xml` is the market index, `/sitemap.xml?market=en-us` one market's pages. A CMS
 * site without markets has a single sitemap of its own pages.
 */
export const GET: APIRoute = async ({ request }) => {
  // The pages published in the CMS, beside the hand-written ones (each listed once).
  const { site, paths, lastmod } = await publishedPaths(request.headers.get("host") ?? "");
  if (site !== null && !site.markets && site.domains.length > 0) {
    return xmlResponse(
      urlSet(paths.map((page) => plainEntry(`https://${site.domains[0]}`, page, lastmod[page])))
    );
  }

  const marketParam = new URL(request.url).searchParams.get("market");
  if (marketParam === null) {
    return xmlResponse(marketIndex(new Date().toISOString().split("T")[0]));
  }
  const market = marketByPath(marketParam);
  if (market === null) {
    return xmlResponse(urlSet([]), 404);
  }
  const pages = withPaths(sitePages(await aiServicePaths(site?.id)), paths);
  return xmlResponse(urlSet(pages.map((page) => urlEntry(market, page, lastmod[page]))));
};

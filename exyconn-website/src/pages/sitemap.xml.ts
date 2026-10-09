import type { APIRoute } from "astro";

import { DEFAULT_MARKET, MARKETS, marketUrl } from "../lib/i18n/markets";
import { publishedPaths, withPaths } from "../lib/cms";
import { aiServicePaths } from "../lib/cms/ai-services";
import { sitePages } from "../lib/content/site-pages";

const SITE_URL = "https://exyconn.com";

/**
 * One entry per page per market, each listing every other market as an alternate.
 *
 * That is what tells a search engine these are the same page in different languages rather
 * than eighty-six near-duplicates — without it, it picks one and drops the rest.
 */
function urlEntry(page: string, lastmod: string): string {
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
  return MARKETS.map(
    (market) => `  <url>
    <loc>${SITE_URL}${marketUrl(market, path)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page === "" ? "daily" : "weekly"}</changefreq>
    <priority>${priority}</priority>
${alternates}
  </url>`
  ).join("\n");
}

/** A page of a CMS site served without markets: one URL, on the site's own domain. */
function plainEntry(origin: string, page: string, lastmod: string): string {
  return `  <url>
    <loc>${origin}${page === "" ? "/" : page}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
}

export const GET: APIRoute = async ({ request }) => {
  const lastmod = new Date().toISOString().split("T")[0];
  // The pages published in the CMS, beside the hand-written ones (each listed once).
  const { site, paths } = await publishedPaths(request.headers.get("host") ?? "");
  const offMarket = site !== null && !site.markets && site.domains.length > 0;
  const entries = offMarket
    ? paths.map((page) => plainEntry(`https://${site.domains[0]}`, page, lastmod))
    : withPaths(sitePages(await aiServicePaths(site?.id)), paths).map((page) =>
        urlEntry(page, lastmod)
      );

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>`;

  return new Response(sitemap, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
};

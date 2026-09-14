import type { APIRoute } from "astro";

import { aiServices } from "../lib/services/aiServices";
import { DEFAULT_MARKET, MARKETS, marketUrl } from "../lib/i18n/markets";

const SITE_URL = "https://exyconn.com";

// All static pages
const staticPages = [
  "",
  "/about-us",
  "/contact",
  "/cookies",
  "/exyconn-services",
  "/get-a-quote",
  "/grievance",
  "/legal",
  "/our-products",
  "/our-services",
  "/our-vision",
  "/privacy-policy",
  // AI Services
  "/ai-services",
  ...aiServices.map((service) => `/ai-services/${service.slug}`),
  // Services
  "/services",
  "/services/application-modernization",
  "/services/automation-integration",
  "/services/data-analytics",
  "/services/digital-consulting",
  "/services/digital-marketing",
  "/services/enterprise-application",
  "/services/maintenance",
  "/services/mobile-application-development",
  "/services/software-as-a-service",
  "/services/software-development-outsourcing",
  // AI
  "/ai",
  "/ai/agentic",
  "/ai/bot-creation",
  "/ai/custom-model-training",
  "/ai/llms",
  "/ai/mcp-server",
  "/ai/models",
  "/ai/workflows",
  // Career
  "/career",
  "/career/gigs",
  // Case Studies
  "/case-studies",
  // Blog
  "/blog",
  // Order Agents
  "/order-agents",
];

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

  return MARKETS.map(
    (market) => `  <url>
    <loc>${SITE_URL}${marketUrl(market, path)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page === "" ? "daily" : "weekly"}</changefreq>
    <priority>${page === "" ? "1.0" : page.split("/").length <= 2 ? "0.8" : "0.6"}</priority>
${alternates}
  </url>`
  ).join("\n");
}

export const GET: APIRoute = async () => {
  const lastmod = new Date().toISOString().split("T")[0];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${staticPages.map((page) => urlEntry(page, lastmod)).join("\n")}
</urlset>`;

  return new Response(sitemap, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
};

import type { APIRoute } from "astro";

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
  "/shell-strategy",
  "/shell-strategy-terms",
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

export const GET: APIRoute = async () => {
  const lastmod = new Date().toISOString().split("T")[0];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(
    (page) => `  <url>
    <loc>${SITE_URL}${page}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page === "" ? "daily" : "weekly"}</changefreq>
    <priority>${page === "" ? "1.0" : page.split("/").length <= 2 ? "0.8" : "0.6"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(sitemap, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
};

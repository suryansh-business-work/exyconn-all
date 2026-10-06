import type { APIRoute } from "astro";
import { publishedPaths } from "../lib/cms";
import { aiServicePaths } from "../lib/cms/ai-services";
import { sitePages } from "../lib/content/site-pages";

const SITE_URL = "https://exyconn.com";

const content = `# Exyconn

> Exyconn is a multi-product technology company that builds AI automation, B2B SaaS platforms, consumer apps, and complete cloud infrastructure so businesses can ship faster. Its AI services practice covers 29 offerings across six areas — agents and automation, revenue and growth, industry platforms, business operations, platform and infrastructure, and trust and security — each delivered as a working system connected to the tools a business already runs on.

## About
Exyconn is a B2B technology services company offering AI agents, an infrastructure platform, and SaaS products. It operates a portfolio of brands across AI/SaaS, FinTech, cybersecurity, and community technology. Headquartered in India, serving clients globally and remotely.

## Products
- [Spentiva](https://spentiva.com): AI-powered business and personal expense manager with smart auto-categorization, multi-tracker support, and 150+ currencies. Status: live (B2B2C SaaS).
- [Sibera](https://sibera.work): B2B CMS, marketing and sales enablement platform — an intelligent CRM with AI lead scoring, predictive analytics, and workflow automation. Status: in development (B2B SaaS).
- [Duncit](https://duncit.com): Mobile web app for making real friend connections through shared interests, real chats, verified profiles, and built-in safety tools; native iOS and Android apps in progress. Status: mobile web live (B2C community app).
- [Exyconn Infrastructure Platform](${SITE_URL}/exyconn-services): Bundled infrastructure services — email, SMS, payments, logs, themes, translations and more (25+ services).

## Core pages
- [Home](${SITE_URL}/): Overview of Exyconn's offerings
- [Our Services](${SITE_URL}/our-services): Full service catalog
- [AI Solutions](${SITE_URL}/ai): AI agents, MCP servers, models, and automation workflows
- [AI Services](${SITE_URL}/ai-services): The full AI services catalogue — agents, automation, industry platforms, operations, infrastructure and AI governance
- [Case Studies](${SITE_URL}/case-studies): Real-world results
- [Blog](${SITE_URL}/blog): Insights on AI and technology
- [About Us](${SITE_URL}/about-us): Team and mission
- [Contact](${SITE_URL}/contact): Get in touch
- [Careers](${SITE_URL}/career): Open roles across the Exyconn group

## Sitemaps
- [XML sitemap](${SITE_URL}/sitemap.xml)
- [HTML sitemap](${SITE_URL}/sitemap)

## Policies
- [Privacy Policy](${SITE_URL}/privacy-policy)
- [Cookies](${SITE_URL}/cookies)
- [Legal](${SITE_URL}/legal)
`;

/** True when this file already links to the page (home as ""). */
const isLinked = (path: string): boolean => content.includes(`](${SITE_URL}${path || "/"})`);

/**
 * The CMS pages this file does not already describe, as one more section. The site's own
 * pages (the sitemap's list) are left out: this file names the main ones on purpose.
 */
function morePages(paths: readonly string[], known: ReadonlySet<string>): string {
  const extra = paths.filter((path) => !isLinked(path) && !known.has(path));
  if (extra.length === 0) {
    return "";
  }
  const lines = extra.map((path) => `- [${path || "/"}](${SITE_URL}${path || "/"})`);
  return `\n## More pages\n${lines.join("\n")}\n`;
}

export const GET: APIRoute = async ({ request }) => {
  const { site, paths } = await publishedPaths(request.headers.get("host") ?? "");
  const known = new Set(sitePages(await aiServicePaths(site?.id)));
  return new Response(content + morePages(paths, known), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
};

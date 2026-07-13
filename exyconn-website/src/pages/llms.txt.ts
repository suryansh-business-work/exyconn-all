import type { APIRoute } from "astro";

const SITE_URL = "https://exyconn.com";

const content = `# Exyconn

> Exyconn is a multi-product technology company that builds AI automation, B2B SaaS platforms, consumer apps, and complete cloud infrastructure so businesses can ship faster. Its "Shell Strategy" delivers a production-ready tech-shell (auth, email/SMS, payments, logs, themes, translations and 25+ services) in roughly one week, at a large cost saving versus building in-house.

## About
Exyconn is a B2B technology services company offering AI agents, an infrastructure platform, and SaaS products. It operates a portfolio of brands across AI/SaaS, FinTech, cybersecurity, and community technology. Headquartered in India, serving clients globally and remotely.

## Products
- [Spentiva](https://spentiva.com): AI-powered business and personal expense manager with smart auto-categorization, multi-tracker support, and 150+ currencies. Status: live (B2B2C SaaS).
- [Sibera](https://sibera.work): B2B CMS, marketing and sales enablement platform — an intelligent CRM with AI lead scoring, predictive analytics, and workflow automation. Status: in development (B2B SaaS).
- [Duncit](https://duncit.com): Mobile web app for making real friend connections through shared interests, real chats, verified profiles, and built-in safety tools; native iOS and Android apps in progress. Status: mobile web live (B2C community app).
- [Exyconn Infrastructure Platform](${SITE_URL}/exyconn-services): Bundled infrastructure services — email, SMS, payments, logs, themes, translations and more (25+ services).

## Core pages
- [Home](${SITE_URL}/): Overview of Exyconn's offerings
- [Our Products](${SITE_URL}/our-products): SaaS and consumer-app portfolio
- [Our Services](${SITE_URL}/our-services): Full service catalog
- [AI Solutions](${SITE_URL}/ai): AI agents, MCP servers, models, and automation workflows
- [Shell Strategy](${SITE_URL}/shell-strategy): Complete tech-shell offering
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

export const GET: APIRoute = async () => {
  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
};

/**
 * The human sitemap: the portal's navigation links grouped by category when it has any,
 * otherwise the site's own routes (the same pages sitemap.xml lists), with the AI service
 * pages from the CMS catalogue. Also the node-graph scene's branch counts. The page's words are
 * the CMS component's props ('company.sitemap').
 */
import type { NavLink } from "../portal/types";
import { safeHref } from "../safe-output";

export interface SitemapLink {
  label: string;
  href: string;
  description?: string;
}

export interface SitemapSection {
  label: string;
  links: SitemapLink[];
}

const MAX_BRANCHES = 12;
const MAX_LEAVES = 24;

const link = (label: string, href: string): SitemapLink => ({ label, href });

/** The section the AI service pages join, after its "All AI services" link. */
const AI_SERVICES_HREF = "/ai-services";

/** Every page this site serves (unprefixed — the middleware adds the reader's market). */
export const SITE_ROUTES: readonly SitemapSection[] = [
  {
    label: "Company",
    links: [
      link("Home", "/"),
      link("About us", "/about-us"),
      link("Our vision", "/our-vision"),
      link("Careers", "/career"),
      link("Gigs", "/career/gigs"),
      link("Contact", "/contact"),
      link("Get a quote", "/get-a-quote"),
    ],
  },
  {
    label: "AI",
    links: [
      link("AI overview", "/ai"),
      link("AI agents", "/ai/agentic"),
      link("Bot creation", "/ai/bot-creation"),
      link("Workflows", "/ai/workflows"),
      link("Large language models", "/ai/llms"),
      link("Models", "/ai/models"),
      link("Custom model training", "/ai/custom-model-training"),
      link("MCP server", "/ai/mcp-server"),
      link("Order agents", "/order-agents"),
    ],
  },
  {
    label: "AI services",
    links: [link("All AI services", AI_SERVICES_HREF)],
  },
  {
    label: "Services",
    links: [
      link("Services", "/services"),
      link("Our services", "/our-services"),
      link("Exyconn services", "/exyconn-services"),
      link("Application modernization", "/services/application-modernization"),
      link("Automation and integration", "/services/automation-integration"),
      link("Data analytics", "/services/data-analytics"),
      link("Digital consulting", "/services/digital-consulting"),
      link("Digital marketing", "/services/digital-marketing"),
      link("Enterprise applications", "/services/enterprise-application"),
      link("Maintenance", "/services/maintenance"),
      link("Mobile app development", "/services/mobile-application-development"),
      link("Software as a service", "/services/software-as-a-service"),
      link("WhatsApp chatbot", "/services/whatsapp-chatbot"),
      link("Software development outsourcing", "/services/software-development-outsourcing"),
    ],
  },
  {
    label: "Resources",
    links: [
      link("Blog", "/blog"),
      link("Case studies", "/case-studies"),
      link("Tools", "/our-tools"),
      link("Sitemap", "/sitemap"),
    ],
  },
  {
    label: "Legal",
    links: [
      link("Legal", "/legal"),
      link("Privacy policy", "/privacy-policy"),
      link("Cookies", "/cookies"),
      link("Policies", "/policies"),
      link("Grievance", "/grievance"),
    ],
  },
];

/**
 * The portal's links grouped by category (unsafe hrefs dropped), else the site's routes with
 * `aiServices` (the CMS catalogue's pages) in the AI services section.
 */
export const sitemapSections = (
  navLinks: readonly NavLink[],
  aiServices: readonly SitemapLink[]
): SitemapSection[] => {
  const sections = new Map<string, SitemapLink[]>();
  navLinks
    .filter((one) => safeHref(one.href) !== "")
    .forEach((one) => {
      const entry = { label: one.label, href: one.href, description: one.description || undefined };
      sections.set(one.category, [...(sections.get(one.category) ?? []), entry]);
    });
  if (sections.size === 0) {
    return SITE_ROUTES.map((section) => ({
      ...section,
      links:
        section.links[0]?.href === AI_SERVICES_HREF
          ? [...section.links, ...aiServices]
          : [...section.links],
    }));
  }
  return [...sections.entries()].map(([label, links]) => ({ label, links }));
};

/** Pages per section for the tree scene (at most 12 sections × 24 pages). */
export const treeBranches = (sections: readonly SitemapSection[]): number[] =>
  sections.slice(0, MAX_BRANCHES).map((section) => Math.min(MAX_LEAVES, section.links.length));

export const pageCount = (sections: readonly SitemapSection[]): number =>
  sections.reduce((sum, section) => sum + section.links.length, 0);

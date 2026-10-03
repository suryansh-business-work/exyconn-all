/**
 * The Organization + WebSite JSON-LD every page carries (Page.astro adds the page's own).
 */
import { organizationLd, webSiteLd } from "@exyconn/seo";

export const ORGANIZATION_PROFILE = {
  description:
    "Exyconn is a multi-product technology company building AI automation, B2B SaaS platforms, consumer apps, and production AI systems for businesses.",
  knowsAbout: [
    "Artificial Intelligence",
    "AI Agents",
    "SaaS Development",
    "Cloud Infrastructure",
    "Workflow Automation",
    "Model Context Protocol (MCP)",
    "Software Development Outsourcing",
  ],
  sameAs: [
    "https://www.linkedin.com/company/exyconn",
    "https://x.com/exyconn",
    "https://spentiva.com",
    "https://sibera.work",
    "https://duncit.com",
  ],
} as const;

export interface SiteIdentity {
  businessName: string;
  /** The organisation's own site (Admin > Branding), else this site. */
  organizationUrl: string;
  /** This site's origin, no trailing slash. */
  siteUrl: string;
  /** Absolute URL of the logo. */
  logo: string;
}

export const baselineJsonLd = ({ businessName, organizationUrl, siteUrl, logo }: SiteIdentity) => [
  organizationLd({
    name: businessName,
    url: organizationUrl,
    logo,
    description: ORGANIZATION_PROFILE.description,
    knowsAbout: [...ORGANIZATION_PROFILE.knowsAbout],
    sameAs: [...ORGANIZATION_PROFILE.sameAs],
    contactPoint: {
      contactType: "customer support",
      url: `${siteUrl}/contact`,
      availableLanguage: ["English"],
    },
  }),
  webSiteLd({
    name: businessName,
    url: organizationUrl,
    searchUrlTemplate: `${siteUrl}/blog?q={search_term_string}`,
  }),
];

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
} as const;

export interface SiteIdentity {
  businessName: string;
  /** The organisation's own site (Admin > Branding), else this site. */
  organizationUrl: string;
  /** This site's origin, no trailing slash. */
  siteUrl: string;
  /** Absolute URL of the logo. */
  logo: string;
  /**
   * The company's own profiles elsewhere — LinkedIn, X, Clutch, Crunchbase, AmbitionBox — the
   * same links the footer shows (`socialLinks`). They are what `sameAs` tells a search engine
   * is this organisation; a product the company owns is not, so none is listed.
   */
  profiles: readonly string[];
}

export const baselineJsonLd = ({
  businessName,
  organizationUrl,
  siteUrl,
  logo,
  profiles,
}: SiteIdentity) => [
  organizationLd({
    name: businessName,
    url: organizationUrl,
    logo,
    description: ORGANIZATION_PROFILE.description,
    knowsAbout: [...ORGANIZATION_PROFILE.knowsAbout],
    sameAs: [...profiles],
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

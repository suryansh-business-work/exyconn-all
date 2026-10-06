import { ROBOTS_INDEX, ROBOTS_NOINDEX, type JsonLdNode, type PageMeta } from "@exyconn/seo";
import { BRANDING_FALLBACK, type Branding } from "../portal";
import { DEFAULT_MARKET, MARKETS, marketUrl, type Market } from "../i18n/markets";
import { socialLinks } from "../social-links";
import { baselineJsonLd } from "./site-schema";

/** What a page tells the layout about itself (Page.astro's props, and a CMS page's SEO). */
export interface PageSeoInput {
  title?: string;
  metaTitle?: string;
  description?: string;
  metaDescription?: string;
  keywords?: string;
  metaKeywords?: string;
  metaImage?: string;
  canonical?: string;
  noindex?: boolean;
  ogType?: PageMeta["type"];
  jsonLd?: JsonLdNode | readonly JsonLdNode[];
}

/** Where the page is served: the site's origin, its path and its market (none off-market). */
export interface PagePlace {
  siteUrl: string;
  /** The path without a market prefix; "" for the home page. */
  pagePath: string;
  /** The market the page is read in; null on a site served without markets. */
  market: Market | null;
  /** The page language when there is no market. */
  locale: string;
}

const DEFAULT_DESCRIPTION =
  "Transform your business with Exyconn's AI solutions and comprehensive technology infrastructure.";
const DEFAULT_KEYWORDS = "AI, automation, SaaS, business solutions, cloud infrastructure";

/** The favicon the page wears: the site's own, else Admin › Branding's, else the bundled one. */
export const faviconOf = (branding: Branding, siteFavicon = ""): string =>
  siteFavicon || branding.faviconUrl || BRANDING_FALLBACK.faviconUrl;

/**
 * The same page in every market, plus `x-default`.
 *
 * Search engines need this to tell eighty-six near-identical pages apart: without it they
 * pick one, drop the rest as duplicates, and a Spanish reader gets the English page. Google
 * follows `x-default` when it knows nothing about the reader, which is where anyone the site
 * cannot place is sent anyway.
 */
function marketAlternates(siteUrl: string, path: string) {
  return [
    ...MARKETS.map((entry) => ({
      hreflang: entry.locale,
      href: `${siteUrl}${marketUrl(entry, path)}`,
    })),
    { hreflang: "x-default", href: `${siteUrl}${marketUrl(DEFAULT_MARKET, path)}` },
  ];
}

const asList = (jsonLd: PageSeoInput["jsonLd"]): readonly JsonLdNode[] => {
  if (!jsonLd) {
    return [];
  }
  return Array.isArray(jsonLd) ? jsonLd : [jsonLd as JsonLdNode];
};

/**
 * Every meta tag of the head, for @exyconn/seo's renderHead. Every branding field can be an
 * empty string until an admin fills it in, so each read falls back to the value the site used
 * to hardcode.
 */
export function buildPageMeta(
  seo: PageSeoInput,
  branding: Branding,
  place: PagePlace,
  siteFavicon = ""
): PageMeta {
  const { siteUrl, pagePath, market } = place;
  const businessName = branding.businessName || BRANDING_FALLBACK.businessName;
  const slogan = branding.slogan || BRANDING_FALLBACK.slogan;
  const toAbsoluteUrl = (url: string): string =>
    /^https?:\/\//i.test(url) ? url : `${siteUrl}${url}`;
  const path = pagePath === "" ? "/" : pagePath;
  const placedPath = market ? marketUrl(market, path) : path;

  // OG image: absolute, defaulting to the branding OG image (1200x630). Some platforms reject
  // SVG, so a PNG/JPG of the same size is the safest upload.
  const rawImage = seo.metaImage || branding.ogImageUrl || BRANDING_FALLBACK.ogImageUrl;
  // Organization identity only — canonical/og:url stay derived from the site's origin.
  const baselineLd = baselineJsonLd({
    businessName,
    organizationUrl: branding.websiteUrl || siteUrl,
    siteUrl,
    logo: toAbsoluteUrl(faviconOf(branding, siteFavicon)),
    profiles: socialLinks(branding).map((link) => link.url),
  });

  return {
    title: seo.title || seo.metaTitle || `${businessName} | ${slogan}`,
    description: seo.description || seo.metaDescription || DEFAULT_DESCRIPTION,
    canonical: seo.canonical || `${siteUrl}${placedPath}`,
    keywords: seo.keywords || seo.metaKeywords || DEFAULT_KEYWORDS,
    robots: seo.noindex ? ROBOTS_NOINDEX : ROBOTS_INDEX,
    locale: market ? market.locale : place.locale,
    alternates: market ? marketAlternates(siteUrl, path) : [],
    siteName: businessName,
    type: seo.ogType ?? "website",
    image: { url: toAbsoluteUrl(rawImage), width: 1200, height: 630 },
    themeColor: branding.primaryColor || BRANDING_FALLBACK.primaryColor,
    jsonLd: [...baselineLd, ...asList(seo.jsonLd)],
  };
}

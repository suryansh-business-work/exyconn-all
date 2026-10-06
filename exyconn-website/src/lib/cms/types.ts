import type { CmsBlock } from "@exyconn/cms";
import type { Branding } from "../portal/types";

/**
 * What the portal's public CMS queries answer (cms.public.typeDefs.ts on the server), as far
 * as the website reads it.
 */
export interface CmsSiteSeo {
  titleTemplate: string;
  description: string;
  ogImageUrl: string;
}

export interface CmsSite {
  id: string;
  name: string;
  slug: string;
  domains: string[];
  isDefault: boolean;
  /** Pages live under a market prefix (/en-us/…) — exyconn.com. */
  markets: boolean;
  defaultLocale: string;
  faviconUrl: string;
  seo: CmsSiteSeo;
  headerFragmentId: string;
  footerFragmentId: string;
  headHtml: string;
  bodyEndHtml: string;
  globalCss: string;
}

/** `{ colors: { light, dark }, fonts, radii, shadows, spacing }`, each a map of name → CSS value. */
export interface CmsDesignTokens {
  /** The raw colour ramps (gray-900, brand-500…) the colour roles may point at. */
  palette?: Record<string, string>;
  colors?: { light?: Record<string, string>; dark?: Record<string, string> };
  fonts?: Record<string, string>;
  radii?: Record<string, string>;
  shadows?: Record<string, string>;
  spacing?: Record<string, string>;
  /** The families the site loads: from Google Fonts, or uploaded to its media library. */
  fontSources?: CmsFontSource[];
}

/** One file of an uploaded family: one weight and style. */
export interface CmsFontFile {
  url: string;
  weight: string;
  style: "normal" | "italic";
  format: "woff2" | "woff" | "truetype" | "opentype";
}

export type CmsFontSource =
  | { family: string; provider: "GOOGLE"; variants: string[] }
  | { family: string; provider: "CUSTOM"; files: CmsFontFile[] };

export interface CmsDesignSystem {
  id: string;
  tokens: CmsDesignTokens;
  extraCss: string;
}

export interface CmsFragment {
  id: string;
  blocks: CmsBlock[];
  css: string;
}

export interface CmsPublicSite {
  site: CmsSite;
  designSystem: CmsDesignSystem | null;
  /** The header and footer, and every fragment they place. */
  fragments: CmsFragment[];
}

export interface CmsPageSeo {
  title: string;
  description: string;
  keywords: string;
  ogImageUrl: string;
  canonical: string;
  noindex: boolean;
  jsonLd: unknown;
}

export interface CmsPageData {
  id: string;
  path: string;
  kind: "PAGE" | "TEMPLATE";
  title: string;
  seo: CmsPageSeo;
  layout: "default" | "bare";
  blocks: CmsBlock[];
  css: string;
  /** What a template path bound, e.g. { slug: "hello" } for /blog/:slug. */
  params: Record<string, string>;
  /** A draft shown through a preview link. */
  preview: boolean;
}

export interface CmsPublicPage {
  page: CmsPageData;
  fragments: CmsFragment[];
}

export interface CmsPath {
  path: string;
  updatedAt: string;
}

/**
 * What every component on a CMS page can read besides its own props (passed as `cms`): the
 * company's branding (fetched once per page), the params a template bound, and the
 * published fragments the page places.
 */
export interface CmsRenderContext {
  branding: Branding;
  params: Readonly<Record<string, string>>;
  fragments: ReadonlyMap<string, readonly CmsBlock[]>;
}

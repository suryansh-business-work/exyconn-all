/**
 * A site as the CMS seeds it on first boot (see cms.seed.ts). Fragment placeholders in page HTML
 * name fragments by seed key — `data-fragment-id="seed:<key>"` — and are rewritten to the real
 * ids as the items are inserted.
 */
export interface CmsSeedSite {
  name: string;
  slug: string;
  domains: string[];
  markets: boolean;
  defaultLocale: string;
  faviconUrl: string;
  seo: { titleTemplate: string; description: string; ogImageUrl: string };
  headHtml: string;
  bodyEndHtml: string;
  globalCss: string;
  /** Seed keys of the fragments the site wears as its header and footer. */
  headerFragment: string;
  footerFragment: string;
}

export interface CmsSeedDesignSystem {
  name: string;
  tokens: Record<string, unknown>;
  extraCss: string;
}

export interface CmsSeedFragment {
  key: string;
  name: string;
  kind: 'HEADER' | 'FOOTER' | 'SECTION' | 'SNIPPET';
  html: string;
  css: string;
}

export interface CmsSeedPage {
  key: string;
  path: string;
  kind: 'PAGE' | 'TEMPLATE';
  title: string;
  layout: 'default' | 'bare';
  seo: {
    title: string;
    description: string;
    keywords: string;
    ogImageUrl: string;
    canonical: string;
    noindex: boolean;
    jsonLd: unknown;
  };
  html: string;
  css: string;
}

export interface CmsSiteSeed {
  site: CmsSeedSite;
  designSystem: CmsSeedDesignSystem;
  fragments: CmsSeedFragment[];
  pages: CmsSeedPage[];
}

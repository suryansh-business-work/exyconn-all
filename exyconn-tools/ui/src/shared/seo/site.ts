/**
 * What every tools page shares in its head. Pure data (no React, no DOM) so the build-time
 * prerenderer (scripts/prerender.ts) and the SPA (RouteSeo) read the same values.
 */
import type { SiteDefaults } from '@exyconn/seo';

export const SITE_ORIGIN = 'https://tools.exyconn.com';
export const SITE_NAME = 'Exyconn Tools';
/** The hub's canonical path; `/` serves the same page. */
export const HUB_PATH = '/tools';

export const ORGANIZATION = {
  name: 'Exyconn',
  url: 'https://exyconn.com',
  logo: `${SITE_ORIGIN}/exyconn-icon.svg`,
  sameAs: ['https://www.linkedin.com/company/exyconn', 'https://x.com/exyconn'],
} as const;

export const SITE: SiteDefaults = {
  origin: SITE_ORIGIN,
  name: SITE_NAME,
  locale: 'en-US',
  themeColor: '#05061a',
  image: {
    url: '/og-image.png',
    width: 1200,
    height: 630,
    type: 'image/png',
    alt: 'Exyconn Tools — free online tools for SEO, PDFs, images and AI',
  },
  twitter: { site: '@exyconn' },
};

export const HUB_DESCRIPTION =
  'Free online tools for SEO, sitemaps, domains, PDFs, images and AI writing — fast, private, in your browser and with no signup.';

export const categoryPath = (slug: string): string => `/categories/${slug}`;

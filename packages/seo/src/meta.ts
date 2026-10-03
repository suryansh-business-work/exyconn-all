import { ROBOTS_INDEX, ROBOTS_NOINDEX } from './constants';
import type { JsonLdNode, OgType, PageMeta, SeoAlternate, SeoImage, TwitterMeta } from './types';
import { absoluteUrl } from './url';

/** What every page of one site shares. */
export interface SiteDefaults {
  /** e.g. "https://tools.exyconn.com" */
  readonly origin: string;
  readonly name: string;
  readonly locale?: string;
  readonly themeColor?: string;
  /** Used when a page has no image of its own; a relative url is resolved against `origin`. */
  readonly image?: SeoImage;
  readonly twitter?: TwitterMeta;
}

/** What one page says about itself. */
export interface PageInput {
  /** Path ("/tools/merge-pdf") or absolute URL; becomes the canonical. */
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly keywords?: string | readonly string[];
  readonly image?: SeoImage;
  readonly type?: OgType;
  readonly noindex?: boolean;
  readonly alternates?: readonly SeoAlternate[];
  readonly jsonLd?: readonly JsonLdNode[];
}

/** One page's full meta: the page's own values over the site's defaults. */
export function createPageMeta(site: SiteDefaults, page: PageInput): PageMeta {
  const image = page.image ?? site.image;
  return {
    title: page.title,
    description: page.description,
    canonical: absoluteUrl(site.origin, page.path),
    keywords: page.keywords,
    robots: page.noindex ? ROBOTS_NOINDEX : ROBOTS_INDEX,
    locale: site.locale,
    alternates: page.alternates,
    siteName: site.name,
    type: page.type ?? 'website',
    image: image && { ...image, url: absoluteUrl(site.origin, image.url) },
    twitter: site.twitter,
    themeColor: site.themeColor,
    jsonLd: page.jsonLd,
  };
}

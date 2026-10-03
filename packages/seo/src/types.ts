/**
 * The page-meta model: everything a page says about itself in its `<head>`.
 *
 * It describes values, never markup — `toTagList` turns it into tags and `renderHead`
 * into escaped HTML — so a server render, a build-time prerender and a client-side
 * route change all print the same head from the same object.
 */

/** A JSON-LD node. Builders in `./jsonld` produce these; any schema.org object fits. */
export type JsonLdNode = Readonly<Record<string, unknown>>;

/** A share image. Social cards render best at 1200×630 PNG/JPG. */
export interface SeoImage {
  /** Absolute URL; crawlers do not resolve relative image paths. */
  readonly url: string;
  readonly width?: number;
  readonly height?: number;
  /** Text alternative, printed as og:image:alt and twitter:image:alt. */
  readonly alt?: string;
  /** MIME type, e.g. "image/png". */
  readonly type?: string;
}

/** The same page in another language or region (`hreflang="x-default"` included). */
export interface SeoAlternate {
  readonly hreflang: string;
  readonly href: string;
}

export type OgType = 'website' | 'article' | 'profile' | 'product';

export type TwitterCard = 'summary' | 'summary_large_image';

export interface TwitterMeta {
  /** Defaults to `summary_large_image` when the page has an image, else `summary`. */
  readonly card?: TwitterCard;
  /** The site's handle, e.g. "@exyconn". */
  readonly site?: string;
  readonly creator?: string;
}

export interface PageMeta {
  readonly title: string;
  readonly description: string;
  /** Absolute canonical URL; og:url mirrors it. */
  readonly canonical: string;
  /** A list is joined with ", "; a string is printed as given. */
  readonly keywords?: string | readonly string[];
  /** A full robots directive, e.g. `ROBOTS_INDEX` or `ROBOTS_NOINDEX`. Omitted when unset. */
  readonly robots?: string;
  /** BCP 47 locale ("en-US"), printed as og:locale ("en_US"). */
  readonly locale?: string;
  readonly alternates?: readonly SeoAlternate[];
  readonly siteName?: string;
  /** Defaults to "website". */
  readonly type?: OgType;
  readonly image?: SeoImage;
  readonly twitter?: TwitterMeta;
  readonly themeColor?: string;
  readonly jsonLd?: readonly JsonLdNode[];
}

/** One head element, in a form a template (Astro, React, the DOM) can print itself. */
export type HeadTag =
  | { readonly kind: 'title'; readonly text: string }
  | { readonly kind: 'meta'; readonly attrs: Readonly<Record<string, string>> }
  | { readonly kind: 'link'; readonly attrs: Readonly<Record<string, string>> }
  | { readonly kind: 'jsonld'; readonly json: string };

/** A length or completeness problem worth fixing; never applied automatically. */
export interface SeoWarning {
  readonly field: 'title' | 'description' | 'image' | 'canonical';
  readonly message: string;
}

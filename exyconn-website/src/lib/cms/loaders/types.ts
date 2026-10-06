import type { JsonLdNode, PageMeta } from "@exyconn/seo";
import type { Market } from "../../i18n/markets";

/** What a page loader is given: the component's own props and where the page is served. */
export interface PageLoadInput {
  /** The props of the component the loader belongs to, as the CMS stored them. */
  props: Readonly<Record<string, unknown>>;
  /** What the template path bound, e.g. { slug: "hello" } for /blog/:slug. */
  params: Readonly<Record<string, string>>;
  /** The site's key: collections are read for this site. */
  site: string;
  market: Market;
  /** The site's origin, no trailing slash. */
  siteUrl: string;
}

/**
 * What a page loader read before the page renders — the head is written before the body, so
 * anything the head needs from a collection item is read here, once:
 * - `item` reaches the components as `cms.detail` (no second read);
 * - `vars` fill `{placeholders}` in the page's SEO title, description, keywords and image
 *   (a template's "{title} | Exyconn Blog");
 * - `jsonLd` follows the page's own structured data; `ogType`, `noindex` and `status` as named.
 */
export interface PageLoad {
  /** The key of the component whose loader read this (set by loadCmsPage). */
  source?: string;
  item?: unknown;
  vars?: Readonly<Record<string, string>>;
  jsonLd?: readonly JsonLdNode[];
  ogType?: PageMeta["type"];
  noindex?: boolean;
  /** An HTTP status other than 200 for a page that still renders (e.g. 503 with a notice). */
  status?: number;
}

/** Reads what a component's page needs before rendering; null when the item does not exist (404). */
export type PageLoader = (input: PageLoadInput) => Promise<PageLoad | null>;

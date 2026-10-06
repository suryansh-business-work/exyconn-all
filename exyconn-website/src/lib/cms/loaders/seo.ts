import type { JsonLdNode } from "@exyconn/seo";
import { fillCopy, fillJsonLd, type CmsVariables } from "../variables";
import type { CmsPageSeo, CmsSiteSeo } from "../types";
import type { PageLoad } from "./types";

/** The head values of a CMS page: its SEO with the loader's values filled in, else the site's. */
export interface FilledSeo {
  title: string;
  description: string;
  keywords: string;
  metaImage: string;
  jsonLd?: JsonLdNode[];
}

/** A keyword list without the entries a blank value left empty ("a, , b" → "a, b"). */
const withoutBlankKeywords = (keywords: string): string =>
  keywords
    .split(",")
    .filter((part) => part.trim() !== "")
    .join(",");

const asNodes = (jsonLd: unknown): JsonLdNode[] => {
  if (!jsonLd || typeof jsonLd !== "object") {
    return [];
  }
  return Array.isArray(jsonLd) ? (jsonLd as JsonLdNode[]) : [jsonLd as JsonLdNode];
};

/**
 * Fills a page's SEO: `{placeholders}` from the site's values (counters, market, URLs) and the
 * loader's (a template's item, which win), a blank description or image left to the site's,
 * and the loader's structured data after the page's own.
 */
export function filledSeo(
  page: Readonly<{ title: string; seo: CmsPageSeo }>,
  site: CmsSiteSeo,
  load: PageLoad,
  variables: CmsVariables
): FilledSeo {
  const vars = { ...variables, ...load.vars };
  const jsonLd = [...asNodes(fillJsonLd(page.seo.jsonLd, vars)), ...(load.jsonLd ?? [])];
  return {
    title: fillCopy(page.seo.title || page.title, vars),
    description: fillCopy(page.seo.description, vars).trim() || fillCopy(site.description, vars),
    keywords: withoutBlankKeywords(fillCopy(page.seo.keywords, vars)),
    metaImage: fillCopy(page.seo.ogImageUrl, vars) || site.ogImageUrl,
    jsonLd: jsonLd.length > 0 ? jsonLd : undefined,
  };
}

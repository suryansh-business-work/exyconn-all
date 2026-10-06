import { aiServiceCategories, allAiServices } from "./ai-services";

/**
 * The values CMS copy may name in braces — "across {serviceCount} service areas" — so a number
 * the site counts for itself never goes stale in an editor's text. They are counted from the
 * site's published AI service catalogue (src/lib/cms/ai-services.ts).
 */
export type CmsVariables = Readonly<Record<string, string>>;

export async function cmsVariables(siteId: string): Promise<CmsVariables> {
  const categories = await aiServiceCategories(siteId);
  return {
    serviceCount: String(allAiServices(categories).length),
    categoryCount: String(categories.length),
  };
}

/** Fills every known {placeholder} in a piece of CMS copy; unknown ones are left as written. */
export const fillCopy = (text: string, variables: CmsVariables): string =>
  text.replaceAll(/\{(\w+)\}/g, (whole, name: string) => variables[name] ?? whole);

/**
 * A page's JSON-LD with every string's placeholders filled — the copy variables, plus this
 * request's {market} (/en-in/services/…), {siteUrl} (https://exyconn.com), {marketUrl}
 * (https://exyconn.com/en-us) and {businessName}, so structured data names the URL the reader is on.
 */
export function fillJsonLd(value: unknown, variables: CmsVariables): unknown {
  if (typeof value === "string") {
    return fillCopy(value, variables);
  }
  if (Array.isArray(value)) {
    return value.map((item) => fillJsonLd(item, variables));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, fillJsonLd(item, variables)])
    );
  }
  return value;
}

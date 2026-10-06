import { aiServices } from "../services/aiServices";

/**
 * The values CMS copy may name in braces — "across {serviceCount} service areas" — so a number
 * the site counts for itself never goes stale in an editor's text.
 */
const VARIABLES: Readonly<Record<string, string>> = {
  serviceCount: String(aiServices.length),
};

/** Fills every known {placeholder} in a piece of CMS copy; unknown ones are left as written. */
export const fillCopy = (text: string): string =>
  text.replaceAll(/\{(\w+)\}/g, (whole, name: string) => VARIABLES[name] ?? whole);

/**
 * Fills {placeholders} in a page's JSON-LD with the copy variables and this request's
 * `values` — {siteUrl} (e.g. https://exyconn.com), {marketUrl} (the site and the reader's
 * market, e.g. https://exyconn.com/en-us) and {businessName} — so structured data names the
 * site and the URL the reader is on.
 */
export const fillJsonLd = (value: unknown, values: Readonly<Record<string, string>>): unknown => {
  const known: Readonly<Record<string, string>> = { ...VARIABLES, ...values };
  const json = JSON.stringify(value).replaceAll(/\{(\w+)\}/g, (whole, name: string) =>
    name in known ? JSON.stringify(known[name]).slice(1, -1) : whole
  );
  return JSON.parse(json) as unknown;
};

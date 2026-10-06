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

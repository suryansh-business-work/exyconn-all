/** A page loader's input for the loader tests: served on exyconn in the en-in market. */
import type { PageLoadInput } from "../../../../../src/lib/cms/loaders/types";
import { marketByPath, type Market } from "../../../../../src/lib/i18n/markets";

export const SITE_URL = "https://site.test";

const found = marketByPath("en-in");
if (!found) {
  throw new Error("en-in market missing from the registry");
}
export const EN_IN: Market = found;

export const CRUMBS = [
  { label: "Home", href: "/" },
  { label: "Section", href: "/section" },
];

export const loaderInput = (
  params: Record<string, string>,
  props: Record<string, unknown> = { crumbs: CRUMBS }
): PageLoadInput => ({ props, params, site: "exyconn", market: EN_IN, siteUrl: SITE_URL });

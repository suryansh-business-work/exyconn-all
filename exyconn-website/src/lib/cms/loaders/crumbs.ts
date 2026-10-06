import { marketCrumbs } from "../../content/format";
import type { Market } from "../../i18n/markets";
import { breadcrumbJsonLd, type Crumb } from "../../inner/structured-data";
import type { PageLoader } from "./types";

/** A component's `crumbs` prop, the trail its band shows (the current page last, without a link). */
export const crumbsOf = (props: Readonly<Record<string, unknown>>): Crumb[] =>
  Array.isArray(props.crumbs) ? (props.crumbs as Crumb[]) : [];

/** A list page's breadcrumb JSON-LD, from the same crumbs its band shows. */
export const crumbsLoader: PageLoader = async ({ props, siteUrl }) => ({
  jsonLd: [breadcrumbJsonLd(crumbsOf(props), siteUrl)],
});

/** A detail page's trail: the component's crumbs, then the item itself. */
export const itemCrumbs = (props: Readonly<Record<string, unknown>>, title: string): Crumb[] => [
  ...crumbsOf(props),
  { label: title },
];

/**
 * A detail page's breadcrumb JSON-LD: market-prefixed links, the item at its own URL — the
 * same trail its band shows.
 */
export const itemCrumbsJsonLd = (
  crumbs: readonly Crumb[],
  input: Readonly<{ market: Market; siteUrl: string }>,
  url: string
) => breadcrumbJsonLd(marketCrumbs(crumbs, input.market, url), input.siteUrl);

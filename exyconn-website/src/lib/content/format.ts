/**
 * Small formatting helpers shared by the portal-content pages (blog, case studies, tools,
 * sitemap): dates in the reader's market locale, market-correct absolute URLs, filter tokens.
 */
import { slugify } from "../inner/headings";
import { marketUrl, type Market } from "../i18n/markets";

/** A date both machine-readable and already formatted for the reader. */
export interface DisplayDate {
  iso: string;
  text: string;
}

/** "3 October 2026" in the market's own order and month names; empty text for a bad date. */
export const displayDate = (iso: string, locale: string): DisplayDate => {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) {
    return { iso, text: "" };
  }
  const text = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(time);
  return { iso, text };
};

/** `https://exyconn.com/en-in/blog/x` — the address a share link or JSON-LD must carry. */
export const marketPageUrl = (siteUrl: string, market: Market, path: string): string =>
  `${siteUrl.replace(/\/$/, "")}${marketUrl(market, path)}`;

/** An image URL made absolute against the site (JSON-LD and og:image need absolute ones). */
export const absoluteAsset = (siteUrl: string, src: string): string => {
  if (src === "" || /^(https?:|data:)/i.test(src)) {
    return src;
  }
  const path = src.startsWith("/") ? src : `/${src}`;
  return `${siteUrl.replace(/\/$/, "")}${path}`;
};

/** Space-separated filter tokens for FilterBar's `data-filter-<param>`. */
export const filterTokens = (labels: readonly string[]): string => labels.map(slugify).join(" ");

/** A chip option per label, most used first (ties alphabetical), at most `max`. */
export const chipOptions = (
  labels: readonly string[],
  max: number
): { value: string; label: string }[] => {
  const counts = new Map<string, number>();
  labels.forEach((label) => counts.set(label, (counts.get(label) ?? 0) + 1));
  return [...counts.entries()]
    .toSorted(([a, countA], [b, countB]) => countB - countA || a.localeCompare(b))
    .slice(0, max)
    .map(([label]) => ({ value: slugify(label), label }));
};

/** `20260903` — a date as a number FilterBar's sort can compare; 0 when unreadable. */
export const sortableDate = (iso: string): number => {
  const time = Date.parse(iso);
  return Number.isNaN(time)
    ? 0
    : Number(new Date(time).toISOString().slice(0, 10).replaceAll("-", ""));
};

interface Crumb {
  label: string;
  href?: string;
}

/** Breadcrumbs for JSON-LD: market-prefixed hrefs, the current page at its own URL. */
export const marketCrumbs = (
  crumbs: readonly Crumb[],
  market: Market,
  currentUrl: string
): Crumb[] =>
  crumbs.map((crumb, index) => {
    if (index === crumbs.length - 1) {
      return { label: crumb.label, href: currentUrl };
    }
    return crumb.href ? { label: crumb.label, href: marketUrl(market, crumb.href) } : crumb;
  });

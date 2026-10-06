import type { GlobeArc, LatLon } from "../../scripts/stage3d/shapes/globe";
import type { Market } from "../i18n/markets";
import { COUNTRY_POINTS } from "./country-points";

/** Arcs the about page's globe draws — 24 keeps a phone readable. */
export const MAX_GLOBE_ARCS = 24;

/** The distinct countries each language is published in, in registry order. */
export const countriesByLanguage = (markets: readonly Market[]): Map<string, string[]> => {
  const groups = new Map<string, string[]>();
  for (const { language, country } of markets) {
    if (!country) {
      continue;
    }
    const list = groups.get(language) ?? [];
    if (!list.includes(country)) {
      list.push(country);
    }
    groups.set(language, list);
  }
  return groups;
};

const pointsOf = (countries: readonly string[]): LatLon[] =>
  countries.flatMap((code) => (COUNTRY_POINTS[code] ? [COUNTRY_POINTS[code]] : []));

/** One language's chain: each country it is read in, joined to the next. */
const chain = (points: readonly LatLon[]): GlobeArc[] =>
  points.slice(1).map((to, index) => ({ from: points[index], to }));

/**
 * The globe's arcs: every language read in more than one country becomes a chain of arcs
 * between those countries; the chains are interleaved so the first `max` arcs cover as many
 * languages as possible.
 */
export const marketArcs = (markets: readonly Market[], max = MAX_GLOBE_ARCS): GlobeArc[] => {
  const chains = [...countriesByLanguage(markets).values()]
    .map((countries) => chain(pointsOf(countries)))
    .filter((arcs) => arcs.length > 0);
  const longest = Math.max(0, ...chains.map((arcs) => arcs.length));
  const arcs: GlobeArc[] = [];
  for (let step = 0; step < longest; step += 1) {
    for (const arcsOfLanguage of chains) {
      if (step < arcsOfLanguage.length) {
        arcs.push(arcsOfLanguage[step]);
      }
    }
  }
  return arcs.slice(0, max);
};

export interface MarketFacts {
  markets: number;
  countries: number;
  languages: number;
}

/** How many markets, countries and languages the site is published for. */
export const marketFacts = (markets: readonly Market[]): MarketFacts => ({
  markets: markets.length,
  countries: new Set(markets.flatMap((market) => (market.country ? [market.country] : []))).size,
  languages: new Set(markets.map((market) => market.language)).size,
});

/** Fills a sentence's {markets}, {countries} and {languages} (any {placeholder} in `values`). */
export const fillTemplate = (template: string, values: Readonly<Record<string, number>>): string =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template
  );

/** The about page's globe: arcs between the countries each language is read in, and its facts. */
import { describe, expect, it } from "vitest";
import { COUNTRY_POINTS } from "../../../../src/lib/company/country-points";
import {
  countriesByLanguage,
  fillTemplate,
  MAX_GLOBE_ARCS,
  marketArcs,
  marketFacts,
} from "../../../../src/lib/company/markets-globe";
import { MARKETS, type Market } from "../../../../src/lib/i18n/markets";

const market = (language: string, country: string | null): Market => ({
  path: `${language}-${(country ?? "xx").toLowerCase()}`,
  label: `${language} ${country ?? "region"}`,
  language,
  country,
  locale: `${language}-${country ?? "XX"}`,
});

describe("COUNTRY_POINTS", () => {
  it("places every country the market registry names, at valid coordinates", () => {
    const countries = MARKETS.flatMap((m) => (m.country ? [m.country] : []));
    expect(countries.filter((code) => !COUNTRY_POINTS[code])).toEqual([]);
    Object.values(COUNTRY_POINTS).forEach(({ lat, lon }) => {
      expect(Math.abs(lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(lon)).toBeLessThanOrEqual(180);
    });
  });
});

describe("countriesByLanguage", () => {
  it("collects each language's distinct countries in order, skipping regional markets", () => {
    const groups = countriesByLanguage([
      market("de", "DE"),
      market("de", "AT"),
      market("de", "DE"),
      market("ar", null),
      market("en", "GB"),
    ]);
    expect([...groups.entries()]).toEqual([
      ["de", ["DE", "AT"]],
      ["en", ["GB"]],
    ]);
    expect(countriesByLanguage([])).toEqual(new Map());
  });
});

describe("marketArcs", () => {
  it("chains each language's countries and interleaves the chains", () => {
    const arcs = marketArcs([
      market("es", "ES"),
      market("es", "MX"),
      market("es", "AR"),
      market("pt", "PT"),
      market("pt", "BR"),
    ]);
    expect(arcs).toEqual([
      { from: COUNTRY_POINTS.ES, to: COUNTRY_POINTS.MX },
      { from: COUNTRY_POINTS.PT, to: COUNTRY_POINTS.BR },
      { from: COUNTRY_POINTS.MX, to: COUNTRY_POINTS.AR },
    ]);
  });

  it("draws nothing for a language in one country or in countries it cannot place", () => {
    expect(marketArcs([market("is", "IS")])).toEqual([]);
    expect(marketArcs([market("xx", "ZZ"), market("xx", "QQ")])).toEqual([]);
    expect(marketArcs([market("xx", "ZZ"), market("xx", "FR"), market("xx", "DE")])).toEqual([
      { from: COUNTRY_POINTS.FR, to: COUNTRY_POINTS.DE },
    ]);
    expect(marketArcs([])).toEqual([]);
  });

  it("caps the arcs at the limit given, by default the phone-readable maximum", () => {
    expect(marketArcs(MARKETS)).toHaveLength(MAX_GLOBE_ARCS);
    expect(marketArcs(MARKETS, 2)).toHaveLength(2);
  });
});

describe("marketFacts", () => {
  it("counts markets, distinct countries and distinct languages", () => {
    expect(
      marketFacts([market("en", "GB"), market("cy", "GB"), market("en", null), market("fr", "FR")])
    ).toEqual({ markets: 4, countries: 2, languages: 3 });
    expect(marketFacts([])).toEqual({ markets: 0, countries: 0, languages: 0 });
  });
});

describe("fillTemplate", () => {
  it("fills every occurrence of each placeholder and leaves unknown ones", () => {
    expect(
      fillTemplate("{markets} markets, {countries} countries, {markets} again {x}", {
        markets: 86,
        countries: 80,
      })
    ).toBe("86 markets, 80 countries, 86 again {x}");
    expect(fillTemplate("none", {})).toBe("none");
  });
});

import marketList from "@exyconn/config/markets.json";

/**
 * One market the site is published for: a country and the language it is read in there.
 *
 * The registry is shared data (`@exyconn/config/markets.json`), not a list in this file, so
 * the site, the sitemap and anything that has to agree about what `/fr-ca` means read the
 * same rows.
 */
export interface Market {
  /** The URL segment: `en-in`, `fr-ca`. Lower case, and the identity of the market. */
  path: string;
  /** What the picker shows, written the way that market writes it: "Österreich - Deutsch". */
  label: string;
  /** BCP 47 language subtag — what the translation catalogue is keyed on. */
  language: string;
  /** ISO 3166-1 alpha-2, or null for a market that is not one country ("Gulf"). */
  country: string | null;
  /** The full tag for `lang`, `hreflang` and number/date formatting. */
  locale: string;
}

export const MARKETS: readonly Market[] = marketList as Market[];

/**
 * Where somebody lands when nothing about them says otherwise.
 *
 * English, and the largest English market: a person whose browser asks for a language the
 * site does not publish gets a page they can read, in a market they can change in one click.
 */
export const DEFAULT_MARKET: Market =
  MARKETS.find((market) => market.path === "en-us") ?? MARKETS[0];

const BY_PATH = new Map(MARKETS.map((market) => [market.path, market]));

/** The market a URL segment names, or null when the segment is not one. */
export function marketByPath(segment: string | undefined): Market | null {
  if (!segment) {
    return null;
  }
  return BY_PATH.get(segment.toLowerCase()) ?? null;
}

/** Every market that reads in one language, in registry order. */
export function marketsSpeaking(language: string): Market[] {
  return MARKETS.filter((market) => market.language === language);
}

/** `/en-in/about-us` — the same page in another market. */
export function marketUrl(market: Market, pathWithoutMarket: string): string {
  const rest = pathWithoutMarket === "/" ? "" : pathWithoutMarket;
  return `/${market.path}${rest}`;
}

/** Splits `/en-in/about-us` into its market and the page beneath it. */
export function splitMarketPath(pathname: string): { market: Market | null; rest: string } {
  const [, first = "", ...others] = pathname.split("/");
  const market = marketByPath(first);
  if (!market) {
    return { market: null, rest: pathname };
  }
  const rest = `/${others.join("/")}`.replace(/\/+$/, "");
  return { market, rest: rest === "" ? "/" : rest };
}

/** `en-GB,en;q=0.9,fr;q=0.8` -> `["en-gb", "en", "fr"]`, best first. */
function acceptedLanguages(header: string | null): string[] {
  if (!header) {
    return [];
  }
  return header
    .split(",")
    .map((part) => {
      const [tag = "", ...params] = part.trim().split(";");
      const quality = params
        .map((param) => param.trim())
        .find((param) => param.startsWith("q="));
      return { tag: tag.trim().toLowerCase(), q: quality ? Number(quality.slice(2)) : 1 };
    })
    .filter((entry) => entry.tag !== "" && !Number.isNaN(entry.q))
    .sort((a, b) => b.q - a.q)
    .map((entry) => entry.tag);
}

/**
 * Which market to send somebody to when they arrive without one.
 *
 * The country decides the market and the language decides which of that country's markets:
 * Belgium publishes in both Dutch and French, and sending a French speaker in Brussels to the
 * Dutch page is worse than sending them to France's. Failing all that, the default.
 *
 * `country` is whatever the edge knows — Cloudflare's `CF-IPCountry`, a load balancer's own
 * header — and is simply absent in development.
 */
export function chooseMarket(acceptLanguage: string | null, country: string | null): Market {
  const wanted = acceptedLanguages(acceptLanguage);
  const languages = wanted.map((tag) => tag.split("-")[0]);
  const inCountry = country
    ? MARKETS.filter((market) => market.country === country.toUpperCase())
    : [];

  for (const language of languages) {
    const match = inCountry.find((market) => market.language === language);
    if (match) {
      return match;
    }
  }
  if (inCountry.length > 0) {
    return inCountry[0];
  }
  // No country, so honour the exact tag if it is a market ("en-in"), then the language.
  for (const tag of wanted) {
    const exact = marketByPath(tag);
    if (exact) {
      return exact;
    }
  }
  for (const language of languages) {
    const first = MARKETS.find((market) => market.language === language);
    if (first) {
      return first;
    }
  }
  return DEFAULT_MARKET;
}

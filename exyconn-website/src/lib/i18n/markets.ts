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
      const quality = params.map((param) => param.trim()).find((param) => param.startsWith("q="));
      return { tag: tag.trim().toLowerCase(), q: quality ? Number(quality.slice(2)) : 1 };
    })
    .filter((entry) => entry.tag !== "" && !Number.isNaN(entry.q))
    .sort((a, b) => b.q - a.q)
    .map((entry) => entry.tag);
}

/**
 * The market for one tag the browser accepts ("en-IN", "fr"), or null when its language is
 * not published. The country the edge reports picks among that language's markets — French
 * in Brussels is fr-be, and an "en-US" browser in India still reads en-in — then a tag that
 * names a market exactly, then the default market when it speaks the language (plain "en" is
 * en-us), then the first in the registry.
 */
function marketForTag(tag: string, inCountry: readonly Market[]): Market | null {
  const language = tag.split("-")[0];
  const speaking = marketsSpeaking(language);
  return (
    inCountry.find((market) => market.language === language) ??
    marketByPath(tag) ??
    speaking.find((market) => market === DEFAULT_MARKET) ??
    speaking[0] ??
    null
  );
}

/**
 * Which market to send somebody to when they arrive without one.
 *
 * The browser's languages decide, best first, and the country only chooses between one
 * language's markets (see `marketForTag`): Belgium publishes in Dutch and French, and a
 * French speaker there is better served by fr-be than by a Dutch page or France's. Only when
 * no language the browser asks for is published does the country alone decide, and failing
 * that, the default.
 *
 * `country` is whatever the edge knows — Cloudflare's `CF-IPCountry`, a load balancer's own
 * header — and is simply absent in development.
 */
export function chooseMarket(acceptLanguage: string | null, country: string | null): Market {
  const inCountry = country
    ? MARKETS.filter((market) => market.country === country.toUpperCase())
    : [];
  for (const tag of acceptedLanguages(acceptLanguage)) {
    const match = marketForTag(tag, inCountry);
    if (match) {
      return match;
    }
  }
  return inCountry[0] ?? DEFAULT_MARKET;
}

import { choiceCookie } from "../../lib/i18n/market-cookie";
import { readStored, writeStored } from "./storage";

/**
 * The market a reader chose on their first visit (MarketChooser.astro) or later in the
 * footer's picker. localStorage holds it so the reader is asked once per device; the choice
 * cookie mirrors it so the server sends a URL without a market straight there (marketForRequest).
 */
export const MARKET_KEY = "marketChoice";

/** The stored choice, or null when there is none or it names a market that no longer exists. */
export function chosenMarket(known: ReadonlySet<string>): string | null {
  const stored = readStored(MARKET_KEY);
  return stored !== null && known.has(stored) ? stored : null;
}

export function rememberMarket(path: string): void {
  writeStored(MARKET_KEY, path);
  document.cookie = choiceCookie(path);
}

/** The page being read, in market `path`: /en-us/about-us?x#y → /fr-fr/about-us?x#y. */
export function marketHref(
  path: string,
  current: string,
  here: Readonly<Pick<Location, "pathname" | "search" | "hash">>
): string {
  const rest = here.pathname.slice(current.length + 1);
  return `/${path}${rest}${here.search}${here.hash}`;
}

import type { APIRoute } from "astro";
import { marketByPath } from "../../lib/i18n/markets";
import { browserMarket, hasChosenMarket, isCrawler } from "../../lib/i18n/market-links";

/** Depends on who is asking, so no shared cache may keep it for anyone else. */
const PRIVATE = {
  "Cache-Control": "private, no-store",
  Vary: "Accept-Language, Cookie, User-Agent",
};

const nothing = () => new Response(null, { status: 204, headers: PRIVATE });

/**
 * The market to offer a reader who is on a page in another one — `?current=en-us` from a
 * French browser answers `{ path: "fr-fr", label: "France - Français" }`.
 *
 * A URL that names a market is never redirected (it may be a link somebody chose to share, and
 * it is what search engines index), so this is how such a page still meets the reader's
 * language: it offers, the reader decides. Nothing is offered to a crawler, to a reader who has
 * already picked a market, or when the page is already in the market their browser asks for.
 */
export const GET: APIRoute = ({ request, url }) => {
  const current = marketByPath(url.searchParams.get("current") ?? undefined);
  if (!current || isCrawler(request) || hasChosenMarket(request)) {
    return nothing();
  }
  const suggested = browserMarket(request);
  if (suggested.path === current.path) {
    return nothing();
  }
  return new Response(JSON.stringify({ path: suggested.path, label: suggested.label }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...PRIVATE },
  });
};

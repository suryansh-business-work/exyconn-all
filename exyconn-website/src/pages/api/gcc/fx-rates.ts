import type { APIRoute } from "astro";
import { fetchFxRates, parseCurrencies } from "../../../lib/gcc/fx-rates";
import { gccLimits, invalid, json, tooMany } from "../../../lib/gcc/route";
import { visitorAddress } from "../../../lib/visitor-limit";

/** ECB reference rates in INR per unit for `?currencies=USD,GBP` (at most ten codes). */
export const GET: APIRoute = async ({ request, url }) => {
  if (!gccLimits.fxRates.allow(visitorAddress(request))) {
    return tooMany();
  }
  const currencies = parseCurrencies(url.searchParams.get("currencies"));
  if (!currencies) {
    return invalid("Ask for one to ten 3-letter currency codes, e.g. USD,GBP.");
  }
  try {
    return json({ rates: await fetchFxRates(currencies) }, 200);
  } catch (err) {
    console.error("GCC exchange rates failed:", err instanceof Error ? err.message : err);
    return json(
      {
        error: "unavailable",
        message: "Reference exchange rates are not available right now. Enter a rate yourself.",
      },
      502
    );
  }
};

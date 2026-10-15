import type { APIRoute } from "astro";
import { fetchCurrencyCodes } from "../../../lib/gcc/fx-rates";
import { gccLimits, json, tooMany } from "../../../lib/gcc/route";
import { visitorAddress } from "../../../lib/visitor-limit";

/** Every currency the calculator can show an estimate in: the rate source's list, INR included. */
export const GET: APIRoute = async ({ request }) => {
  if (!gccLimits.fxRates.allow(visitorAddress(request))) {
    return tooMany();
  }
  try {
    return json({ currencies: await fetchCurrencyCodes() }, 200);
  } catch (err) {
    console.error("GCC currency list failed:", err instanceof Error ? err.message : err);
    return json(
      {
        error: "unavailable",
        message: "The currency list is not available right now.",
      },
      502
    );
  }
};

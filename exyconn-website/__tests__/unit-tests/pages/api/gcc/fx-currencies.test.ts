/** GET /api/gcc/fx-currencies: the currencies an estimate can be shown in. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fx = vi.hoisted(() => ({ fetchCurrencyCodes: vi.fn() }));
vi.mock("../../../../../src/lib/gcc/fx-rates", () => fx);

import { GET } from "../../../../../src/pages/api/gcc/fx-currencies";
import { gccLimits, resetGccLimits } from "../../../../../src/lib/gcc/route";
import { VISITOR, readJson, routeContext } from "../../route-helpers";

const get = async () =>
  readJson(
    await GET(
      routeContext(
        new Request("https://exyconn.com/api/gcc/fx-currencies", {
          headers: { "x-forwarded-for": VISITOR },
        })
      )
    )
  );

beforeEach(() => {
  resetGccLimits();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("GET /api/gcc/fx-currencies", () => {
  it("lists the rate source's currencies", async () => {
    fx.fetchCurrencyCodes.mockResolvedValue(["INR", "USD"]);
    expect(await get()).toEqual({ status: 200, body: { currencies: ["INR", "USD"] } });
  });

  it.each([
    [new Error("ECONNRESET"), "ECONNRESET"],
    ["timeout", "timeout"],
  ])("logs a failed fetch (%s) and says the list is unavailable", async (thrown, logged) => {
    fx.fetchCurrencyCodes.mockRejectedValue(thrown);
    expect(await get()).toEqual({
      status: 502,
      body: { error: "unavailable", message: "The currency list is not available right now." },
    });
    expect(console.error).toHaveBeenCalledWith("GCC currency list failed:", logged);
  });

  it("shares the exchange-rate allowance", async () => {
    for (let i = 0; i < 30; i += 1) {
      gccLimits.fxRates.allow(VISITOR);
    }
    expect((await get()).status).toBe(429);
    expect(fx.fetchCurrencyCodes).not.toHaveBeenCalled();
  });
});

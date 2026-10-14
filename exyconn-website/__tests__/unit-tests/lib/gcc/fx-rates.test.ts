import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FX_SOURCE,
  clearFxCache,
  fetchFxRates,
  parseCurrencies,
  toFxRates,
} from "../../../../src/lib/gcc/fx-rates";
import { resetGccLimits } from "../../../../src/lib/gcc/route";
import { GET } from "../../../../src/pages/api/gcc/fx-rates";
import { readJson, routeContext, VISITOR } from "../../pages/route-helpers";

const fetchMock = vi.fn<typeof fetch>();
const frankfurter = {
  amount: 1,
  base: "INR",
  date: "2026-10-13",
  rates: { GBP: 0.00909, USD: 0.012 },
};

const get = (query: string) =>
  GET(
    routeContext(
      new Request(`https://exyconn.com/api/gcc/fx-rates${query}`, {
        headers: { "x-forwarded-for": VISITOR },
      })
    )
  );

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  clearFxCache();
  resetGccLimits();
});

describe("the currencies a visitor may ask for", () => {
  it("takes up to ten 3-letter codes, once each, without INR", () => {
    expect(parseCurrencies("USD,GBP,USD,INR")).toEqual(["GBP", "USD"]);
  });

  it.each([null, "", "usd", "US", "USD;GBP"])("refuses %j", (param) => {
    expect(parseCurrencies(param)).toBeNull();
  });

  it("refuses eleven codes", () => {
    const eleven = "AUD,CAD,CHF,CNY,EUR,GBP,HKD,JPY,NZD,SGD,USD";
    expect(parseCurrencies(eleven)).toBeNull();
  });
});

describe("reading Frankfurter's answer", () => {
  it("turns units per rupee into rupees per unit, to six decimals", () => {
    expect(toFxRates(frankfurter, ["USD", "GBP"])).toEqual([
      {
        currency: "USD",
        inrPerUnit: 83.333333,
        source: FX_SOURCE,
        asOf: "2026-10-13",
        userProvided: false,
      },
      {
        currency: "GBP",
        inrPerUnit: 110.011001,
        source: FX_SOURCE,
        asOf: "2026-10-13",
        userProvided: false,
      },
    ]);
  });

  it("refuses an answer missing a currency or shaped wrongly", () => {
    expect(() => toFxRates(frankfurter, ["JPY"])).toThrow("No reference rate for JPY");
    expect(() => toFxRates({ date: "yesterday", rates: {} }, [])).toThrow();
    expect(() => toFxRates({ date: "2026-10-13", rates: { USD: 0 } }, ["USD"])).toThrow();
  });
});

describe("GET /api/gcc/fx-rates", () => {
  it("answers the rates, and asks the source once an hour for the same currencies", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(frankfurter)));

    const first = await readJson(await get("?currencies=USD,GBP"));
    await get("?currencies=GBP,USD");

    expect(first.status).toBe(200);
    expect(first.body.rates).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://api.frankfurter.app/latest?from=INR&to=GBP%2CUSD"
    );
  });

  it("asks again once the cached rates are an hour old", async () => {
    fetchMock.mockImplementation(async () => new Response(JSON.stringify(frankfurter)));

    await fetchFxRates(["USD"], 0);
    await fetchFxRates(["USD"], 60 * 60 * 1000);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("refuses a malformed currency list without calling the source", async () => {
    const response = await readJson(await get("?currencies=usd"));

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("invalid");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers 502 when the source fails or times out", async () => {
    fetchMock.mockResolvedValueOnce(new Response("down", { status: 500 }));
    const failed = await readJson(await get("?currencies=USD"));
    expect(failed.status).toBe(502);
    expect(failed.body.error).toBe("unavailable");

    fetchMock.mockRejectedValueOnce(new DOMException("timed out", "TimeoutError"));
    expect((await get("?currencies=GBP")).status).toBe(502);
  });

  it("answers an empty list for INR alone", async () => {
    expect(await readJson(await get("?currencies=INR"))).toEqual({
      status: 200,
      body: { rates: [] },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

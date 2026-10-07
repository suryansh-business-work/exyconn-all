import { describe, expect, it } from "vitest";
import { GET } from "../../../../src/pages/api/market-suggestion";
import { routeContext } from "../route-helpers";

const CHROME = "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/130 Safari/537.36";

const suggest = async (query: string, headers: Record<string, string> = {}) =>
  GET(
    routeContext(
      new Request(`https://exyconn.com/api/market-suggestion${query}`, {
        headers: { "user-agent": CHROME, ...headers },
      })
    )
  );

const expectNothing = (response: Response) => {
  expect(response.status).toBe(204);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.headers.get("Vary")).toBe("Accept-Language, Cookie, User-Agent");
};

describe("GET /api/market-suggestion", () => {
  it("offers a French reader on the US page the French market", async () => {
    const response = await suggest("?current=en-us", { "accept-language": "fr-FR,fr;q=0.9" });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ path: "fr-fr", label: "France - Français" });
  });

  it("offers nothing without a current market, or with one that is not a market", async () => {
    expectNothing(await suggest("", { "accept-language": "fr" }));
    expectNothing(await suggest("?current=xx-yy", { "accept-language": "fr" }));
  });

  it("offers nothing to a crawler", async () => {
    expectNothing(
      await suggest("?current=en-us", { "accept-language": "fr", "user-agent": "Googlebot/2.1" })
    );
  });

  it("offers nothing to a reader who already chose a market", async () => {
    expectNothing(
      await suggest("?current=en-us", {
        "accept-language": "fr",
        cookie: "exy_market_choice=en-gb",
      })
    );
  });

  it("does not interrupt a reader already reading their language", async () => {
    expectNothing(await suggest("?current=en-us", { "accept-language": "en-GB" }));
  });
});

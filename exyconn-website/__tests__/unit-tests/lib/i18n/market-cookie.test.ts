import { describe, expect, it } from "vitest";
import { MARKET_COOKIE, choiceCookie } from "../../../../src/lib/i18n/market-cookie";

describe("market choice cookie", () => {
  it("is named for a choice, not for the market a page was read in", () => {
    expect(MARKET_COOKIE).toBe("exy_market_choice");
  });

  it("remembers the chosen market site-wide for a year", () => {
    expect(choiceCookie("fr-ca")).toBe(
      "exy_market_choice=fr-ca; Path=/; Max-Age=31536000; SameSite=Lax"
    );
  });

  it("encodes a value that would otherwise break the cookie", () => {
    expect(choiceCookie("a b;c")).toMatch(/^exy_market_choice=a%20b%3Bc; Path=\//);
  });
});

import { describe, expect, it } from "vitest";
import { marketFrom } from "../../../../src/pages/[market]/_market";

describe("the market a page is rendered for", () => {
  it("is the market the first path segment names", () => {
    expect(marketFrom({ market: "fr-ca" })?.locale).toBe("fr-CA");
    expect(marketFrom({ market: "EN-IN" })?.path).toBe("en-in");
  });

  it("is null for a segment that is not a market, so the page 404s", () => {
    expect(marketFrom({ market: "xyz" })).toBeNull();
    expect(marketFrom({})).toBeNull();
  });
});

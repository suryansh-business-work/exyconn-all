// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  chosenMarket,
  MARKET_KEY,
  marketHref,
  rememberMarket,
} from "../../../../src/scripts/chrome/market-choice";

const KNOWN = new Set(["en-us", "fr-fr", "de-at"]);

afterEach(() => {
  localStorage.clear();
  document.cookie = "exy_market_choice=; Path=/; Max-Age=0";
});

describe("market choice", () => {
  it("has no choice until the reader makes one", () => {
    expect(chosenMarket(KNOWN)).toBeNull();
  });

  it("remembers the choice in localStorage and mirrors it to the choice cookie", () => {
    rememberMarket("fr-fr");

    expect(localStorage.getItem(MARKET_KEY)).toBe("fr-fr");
    expect(document.cookie).toContain("exy_market_choice=fr-fr");
    expect(chosenMarket(KNOWN)).toBe("fr-fr");
  });

  it("ignores a stored market that no longer exists", () => {
    localStorage.setItem(MARKET_KEY, "xx-yy");
    expect(chosenMarket(KNOWN)).toBeNull();
  });

  it("keeps the page, query and hash when moving to another market", () => {
    const here = { pathname: "/en-us/about-us", search: "?ref=a", hash: "#team" };
    expect(marketHref("fr-fr", "en-us", here)).toBe("/fr-fr/about-us?ref=a#team");
  });

  it("moves a market's home page to the other market's home page", () => {
    expect(marketHref("de-at", "en-us", { pathname: "/en-us", search: "", hash: "" })).toBe(
      "/de-at"
    );
  });
});

/** Formatting shared by the portal-content pages: dates, market URLs, assets and filters. */
import { describe, expect, it } from "vitest";
import {
  absoluteAsset,
  chipOptions,
  displayDate,
  filterTokens,
  marketCrumbs,
  marketPageUrl,
  sortableDate,
} from "../../../../src/lib/content/format";
import { DEFAULT_MARKET, marketByPath } from "../../../../src/lib/i18n/markets";

const enIn = marketByPath("en-in");
if (!enIn) {
  throw new Error("en-in market missing from the registry");
}

describe("displayDate", () => {
  it("formats the date in the reader's locale, in UTC, keeping the ISO value", () => {
    expect(displayDate("2026-10-03T23:30:00.000Z", "en-GB")).toEqual({
      iso: "2026-10-03T23:30:00.000Z",
      text: "3 October 2026",
    });
    expect(displayDate("2026-10-03", "en-US").text).toBe("October 3, 2026");
  });

  it("gives no text for an unreadable date", () => {
    expect(displayDate("someday", "en-GB")).toEqual({ iso: "someday", text: "" });
  });
});

describe("marketPageUrl", () => {
  it("joins the site, the market and the path, with or without a trailing slash", () => {
    expect(marketPageUrl("https://exyconn.com/", enIn, "/blog/x")).toBe(
      "https://exyconn.com/en-in/blog/x"
    );
    expect(marketPageUrl("https://exyconn.com", DEFAULT_MARKET, "/")).toBe(
      "https://exyconn.com/en-us"
    );
  });
});

describe("absoluteAsset", () => {
  it("makes root-relative and bare paths absolute", () => {
    expect(absoluteAsset("https://exyconn.com/", "/og.png")).toBe("https://exyconn.com/og.png");
    expect(absoluteAsset("https://exyconn.com", "img/og.png")).toBe(
      "https://exyconn.com/img/og.png"
    );
  });

  it("leaves absolute, data and empty URLs alone", () => {
    expect(absoluteAsset("https://exyconn.com", "HTTP://cdn.test/a.png")).toBe(
      "HTTP://cdn.test/a.png"
    );
    expect(absoluteAsset("https://exyconn.com", "data:image/png;base64,AA")).toBe(
      "data:image/png;base64,AA"
    );
    expect(absoluteAsset("https://exyconn.com", "")).toBe("");
  });
});

describe("filterTokens and chipOptions", () => {
  it("slugifies every label into one space-separated list", () => {
    expect(filterTokens(["AI agents", "Data & analytics", "Café"])).toBe(
      "ai-agents data-analytics cafe"
    );
    expect(filterTokens([])).toBe("");
  });

  it("ranks labels by use, ties alphabetically, up to the limit", () => {
    expect(chipOptions(["Beta", "Alpha", "Gamma", "Beta", "Gamma"], 3)).toEqual([
      { value: "beta", label: "Beta" },
      { value: "gamma", label: "Gamma" },
      { value: "alpha", label: "Alpha" },
    ]);
    expect(chipOptions(["Beta", "Alpha"], 1)).toEqual([{ value: "alpha", label: "Alpha" }]);
    expect(chipOptions([], 5)).toEqual([]);
  });
});

describe("sortableDate", () => {
  it("turns an ISO date into a comparable number, 0 when unreadable", () => {
    expect(sortableDate("2026-01-05T10:00:00.000Z")).toBe(20260105);
    expect(sortableDate("nonsense")).toBe(0);
  });
});

describe("marketCrumbs", () => {
  it("prefixes linked crumbs, keeps unlinked ones and links the last to the page", () => {
    const current = "https://exyconn.com/en-in/blog/x";
    expect(
      marketCrumbs(
        [{ label: "Home", href: "/" }, { label: "Group" }, { label: "Post", href: "/ignored" }],
        enIn,
        current
      )
    ).toEqual([
      { label: "Home", href: "/en-in" },
      { label: "Group" },
      { label: "Post", href: current },
    ]);
    expect(marketCrumbs([], enIn, current)).toEqual([]);
  });
});

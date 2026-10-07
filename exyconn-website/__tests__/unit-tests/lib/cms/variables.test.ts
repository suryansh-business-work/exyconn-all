/** The {placeholders} CMS copy and JSON-LD may name, and how they are filled. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCmsPage } from "../../../../src/lib/cms/client";
import { cmsVariables, fillCopy, fillJsonLd } from "../../../../src/lib/cms/variables";
import { catalogueBlock, CATEGORIES, publicPage } from "./fixtures";

vi.mock("../../../../src/lib/cms/client", () => ({ getCmsPage: vi.fn(), getCmsSite: vi.fn() }));

const page = vi.mocked(getCmsPage);

beforeEach(() => {
  page.mockReset();
});

describe("cmsVariables", () => {
  it("counts the published services and categories", async () => {
    page.mockResolvedValue(publicPage({ blocks: [catalogueBlock(CATEGORIES)] }));
    await expect(cmsVariables("site-1")).resolves.toEqual({
      serviceCount: "3",
      categoryCount: "2",
    });
  });

  it("counts zero when the catalogue is not published", async () => {
    page.mockResolvedValue(null);
    await expect(cmsVariables("site-1")).resolves.toEqual({
      serviceCount: "0",
      categoryCount: "0",
    });
  });
});

describe("fillCopy", () => {
  it("fills every known placeholder and leaves unknown ones as written", () => {
    expect(
      fillCopy("{serviceCount} services, {serviceCount} again, {nope}", { serviceCount: "12" })
    ).toBe("12 services, 12 again, {nope}");
  });

  it("leaves text without placeholders alone, and fills an empty value", () => {
    expect(fillCopy("plain {", {})).toBe("plain {");
    expect(fillCopy("[{x}]", { x: "" })).toBe("[]");
  });
});

describe("fillJsonLd", () => {
  const vars = { siteUrl: "https://exyconn.com", market: "/en-in" };

  it("fills strings at any depth and keeps other values as they are", () => {
    const filled = fillJsonLd(
      {
        url: "{siteUrl}{market}/services",
        count: 3,
        live: true,
        none: null,
        list: ["{siteUrl}", 4, { name: "{market}" }],
      },
      vars
    );
    expect(filled).toEqual({
      url: "https://exyconn.com/en-in/services",
      count: 3,
      live: true,
      none: null,
      list: ["https://exyconn.com", 4, { name: "/en-in" }],
    });
  });

  it("fills a top-level string or array, and passes undefined through", () => {
    expect(fillJsonLd("{market}", vars)).toBe("/en-in");
    expect(fillJsonLd(["{market}"], vars)).toEqual(["/en-in"]);
    expect(fillJsonLd(undefined, vars)).toBeUndefined();
  });
});

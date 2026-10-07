import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NavLink } from "../../../../src/lib/portal/types";

const getNavLinks = vi.hoisted(() => vi.fn());
vi.mock("../../../../src/lib/portal", () => ({ getNavLinks }));

import { GET, prerender } from "../../../../src/pages/api/search-index.json";
import { readJson, routeContext } from "../route-helpers";

const link: NavLink = {
  id: "n1",
  label: "Contact",
  href: "/contact",
  description: "Reach the team",
  category: "Company",
  keywords: "email phone",
};

beforeEach(() => {
  getNavLinks.mockReset();
});

describe("GET /api/search-index.json", () => {
  it("is rendered per request so portal edits show without a redeploy", () => {
    expect(prerender).toBe(false);
  });

  it("serves the portal's navigation links in the search modal's short keys", async () => {
    // A link saved without keywords comes back from the portal as null.
    const unkeyed = { ...link, id: "n2", label: "Blog", href: "/blog", keywords: null };
    getNavLinks.mockResolvedValue([link, unkeyed]);

    const response = await GET(
      routeContext(new Request("https://exyconn.com/api/search-index.json"))
    );

    expect(response.headers.get("Cache-Control")).toBe("public, max-age=300, s-maxage=3600");
    expect(response.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
    expect(await readJson(response)).toEqual({
      status: 200,
      body: {
        items: [
          { t: "Contact", u: "/contact", d: "Reach the team", c: "Company", k: "email phone" },
          { t: "Blog", u: "/blog", d: "Reach the team", c: "Company", k: "" },
        ],
      },
    });
  });

  it("serves an empty index when the portal has no links", async () => {
    getNavLinks.mockResolvedValue([]);
    const response = await GET(
      routeContext(new Request("https://exyconn.com/api/search-index.json"))
    );
    expect((await readJson(response)).body).toEqual({ items: [] });
  });
});

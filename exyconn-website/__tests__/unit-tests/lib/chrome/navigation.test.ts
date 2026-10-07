/** The chrome's links: header menus, phone shortcuts, footer columns and the legal bar. */
import { describe, expect, it } from "vitest";
import {
  BLOG_LINK,
  FOOTER_COLUMNS,
  FOOTER_TAGLINE,
  HEADER_ACTIONS,
  HEADER_MENUS,
  LEGAL_LINKS,
  menuIndex,
  MOBILE_SHORTCUTS,
  PROMO_LINK,
  type NavLink,
} from "../../../../src/lib/chrome/navigation";
import { TOOLS_SITE_URL } from "../../../../src/lib/site";

const everyLink: NavLink[] = [
  ...HEADER_MENUS.flatMap((group) => [...group.links, ...(group.overview ? [group.overview] : [])]),
  ...FOOTER_COLUMNS.flatMap((column) => column.links),
  ...MOBILE_SHORTCUTS,
  ...LEGAL_LINKS,
  BLOG_LINK,
  PROMO_LINK,
  HEADER_ACTIONS.primary,
  HEADER_ACTIONS.secondary,
];

describe("header menus", () => {
  it("lists AI, Services and Company in that order with unique ids", () => {
    expect(HEADER_MENUS.map((group) => group.id)).toEqual(["ai", "services", "company"]);
  });

  it("gives AI and Services a hub link, Company none", () => {
    const [ai, services, company] = HEADER_MENUS;
    expect(ai.overview?.href).toBe("/ai");
    expect(services.overview?.href).toBe("/our-services");
    expect(company.overview).toBeUndefined();
  });

  it("describes every menu item in one line", () => {
    const bare = HEADER_MENUS.flatMap((group) => group.links).filter((link) => !link.text);
    expect(bare).toEqual([]);
  });

  it("sends the header's calls to action inside the site", () => {
    expect(HEADER_ACTIONS.primary).toEqual({ label: "Get started", href: "/contact" });
    expect(HEADER_ACTIONS.secondary.href).toBe("/ai-services");
  });
});

describe("links", () => {
  it("keeps internal links unprefixed and external ones on https", () => {
    const wrong = everyLink.filter((link) =>
      link.external ? !link.href.startsWith("https://") : !link.href.startsWith("/")
    );
    expect(wrong).toEqual([]);
  });

  it("marks every link to the tools site as external", () => {
    const tools = everyLink.filter((link) => link.href === TOOLS_SITE_URL);
    expect(tools.length).toBeGreaterThan(0);
    expect(tools.every((link) => link.external)).toBe(true);
  });

  it("never repeats a link within one menu or column", () => {
    for (const group of [...HEADER_MENUS, ...FOOTER_COLUMNS]) {
      const hrefs = group.links.map((link) => link.href);
      expect(new Set(hrefs).size, group.id).toBe(hrefs.length);
    }
  });
});

describe("footer", () => {
  it("leads the AI and Services columns with their hubs", () => {
    const [ai, services, products, company] = FOOTER_COLUMNS;
    expect(ai.links[0]).toEqual({ label: "AI platform", href: "/ai" });
    expect(ai.links.slice(1)).toEqual(HEADER_MENUS[0].links);
    expect(services.links[0]).toEqual({ label: "All services", href: "/our-services" });
    expect(products.id).toBe("products");
    expect(company.id).toBe("company");
  });

  it("drops external links from the company column and ends it with blog and sitemap", () => {
    const company = FOOTER_COLUMNS[3];
    expect(company.links.some((link) => link.external)).toBe(false);
    expect(company.links.slice(-2)).toEqual([BLOG_LINK, { label: "Sitemap", href: "/sitemap" }]);
  });

  it("links the legal pages and carries a tagline", () => {
    expect(LEGAL_LINKS.map((link) => link.href)).toEqual([
      "/privacy-policy",
      "/legal",
      "/cookies",
      "/sitemap",
    ]);
    expect(FOOTER_TAGLINE.length).toBeGreaterThan(0);
  });
});

describe("phone menu", () => {
  it("starts at home and includes the blog", () => {
    expect(MOBILE_SHORTCUTS[0]).toEqual({ label: "Home", href: "/" });
    expect(MOBILE_SHORTCUTS).toContain(BLOG_LINK);
  });
});

describe("menuIndex", () => {
  it("pads one digit to two and leaves longer numbers alone", () => {
    expect(menuIndex(1)).toBe("01");
    expect(menuIndex(9)).toBe("09");
    expect(menuIndex(10)).toBe("10");
    expect(menuIndex(123)).toBe("123");
  });
});

/** Breadcrumb trails and their JSON-LD for CMS list and detail pages. */
import { describe, expect, it } from "vitest";
import {
  crumbsLoader,
  crumbsOf,
  itemCrumbs,
  itemCrumbsJsonLd,
} from "../../../../../src/lib/cms/loaders/crumbs";
import { marketByPath } from "../../../../../src/lib/i18n/markets";

const SITE = "https://site.test";
const enIn = marketByPath("en-in");
if (!enIn) {
  throw new Error("en-in market missing from the registry");
}
const CRUMBS = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
];

describe("crumbsOf", () => {
  it("reads a component's crumbs prop, or none when it is not a list", () => {
    expect(crumbsOf({ crumbs: CRUMBS })).toBe(CRUMBS);
    expect(crumbsOf({})).toEqual([]);
    expect(crumbsOf({ crumbs: "Home > Blog" })).toEqual([]);
  });
});

describe("crumbsLoader", () => {
  it("publishes the list page's crumbs as a BreadcrumbList on the site", async () => {
    const load = await crumbsLoader({
      props: { crumbs: [...CRUMBS, { label: "All posts" }] },
      params: {},
      site: "exyconn",
      market: enIn,
      siteUrl: SITE,
    });
    expect(load?.jsonLd).toEqual([
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
          { "@type": "ListItem", position: 3, name: "All posts" },
        ],
      },
    ]);
  });

  it("publishes an empty trail for a component without crumbs", async () => {
    const load = await crumbsLoader({
      props: {},
      params: {},
      site: "exyconn",
      market: enIn,
      siteUrl: SITE,
    });
    expect(load?.jsonLd?.[0]).toMatchObject({ itemListElement: [] });
  });
});

describe("itemCrumbs", () => {
  it("ends the component's trail with the item itself", () => {
    expect(itemCrumbs({ crumbs: CRUMBS }, "Hello")).toEqual([...CRUMBS, { label: "Hello" }]);
    expect(itemCrumbs({}, "Hello")).toEqual([{ label: "Hello" }]);
  });
});

describe("itemCrumbsJsonLd", () => {
  it("prefixes the links with the market and puts the item at its own URL", () => {
    const url = `${SITE}/en-in/blog/hello`;
    const ld = itemCrumbsJsonLd(
      itemCrumbs({ crumbs: CRUMBS }, "Hello"),
      { market: enIn, siteUrl: SITE },
      url
    );
    expect(ld.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/en-in` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/en-in/blog` },
      { "@type": "ListItem", position: 3, name: "Hello", item: url },
    ]);
  });
});

import { describe, expect, it } from "vitest";
import { DETAIL_COPY } from "../../src/lib/detail/copy";
import { arc, circle, gear, GLYPHS, roundedRect } from "../../src/lib/detail/glyphs";
import {
  detailChapters,
  detailCrumbs,
  detailPath,
  firstSentence,
  relatedPages,
  serviceJsonLd,
  splitPoint,
  tabForKey,
} from "../../src/lib/detail/helpers";
import { DETAIL_LOGOS, LOGO_KEYS, logosFor } from "../../src/lib/detail/logos";
import { DETAIL_PAGES } from "../../src/lib/detail/registry";
import { SERVICE_GLYPH_SHAPE, serviceScene } from "../../src/lib/detail/scenes";
import { defineDetailPage, detailPageSchema } from "../../src/lib/detail/schema";
import { sampleGlyph } from "../../src/scripts/stage3d/shapes/glyph";
import { createRandom } from "../../src/scripts/stage3d/math";

const [agentic] = DETAIL_PAGES;
const service = DETAIL_PAGES.find((page) => page.section === "services")!;

describe("detail page modules", () => {
  it("covers the seven AI capabilities and eight services, once each", () => {
    const keys = DETAIL_PAGES.map((page) => detailPath(page));
    expect(new Set(keys).size).toBe(15);
    expect(DETAIL_PAGES.filter((page) => page.section === "ai")).toHaveLength(7);
    expect(DETAIL_PAGES.filter((page) => page.section === "services")).toHaveLength(8);
  });

  it("gives every page a unique name and an H1 of eight words or fewer", () => {
    expect(new Set(DETAIL_PAGES.map((page) => page.name)).size).toBe(DETAIL_PAGES.length);
    DETAIL_PAGES.forEach((page) => {
      expect(page.hero.title.split(/\s+/).length).toBeLessThanOrEqual(8);
    });
  });

  it("keeps the dropped images out (Tableau, the medium.com 'Gemini')", () => {
    const sources = JSON.stringify(DETAIL_PAGES);
    expect(sources).not.toContain("Tableau_Logo");
    expect(sources).not.toContain("miro.medium.com");
    expect(sources).not.toContain("fa-");
  });

  it("serves server-rendered tabs for agentic (24) and LLMs (3)", () => {
    const tabs = Object.fromEntries(DETAIL_PAGES.map((page) => [page.slug, page.tabs?.items]));
    expect(tabs.agentic).toHaveLength(24);
    expect(tabs.llms?.map((tab) => tab.logo)).toEqual(["openai", "gemini", "claude"]);
  });

  it("re-validates every module against the schema", () => {
    DETAIL_PAGES.forEach((page) => expect(detailPageSchema.parse(page)).toEqual(page));
  });
});

describe("defineDetailPage", () => {
  it("rejects AI pages without an architecture or demo", () => {
    const { architecture, demo, ...rest } = agentic;
    expect(architecture && demo).toBeTruthy();
    expect(() => defineDetailPage(rest)).toThrow(/architecture and a demo/);
  });

  it("rejects long titles, Font Awesome class strings and unknown shapes", () => {
    expect(() =>
      defineDetailPage({
        ...service,
        hero: { ...service.hero, title: "one two three four five six seven eight nine" },
      })
    ).toThrow(/8 words/);
    expect(() =>
      defineDetailPage({ ...service, intro: { ...service.intro, icon: "fa-solid fa-robot" } })
    ).toThrow(/kebab-case/);
    expect(() => defineDetailPage({ ...service, scene: { shapes: ["nope"] } as never })).toThrow(
      /shape ids/
    );
    expect(() => defineDetailPage({ ...service, scene: null as never })).toThrow(/shape ids/);
  });
});

describe("helpers", () => {
  it("builds the breadcrumb with the section's real name", () => {
    expect(detailCrumbs(agentic)).toEqual([
      { label: "Home", href: "/" },
      { label: "AI", href: "/ai" },
      { label: "Agentic AI" },
    ]);
    expect(detailCrumbs(service)[1]).toEqual({ label: "Services", href: "/services" });
  });

  it("splits labelled points and leaves plain ones", () => {
    expect(splitPoint("Example: Basic chatbots")).toEqual({
      term: "Example",
      text: "Basic chatbots",
    });
    expect(splitPoint("Handles text, images: and code")).toEqual({
      text: "Handles text, images: and code",
    });
  });

  it("takes the first sentence", () => {
    expect(firstSentence(" One. Two. ")).toBe("One.");
    expect(firstSentence("No stop")).toBe("No stop");
  });

  it("walks the section for related cards, wrapping round", () => {
    const last = DETAIL_PAGES.filter((page) => page.section === "ai").at(-1)!;
    const cards = relatedPages(DETAIL_PAGES, last);
    expect(cards.map((card) => card.index)).toEqual(["AI/01", "AI/02", "AI/03"]);
    expect(cards[0]).toMatchObject({ href: "/ai/agentic", title: "Agentic AI" });
    expect(relatedPages(DETAIL_PAGES, service, 2)[0].href).toMatch(/^\/services\//);
    expect(relatedPages([service], service)).toEqual([]);
  });

  it("numbers only the chapters a page has", () => {
    expect(detailChapters(agentic)).toEqual({
      intro: 1,
      architecture: 2,
      offerings: 3,
      tabs: 4,
      faq: 5,
      related: 6,
    });
    expect(detailChapters(service)).toEqual({
      intro: 1,
      offerings: 2,
      process: 3,
      faq: 4,
      related: 5,
    });
  });

  it("moves between tabs with the WAI-ARIA keys", () => {
    expect(tabForKey("ArrowRight", 23, 24)).toBe(0);
    expect(tabForKey("ArrowDown", 0, 24)).toBe(1);
    expect(tabForKey("ArrowLeft", 0, 24)).toBe(23);
    expect(tabForKey("ArrowUp", 2, 24)).toBe(1);
    expect(tabForKey("Home", 5, 24)).toBe(0);
    expect(tabForKey("End", 5, 24)).toBe(23);
    expect(tabForKey("Enter", 5, 24)).toBeUndefined();
  });

  it("describes the service for schema.org", () => {
    const ld = serviceJsonLd(service, "https://x.test/en-us/services/a", {
      name: "Org",
      url: "https://x.test",
    });
    expect(ld).toMatchObject({ "@type": "Service", name: service.name, serviceType: "Services" });
    expect(ld.provider).toEqual({ "@type": "Organization", name: "Org", url: "https://x.test" });
    expect(ld.hasOfferCatalog.itemListElement).toHaveLength(service.offerings.items.length);
  });
});

describe("copy, logos and scenes", () => {
  it("formats the template's own words", () => {
    expect(DETAIL_COPY.faqTitle("MCP server")).toBe("Questions about MCP server");
    expect(DETAIL_COPY.ctaTitle("AI workflows")).toBe("Start with AI workflows");
    expect(DETAIL_COPY.tabs.position(3, 24)).toBe("03 / 24");
  });

  it("resolves logo keys with their intrinsic size", () => {
    expect(logosFor(["openai"])).toEqual([DETAIL_LOGOS.openai]);
    LOGO_KEYS.forEach((key) => expect(DETAIL_LOGOS[key].width).toBeGreaterThan(0));
  });

  it("builds a service scene that re-forms into the service's glyph", () => {
    const scene = serviceScene("ops", "cog");
    expect(scene.shapes[0]).toBe("ops");
    expect(scene.shapes[SERVICE_GLYPH_SHAPE]).toBe("glyph");
    expect(scene.data?.glyph?.paths).toBe(GLYPHS.cog);
  });
});

describe("glyphs", () => {
  const inBounds = (path: readonly (readonly [number, number])[]) =>
    path.every(([x, y]) => Math.abs(x) <= 1 && Math.abs(y) <= 1);

  it("draws arcs, circles, rounded boxes and cogs as closed or open polylines", () => {
    expect(arc(0, 0, 1, 0, Math.PI, 2)).toEqual([
      [1, 0],
      [0, 1],
      [-1, 0],
    ]);
    const ring = circle(0, 0, 0.5);
    expect(ring[0]).toEqual(ring.at(-1));
    const box = roundedRect(-1, -1, 1, 1, 0.2);
    expect(box[0]).toEqual(box.at(-1));
    expect(inBounds(box)).toBe(true);
    const cog = gear(0, 0, 0.9, 0.7, 8);
    expect(cog).toHaveLength(8 * 4 + 1);
  });

  it("keeps every glyph inside the unit square and samples it", () => {
    Object.values(GLYPHS).forEach((paths) => {
      paths.forEach((path) => {
        expect(path.length).toBeGreaterThanOrEqual(2);
        expect(inBounds(path)).toBe(true);
      });
      const cloud = sampleGlyph(200, createRandom(1), { paths });
      expect(cloud.positions).toHaveLength(600);
    });
  });
});

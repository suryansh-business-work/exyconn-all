/** The human sitemap: portal links by category, else the site's own routes with AI services. */
import { describe, expect, it } from "vitest";
import {
  pageCount,
  SITE_ROUTES,
  sitemapSections,
  treeBranches,
  type SitemapSection,
} from "../../../../src/lib/content/sitemap";
import type { NavLink } from "../../../../src/lib/portal/types";

const nav = (label: string, href: string, category: string, description = ""): NavLink => ({
  id: label,
  label,
  href,
  description,
  category,
  keywords: "",
});

describe("sitemapSections from the portal", () => {
  it("groups safe links by category in first-seen order", () => {
    const sections = sitemapSections(
      [
        nav("Home", "/", "General", "Start here"),
        nav("Agents", "/ai/agentic", "AI"),
        nav("Evil", "javascript:alert(1)", "AI"),
        nav("About", "/about-us", "General"),
        nav("Blank", "   ", "Other"),
      ],
      [{ label: "Ignored", href: "/ai-services/x" }]
    );
    expect(sections).toEqual([
      {
        label: "General",
        links: [
          { label: "Home", href: "/", description: "Start here" },
          { label: "About", href: "/about-us", description: undefined },
        ],
      },
      { label: "AI", links: [{ label: "Agents", href: "/ai/agentic", description: undefined }] },
    ]);
  });
});

describe("sitemapSections from the site's routes", () => {
  it("falls back to the routes with the AI service pages after their hub", () => {
    const services = [{ label: "Chatbots", href: "/ai-services/chatbots" }];
    const sections = sitemapSections([], services);
    const aiServices = sections.find((section) => section.label === "AI services");
    expect(aiServices?.links).toEqual([
      { label: "All AI services", href: "/ai-services" },
      ...services,
    ]);
    expect(sections.map((s) => s.label)).toEqual(SITE_ROUTES.map((s) => s.label));
  });

  it("copies the routes instead of handing out the shared lists", () => {
    const sections = sitemapSections([], []);
    expect(sections).toEqual(SITE_ROUTES);
    sections[0].links.push({ label: "Mutated", href: "/x" });
    expect(SITE_ROUTES[0].links.some((link) => link.label === "Mutated")).toBe(false);
  });

  it("serves every route once and never the retired products page", () => {
    const hrefs = SITE_ROUTES.flatMap((section) => section.links.map((link) => link.href));
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs).not.toContain("/our-products");
    expect(hrefs.every((href) => href.startsWith("/"))).toBe(true);
  });

  it("falls back to the routes when every portal link is unsafe", () => {
    expect(sitemapSections([nav("Evil", "javascript:x", "AI")], [])).toEqual(SITE_ROUTES);
  });
});

describe("treeBranches and pageCount", () => {
  const section = (count: number): SitemapSection => ({
    label: `S${count}`,
    links: Array.from({ length: count }, (_, i) => ({ label: `L${i}`, href: `/l${i}` })),
  });

  it("feeds the tree at most 12 sections of at most 24 pages", () => {
    expect(treeBranches([section(3), section(30)])).toEqual([3, 24]);
    expect(treeBranches(Array.from({ length: 14 }, () => section(1)))).toHaveLength(12);
    expect(treeBranches([])).toEqual([]);
  });

  it("counts every page across sections", () => {
    expect(pageCount([section(3), section(30)])).toBe(33);
    expect(pageCount([])).toBe(0);
  });
});

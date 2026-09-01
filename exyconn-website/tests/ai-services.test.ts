/**
 * AI service catalogue integrity.
 *
 * The home page, the /ai-services listing, each detail page and the sitemap all
 * read from this one catalogue, so a malformed entry breaks several surfaces at
 * once — including the meta tags. These tests pin the shape.
 */
import { describe, it, expect } from "vitest";
import {
  aiServices,
  aiServiceCategories,
  servicesInCategory,
  findAiService,
  findAiServiceCategory,
} from "../src/lib/services/aiServices";

describe("AI service catalogue", () => {
  it("has every category populated", () => {
    expect(aiServiceCategories.length).toBeGreaterThan(0);
    for (const category of aiServiceCategories) {
      expect(servicesInCategory(category.slug).length).toBeGreaterThan(0);
    }
  });

  it("assigns every service to a real category", () => {
    const categorySlugs = new Set(aiServiceCategories.map((category) => category.slug));
    for (const service of aiServices) {
      expect(categorySlugs.has(service.categorySlug)).toBe(true);
    }
  });

  it("leaves no service outside a category listing", () => {
    const grouped = aiServiceCategories.flatMap((category) => servicesInCategory(category.slug));
    expect(grouped).toHaveLength(aiServices.length);
  });

  it("has unique service slugs", () => {
    const slugs = aiServices.map((service) => service.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has unique category slugs", () => {
    const slugs = aiServiceCategories.map((category) => category.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses URL-safe slugs", () => {
    for (const service of aiServices) {
      expect(service.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("has unique service titles", () => {
    const titles = aiServices.map((service) => service.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  describe.each(aiServices.map((service) => [service.title, service] as const))(
    "%s",
    (_title, service) => {
      it("has a card summary short enough not to break the grid", () => {
        expect(service.summary.length).toBeGreaterThanOrEqual(30);
        expect(service.summary.length).toBeLessThanOrEqual(130);
      });

      it("has a detail description with real substance", () => {
        expect(service.description.length).toBeGreaterThanOrEqual(150);
      });

      it("lists concrete outcomes", () => {
        expect(service.outcomes.length).toBeGreaterThanOrEqual(3);
        for (const outcome of service.outcomes) {
          expect(outcome.trim().length).toBeGreaterThan(10);
        }
      });

      it("carries the icon and gradient the cards render", () => {
        expect(service.icon).toMatch(/^fa-[a-z0-9-]+$/);
        expect(service.color).toMatch(/^from-[a-z]+-\d{2,3} to-[a-z]+-\d{2,3}$/);
      });

      it("is findable by slug", () => {
        expect(findAiService(service.slug)).toBe(service);
      });
    },
  );

  it("returns undefined for unknown lookups, so detail pages can 404", () => {
    expect(findAiService("not-a-real-service")).toBeUndefined();
    expect(findAiServiceCategory("not-a-real-category")).toBeUndefined();
  });
});

/** sitemap.xml's page list, the 404 page's routes and the article JSON-LD. */
import { describe, expect, it } from "vitest";
import { NOT_FOUND_COPY, NOT_FOUND_LINKS } from "../../../../src/lib/content/not-found";
import { sitePages } from "../../../../src/lib/content/site-pages";
import { SITE_ROUTES } from "../../../../src/lib/content/sitemap";
import { articleJsonLd } from "../../../../src/lib/content/structured-data";

describe("sitePages", () => {
  it("starts at home and lists the AI service pages right after their hub", () => {
    const pages = sitePages(["/ai-services/chatbots", "/ai-services/voice"]);
    expect(pages[0]).toBe("");
    const hub = pages.indexOf("/ai-services");
    expect(pages.slice(hub, hub + 3)).toEqual([
      "/ai-services",
      "/ai-services/chatbots",
      "/ai-services/voice",
    ]);
    expect(pages.at(-1)).toBe("/order-agents");
  });

  it("lists every page once", () => {
    const pages = sitePages([]);
    expect(new Set(pages).size).toBe(pages.length);
    expect(pages.filter((page) => page !== "").every((page) => page.startsWith("/"))).toBe(true);
  });
});

describe("404 page", () => {
  it("links only to routes the site serves", () => {
    const served = new Set(SITE_ROUTES.flatMap((s) => s.links.map((link) => link.href)));
    for (const href of [
      ...NOT_FOUND_LINKS.map((link) => link.href),
      NOT_FOUND_COPY.primary.href,
      NOT_FOUND_COPY.secondary.href,
      NOT_FOUND_COPY.ctaPrimary.href,
    ]) {
      expect(served.has(href), href).toBe(true);
    }
  });
});

describe("articleJsonLd", () => {
  const publisher = {
    name: "Exyconn",
    url: "https://exyconn.com",
    logo: "https://exyconn.com/f.svg",
  };

  it("describes a post by a person with its image, section and keywords", () => {
    expect(
      articleJsonLd({
        type: "BlogPosting",
        headline: "H",
        description: "D",
        image: "https://exyconn.com/a.png",
        published: "2026-09-03",
        url: "https://exyconn.com/en-in/blog/h",
        keywords: ["AI", "Agents"],
        section: "AI",
        author: "Ada",
        publisher,
      })
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: "H",
      description: "D",
      image: "https://exyconn.com/a.png",
      datePublished: "2026-09-03",
      dateModified: "2026-09-03",
      articleSection: "AI",
      author: { "@type": "Person", name: "Ada" },
      publisher: {
        "@type": "Organization",
        name: "Exyconn",
        logo: { "@type": "ImageObject", url: "https://exyconn.com/f.svg" },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": "https://exyconn.com/en-in/blog/h" },
      url: "https://exyconn.com/en-in/blog/h",
      keywords: "AI, Agents",
    });
  });

  it("credits the organisation and omits an empty image and section", () => {
    const ld = articleJsonLd({
      type: "Article",
      headline: "H",
      description: "D",
      image: "",
      published: "2026-09-03",
      url: "https://exyconn.com/en-us/case-studies/h",
      keywords: [],
      section: "",
      publisher,
    });
    expect(ld).not.toHaveProperty("image");
    expect(ld).not.toHaveProperty("articleSection");
    expect(ld.author).toEqual({
      "@type": "Organization",
      name: "Exyconn",
      url: "https://exyconn.com",
    });
    expect(ld.keywords).toBe("");
  });
});

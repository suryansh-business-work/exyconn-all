import { describe, expect, it } from "vitest";
import { slugify, withHeadingIds } from "../../../../src/lib/inner/headings";

describe("heading slugs", () => {
  it("lower-cases, strips accents and joins words with single dashes", () => {
    expect(slugify("Héllo Wörld!")).toBe("hello-world");
    expect(slugify("  AI & ML: 2026  ")).toBe("ai-ml-2026");
    expect(slugify("ﬁle")).toBe("file");
  });

  it("falls back to 'section' when nothing URL-safe is left", () => {
    expect(slugify("!!!")).toBe("section");
    expect(slugify("Россия")).toBe("section");
    expect(slugify("")).toBe("section");
  });
});

describe("article headings", () => {
  it("gives h2 and h3 headings ids and lists them as the table of contents", () => {
    const { html, toc } = withHeadingIds(
      '<h2>Why it matters</h2><p>Text</p><h3 class="sub">How &amp; <em>when</em></h3>'
    );

    expect(html).toBe(
      '<h2 id="why-it-matters">Why it matters</h2><p>Text</p>' +
        '<h3 id="how-when" class="sub">How &amp; <em>when</em></h3>'
    );
    expect(toc).toEqual([
      { id: "why-it-matters", label: "Why it matters", level: 2 },
      { id: "how-when", label: "How & when", level: 3 },
    ]);
  });

  it("numbers repeated headings so every id is unique", () => {
    const { toc } = withHeadingIds("<h2>Pricing</h2><h2>Pricing</h2><H3>Pricing</H3>");
    expect(toc.map((entry) => entry.id)).toEqual(["pricing", "pricing-2", "pricing-3"]);
  });

  it("keeps an id a heading already has, and avoids it for later headings", () => {
    const source = "<h2 id='intro'>Start here</h2><h2>Intro</h2>";
    const { html, toc } = withHeadingIds(source);

    expect(html).toBe("<h2 id='intro'>Start here</h2><h2 id=\"intro-2\">Intro</h2>");
    expect(toc).toEqual([
      { id: "intro", label: "Start here", level: 2 },
      { id: "intro-2", label: "Intro", level: 2 },
    ]);
  });

  it("turns non-breaking spaces into spaces in the label", () => {
    expect(withHeadingIds("<h2>Next&nbsp;steps</h2>").toc[0].label).toBe("Next steps");
  });

  it("leaves other headings and a body without headings alone", () => {
    const source = "<h1>Title</h1><h4>Small</h4><p>Body</p>";
    expect(withHeadingIds(source)).toEqual({ html: source, toc: [] });
  });
});

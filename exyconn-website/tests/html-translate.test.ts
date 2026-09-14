import { describe, expect, it } from "vitest";
import { collectStrings, translateHtml } from "../src/lib/i18n/html-translate";

/** A catalogue that shouts, so a translated run is obvious in the output. */
const shout = (source: string) => source.toUpperCase();

describe("finding what to translate", () => {
  it("reads the words a person sees, and nothing else", () => {
    const html = `
      <main class="hero">
        <h1>Build with Exyconn</h1>
        <p>AI that works.</p>
        <script>const copy = "not this";</script>
        <style>.a { content: "nor this"; }</style>
        <span>—</span>
        <span>42</span>
      </main>`;

    expect(collectStrings(html).sort()).toEqual(["AI that works.", "Build with Exyconn"]);
  });

  it("reads the attributes a person sees", () => {
    const html =
      '<img src="/a.png" alt="A laptop on a desk"><button aria-label="Open the menu"></button>';

    expect(collectStrings(html).sort()).toEqual(["A laptop on a desk", "Open the menu"]);
  });

  it("reads the meta tags a search result shows, and leaves the machine ones alone", () => {
    const html = [
      '<meta name="description" content="Exyconn builds AI systems.">',
      '<meta property="og:title" content="Exyconn">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<meta name="theme-color" content="#4f46e5">',
    ].join("");

    expect(collectStrings(html).sort()).toEqual(["Exyconn", "Exyconn builds AI systems."]);
  });
});

describe("translating a rendered page", () => {
  it("replaces the words and leaves the markup exactly as it was", () => {
    const html = '<p class="lead" data-x="1">Hello there</p>';

    expect(translateHtml(html, shout)).toBe('<p class="lead" data-x="1">HELLO THERE</p>');
  });

  it("keeps the spacing around a run, which is what holds a sentence apart", () => {
    const html = "<p>\n  Hello there\n</p>";

    expect(translateHtml(html, shout)).toBe("<p>\n  HELLO THERE\n</p>");
  });

  it("never touches a script, a style or code", () => {
    const html =
      '<script type="application/ld+json">{"name":"Exyconn"}</script>' +
      "<style>.a::after{content:'x'}</style>" +
      "<pre>keep me</pre><code>also me</code>";

    expect(translateHtml(html, shout)).toBe(html);
  });

  it("leaves a run the catalogue has no answer for in English", () => {
    const html = "<p>Hello</p><p>Goodbye</p>";
    const only = (source: string) => (source === "Hello" ? "Hola" : undefined);

    expect(translateHtml(html, only)).toBe("<p>Hola</p><p>Goodbye</p>");
  });

  it("translates the attributes a person reads and nothing else in the tag", () => {
    const html = '<img src="/a.png" class="w-full" alt="A laptop" loading="lazy">';

    expect(translateHtml(html, shout)).toBe(
      '<img src="/a.png" class="w-full" alt="A LAPTOP" loading="lazy">'
    );
  });

  it("leaves numbers, symbols and single characters alone", () => {
    const html = "<span>42</span><span>—</span><span>₹</span><span>&amp;</span>";

    expect(translateHtml(html, shout)).toBe(html);
  });

  it("survives a stray angle bracket in prose", () => {
    const html = "<p>5 < 6 is true</p>";

    expect(translateHtml(html, (s) => s.replace("is true", "IS TRUE"))).toContain("IS TRUE");
  });
});

describe('a subtree the page asked us to leave alone', () => {
  it('skips everything inside translate="no", however deeply nested', () => {
    const html =
      '<p>Hello</p><div translate="no"><ul><li><a>Italia - Italiano</a></li>' +
      "<li><div>Россия - Русский</div></li></ul></div><p>Goodbye</p>";

    expect(translateHtml(html, shout)).toBe(
      '<p>HELLO</p><div translate="no"><ul><li><a>Italia - Italiano</a></li>' +
        "<li><div>Россия - Русский</div></li></ul></div><p>GOODBYE</p>"
    );
  });

  it('does not offer its strings for translation either', () => {
    const html = '<p>Hello</p><nav translate="no"><a>España - Español</a></nav>';

    expect(collectStrings(html)).toEqual(["Hello"]);
  });
});

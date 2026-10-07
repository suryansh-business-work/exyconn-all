import { describe, expect, it } from "vitest";
import { collectStrings, translateHtml } from "../../../../src/lib/i18n/html-translate";

/** A catalogue that shouts, so every translated run is obvious in the output. */
const shout = (source: string) => source.toUpperCase();

describe("collecting the strings on a page", () => {
  it("lists each translatable run once, from text and from the attributes a reader sees", () => {
    const html =
      '<h1>Hello</h1><p>Hello</p><img alt="A laptop" title="Desk">' +
      '<input placeholder="Your email"><button aria-label="Open menu"></button>';

    expect(collectStrings(html)).toEqual(["Hello", "A laptop", "Desk", "Your email", "Open menu"]);
  });

  it("skips runs without a letter, single characters and lone entities", () => {
    expect(collectStrings("<p>42</p><p>a</p><p>&nbsp;</p><p>&copy;</p><p> — </p>")).toEqual([]);
  });

  it("reads meta content only on the tags a person reads", () => {
    const html =
      '<meta name="description" content="We build AI">' +
      '<meta property="og:title" content="Exyconn">' +
      '<meta name="viewport" content="width=device-width">' +
      '<meta charset="utf-8" content="Not a named meta">' +
      '<div content="Not a meta tag"></div>';

    expect(collectStrings(html)).toEqual(["We build AI", "Exyconn"]);
  });
});

describe("translating a page", () => {
  it("replaces text runs and keeps the whitespace around them", () => {
    expect(translateHtml("<p>\n  Hello there\n</p>", shout)).toBe("<p>\n  HELLO THERE\n</p>");
  });

  it("translates text after the last tag and a page with no tags at all", () => {
    expect(translateHtml("<b>Hi</b> there", shout)).toBe("<b>HI</b> THERE");
    expect(translateHtml("Just words", shout)).toBe("JUST WORDS");
  });

  it("keeps a run, or an attribute, the catalogue has no answer for", () => {
    const only = (source: string) => (source === "Hello" ? "Hola" : undefined);
    expect(translateHtml('<p>Hello</p><p>Bye</p><img alt="Laptop">', only)).toBe(
      '<p>Hola</p><p>Bye</p><img alt="Laptop">'
    );
  });

  it("translates attributes in the author's quoting and leaves untranslatable values", () => {
    const html = "<img src='/a.png' alt='A laptop' title='1'>";
    expect(translateHtml(html, shout)).toBe("<img src='/a.png' alt='A LAPTOP' title='1'>");
  });

  it("translates the content of a reader-facing meta tag", () => {
    expect(translateHtml('<meta name="Twitter:Title" content="Exyconn AI">', shout)).toBe(
      '<meta name="Twitter:Title" content="EXYCONN AI">'
    );
  });

  it("copies scripts, styles, code and svg through untouched, in any case", () => {
    const html =
      '<SCRIPT>const words = "keep me";</SCRIPT><style>.a{content:"x y"}</style>' +
      "<pre>keep me</pre><code>and me</code><svg><text>label</text></svg><p>Done</p>";

    expect(translateHtml(html, shout)).toBe(html.replace("Done", "DONE"));
  });

  it("copies the rest of the page when an opaque element is never closed", () => {
    expect(translateHtml("<p>Top</p><script>never closed", shout)).toBe(
      "<p>TOP</p><script>never closed"
    );
  });

  it("treats a stray closing tag of an opaque element as an ordinary tag", () => {
    expect(translateHtml("<p>Hi</p></code><p>Yo</p>", shout)).toBe("<p>HI</p></code><p>YO</p>");
  });

  it("does not translate the text inside a comment", () => {
    expect(translateHtml("<!-- note to self --><p>Shown</p>", shout)).toBe(
      "<!-- note to self --><p>SHOWN</p>"
    );
  });

  it("reads a lone '<' in a sentence as text, not as a tag", () => {
    expect(translateHtml("<p>if 5 < 6 then yes</p>", shout)).toBe("<p>IF 5 < 6 THEN YES</p>");
    expect(translateHtml("a < b", shout)).toBe("A < B");
  });

  it("copies a tag that never closes as it is", () => {
    expect(translateHtml("<p>Hello</p><b class", shout)).toBe("<p>HELLO</p><b class");
  });
});

describe('elements marked translate="no"', () => {
  it("leaves the whole element, nested ones included, and carries on after it", () => {
    const html = '<div translate="no"><div>Россия - Русский</div>Deutsch</div><p>After</p>';

    expect(translateHtml(html, shout)).toBe(
      '<div translate="no"><div>Россия - Русский</div>Deutsch</div><p>AFTER</p>'
    );
  });

  it("accepts the attribute unquoted and in any case", () => {
    expect(translateHtml("<span TRANSLATE=no>Keep</span> <b>Go</b>", shout)).toBe(
      "<span TRANSLATE=no>Keep</span> <b>GO</b>"
    );
  });

  it("leaves the rest of the page when the element is never closed", () => {
    expect(translateHtml('<div translate="no"><p>Keep</p>', shout)).toBe(
      '<div translate="no"><p>Keep</p>'
    );
  });
});

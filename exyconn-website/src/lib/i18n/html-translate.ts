/**
 * Translates a rendered page.
 *
 * The alternative was wrapping some two thousand strings across ninety-odd `.astro` files in
 * `t()` by hand, leaving every new page one forgotten call away from being half-English —
 * and still not translating a word of the blog, which comes from the portal at request time.
 * Translating the HTML instead means everything the reader sees goes through the same
 * catalogue: the site's own copy, the branding, and the content.
 *
 * What it will not touch: scripts, styles, code and pre blocks, and anything without a letter
 * in it. Markup is preserved exactly — only text nodes and a named few attributes are
 * replaced, so a translation can never break the page's structure.
 */

/** Elements whose text is not prose. Their contents are copied through untouched. */
const OPAQUE = new Set(["script", "style", "pre", "code", "textarea", "noscript", "svg"]);

/**
 * The standard way a page says "leave this alone" — `<div translate="no">`.
 *
 * The market picker is the reason it exists here: every market names itself in its own
 * language, so "Россия - Русский" must survive a page being read in Spanish.
 */
const NO_TRANSLATE = /\stranslate\s*=\s*["']?no["']?/i;

/** Attributes a reader sees. `content` is handled separately — only on the meta tags below. */
const TEXT_ATTRIBUTES = ["alt", "title", "placeholder", "aria-label"];

/** The meta tags whose `content` is read by a person (in a search result or a shared card). */
const TRANSLATED_META = new Set([
  "description",
  "og:title",
  "og:description",
  "og:image:alt",
  "twitter:title",
  "twitter:description",
  "twitter:image:alt",
  "apple-mobile-web-app-title",
]);

/** Anything with a letter in it. A price, an icon or a bullet is left as it is. */
const HAS_LETTER = /\p{L}/u;

/** One text run and the whitespace around it, so the translation keeps the page's spacing. */
const TEXT_PARTS = /^(\s*)([\s\S]*?)(\s*)$/;

/**
 * What may follow a `<` for it to open a tag: a name, a closing slash, a comment or a
 * processing instruction. Anything else — "5 < 6" in a sentence — is just text, and reading
 * it as a tag would swallow the rest of the paragraph.
 */
const TAG_START = /[a-zA-Z!/?]/;

export type Lookup = (source: string) => string | undefined;

/** Every translatable string on a page, so they can be fetched — or ordered — in one go. */
export function collectStrings(html: string): string[] {
  const found = new Set<string>();
  walk(html, (text) => {
    found.add(text);
    return undefined;
  });
  return [...found];
}

/** The page with every string the catalogue knows replaced, and everything else untouched. */
export function translateHtml(html: string, lookup: Lookup): string {
  return walk(html, lookup);
}

/** True for a text run worth translating: it has a letter and is not a lone entity. */
function translatable(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length > 1 && HAS_LETTER.test(trimmed) && !/^&[a-z]+;$/i.test(trimmed);
}

/** Replaces one attribute's value in a tag, leaving the quoting style as the author wrote it. */
function replaceAttribute(tag: string, name: string, replace: Lookup): string {
  const pattern = new RegExp(`(\\s${name}\\s*=\\s*)(["'])([^"']*)\\2`, "i");
  return tag.replace(pattern, (whole, prefix: string, quote: string, value: string) => {
    if (!translatable(value)) {
      return whole;
    }
    const translated = replace(value);
    return translated === undefined ? whole : `${prefix}${quote}${translated}${quote}`;
  });
}

/** The `name`/`property` a meta tag carries, lower-cased; empty for any other tag. */
function metaKey(tag: string): string {
  const match = /\s(?:name|property)\s*=\s*["']([^"']+)["']/i.exec(tag);
  return match ? match[1].toLowerCase() : "";
}

function translateTag(tag: string, lookup: Lookup): string {
  let out = tag;
  for (const attribute of TEXT_ATTRIBUTES) {
    out = replaceAttribute(out, attribute, lookup);
  }
  if (/^<meta\b/i.test(tag) && TRANSLATED_META.has(metaKey(tag))) {
    out = replaceAttribute(out, "content", lookup);
  }
  return out;
}

/**
 * Walks the document once, handing every translatable run to `lookup` and rebuilding it.
 *
 * A hand-rolled scanner rather than a DOM: the page is rendered HTML that has to come out
 * byte-identical apart from the runs that were translated, and a parse-and-serialise round
 * trip through any library rewrites quoting, self-closing tags and entities along the way.
 */
function walk(html: string, lookup: Lookup): string {
  let out = "";
  let index = 0;

  while (index < html.length) {
    let start = html.indexOf("<", index);
    while (start >= 0 && !TAG_START.test(html.charAt(start + 1))) {
      start = html.indexOf("<", start + 1);
    }
    if (start < 0) {
      out += translateText(html.slice(index), lookup);
      break;
    }
    out += translateText(html.slice(index, start), lookup);

    const end = html.indexOf(">", start);
    if (end < 0) {
      // A stray "<" in text, not a tag.
      out += html.slice(start);
      break;
    }
    const tag = html.slice(start, end + 1);
    const name = /^<\/?\s*([a-z0-9-]+)/i.exec(tag)?.[1]?.toLowerCase() ?? "";

    if (!tag.startsWith("</") && NO_TRANSLATE.test(tag)) {
      const stop = endOfElement(html, name, end + 1);
      out += html.slice(start, stop);
      index = stop;
      continue;
    }

    if (OPAQUE.has(name) && !tag.startsWith("</")) {
      const closing = `</${name}`;
      const closeAt = html.toLowerCase().indexOf(closing, end);
      const stop = closeAt < 0 ? html.length : html.indexOf(">", closeAt) + 1;
      out += html.slice(start, stop);
      index = stop;
      continue;
    }

    out += translateTag(tag, lookup);
    index = end + 1;
  }
  return out;
}

/**
 * Where an element ends, counting its own kind so a nested one does not close it early.
 *
 * Only needed for a subtree that is being skipped whole; everything else is handled tag by
 * tag, which is what keeps this a scanner rather than a parser.
 */
function endOfElement(html: string, name: string, from: number): number {
  const open = new RegExp(`<${name}[\\s/>]`, "gi");
  const close = new RegExp(`</${name}\\s*>`, "gi");
  let depth = 1;
  let cursor = from;
  while (depth > 0) {
    close.lastIndex = cursor;
    const closing = close.exec(html);
    if (!closing) {
      return html.length;
    }
    open.lastIndex = cursor;
    let nested = open.exec(html);
    while (nested && nested.index < closing.index) {
      depth += 1;
      open.lastIndex = nested.index + 1;
      nested = open.exec(html);
    }
    depth -= 1;
    cursor = closing.index + closing[0].length;
  }
  return cursor;
}

/** One text run: the whitespace around it is kept, the words between go to the catalogue. */
function translateText(text: string, lookup: Lookup): string {
  if (text === "" || !translatable(text)) {
    return text;
  }
  const [, before = "", body = "", after = ""] = TEXT_PARTS.exec(text) ?? [];
  const translated = lookup(body);
  return translated === undefined ? text : `${before}${translated}${after}`;
}

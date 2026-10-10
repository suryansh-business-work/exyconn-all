/**
 * Gives an article body's h2/h3 headings stable ids and returns them as TOC entries, so a
 * portal-written article gets an "On this page" list without anyone adding anchors by hand.
 * Runs on sanitised HTML; an id a heading already has is kept.
 */
import { stripTags, trimLeading, trimTrailing } from "../text-trim";

export interface TocEntry {
  id: string;
  label: string;
  level: 2 | 3;
}

const HEADING = /<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi;
const ID_ATTR = /\sid\s*=\s*["']([^"']+)["']/i;

const dashed = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replaceAll(/[̀-ͯ]/g, "")
    .replaceAll(/[^a-z\d]+/g, "-");

export const slugify = (text: string): string =>
  trimLeading(trimTrailing(dashed(text), "-"), "-") || "section";

const textOf = (html: string): string =>
  stripTags(html).replaceAll("&amp;", "&").replaceAll("&nbsp;", " ").trim();

export const withHeadingIds = (html: string): { html: string; toc: TocEntry[] } => {
  const toc: TocEntry[] = [];
  const used = new Set<string>();
  const out = html.replaceAll(
    HEADING,
    (whole, level: string, matchedAttrs: string | undefined, inner: string) => {
      const attrs = matchedAttrs ?? "";
      const label = textOf(inner);
      const existing = ID_ATTR.exec(attrs)?.[1];
      let id = existing ?? slugify(label);
      let n = 2;
      while (!existing && used.has(id)) {
        id = `${slugify(label)}-${n}`;
        n += 1;
      }
      used.add(id);
      toc.push({ id, label, level: level === "2" ? 2 : 3 });
      return existing ? whole : `<h${level} id="${id}"${attrs}>${inner}</h${level}>`;
    }
  );
  return { html: out, toc };
};

/**
 * Gives an article body's h2/h3 headings stable ids and returns them as TOC entries, so a
 * portal-written article gets an "On this page" list without anyone adding anchors by hand.
 * Runs on sanitised HTML; an id a heading already has is kept.
 */
export interface TocEntry {
  id: string;
  label: string;
  level: 2 | 3;
}

const HEADING = /<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi;
const ID_ATTR = /\sid\s*=\s*["']([^"']+)["']/i;

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replaceAll(/[̀-ͯ]/g, "")
    .replaceAll(/[^a-z\d]+/g, "-")
    .replaceAll(/^-+|-+$/g, "") || "section";

const textOf = (html: string): string =>
  html
    .replaceAll(/<[^>]*>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&nbsp;", " ")
    .trim();

export const withHeadingIds = (html: string): { html: string; toc: TocEntry[] } => {
  const toc: TocEntry[] = [];
  const used = new Set<string>();
  const out = html.replaceAll(HEADING, (whole, level: string, attrs = "", inner: string) => {
    const label = textOf(inner);
    const existing = ID_ATTR.exec(attrs)?.[1];
    let id = existing ?? slugify(label);
    for (let n = 2; !existing && used.has(id); n += 1) {
      id = `${slugify(label)}-${n}`;
    }
    used.add(id);
    toc.push({ id, label, level: level === "2" ? 2 : 3 });
    return existing ? whole : `<h${level} id="${id}"${attrs}>${inner}</h${level}>`;
  });
  return { html: out, toc };
};

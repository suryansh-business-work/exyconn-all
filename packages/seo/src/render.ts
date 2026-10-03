import { escapeAttribute, escapeText } from './escape';
import type { HeadTag, PageMeta } from './types';
import { toTagList } from './tags';

function attributes(attrs: Readonly<Record<string, string>>): string {
  return Object.entries(attrs)
    .map(([name, value]) => `${name}="${escapeAttribute(value)}"`)
    .join(' ');
}

/** One tag as HTML. JSON-LD is already escaped by `toTagList`, so it is printed as is. */
export function renderTag(tag: HeadTag): string {
  switch (tag.kind) {
    case 'title':
      return `<title>${escapeText(tag.text)}</title>`;
    case 'meta':
      return `<meta ${attributes(tag.attrs)}>`;
    case 'link':
      return `<link ${attributes(tag.attrs)}>`;
    case 'jsonld':
      return `<script type="application/ld+json">${tag.json}</script>`;
  }
}

/** The page's head tags as escaped HTML, one tag per line, in `toTagList` order. */
export function renderHead(meta: PageMeta, separator = '\n'): string {
  return toTagList(meta).map(renderTag).join(separator);
}

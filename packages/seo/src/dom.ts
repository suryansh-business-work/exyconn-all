import type { HeadTag } from './types';

/**
 * Every element `toTagList` can produce except `<title>` (which `document.title` owns).
 * Matching by meaning rather than by a marker attribute lets a client take over the tags a
 * server or prerender printed without the two having to agree on anything extra.
 */
export const MANAGED_HEAD_SELECTOR = [
  'meta[name="description"]',
  'meta[name="keywords"]',
  'meta[name="robots"]',
  'meta[name="theme-color"]',
  'meta[property^="og:"]',
  'meta[name^="twitter:"]',
  'link[rel="canonical"]',
  'link[rel="alternate"][hreflang]',
  'script[type="application/ld+json"]',
].join(', ');

function createElement(doc: Document, tag: Exclude<HeadTag, { kind: 'title' }>): HTMLElement {
  if (tag.kind === 'jsonld') {
    const script = doc.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = tag.json;
    return script;
  }
  const element = doc.createElement(tag.kind);
  for (const [name, value] of Object.entries(tag.attrs)) {
    element.setAttribute(name, value);
  }
  return element;
}

/**
 * Replaces the document's page meta with `tags` — what a single-page app calls on every
 * route change so the live head matches what the server would have printed for that URL.
 */
export function applyHeadTags(doc: Document, tags: readonly HeadTag[]): void {
  for (const element of doc.head.querySelectorAll(MANAGED_HEAD_SELECTOR)) {
    element.remove();
  }
  for (const tag of tags) {
    if (tag.kind === 'title') {
      doc.title = tag.text;
    } else {
      doc.head.appendChild(createElement(doc, tag));
    }
  }
}

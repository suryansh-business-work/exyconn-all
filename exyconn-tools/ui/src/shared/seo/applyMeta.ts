/**
 * Runtime (client-side) application of meta tags for SPA navigation.
 * The prerenderer bakes the same tags into static HTML for crawlers; this
 * keeps them correct when users navigate between tools client-side.
 */
import type { BuiltMeta } from './buildMeta';

function upsertMeta(attr: 'name' | 'property', key: string, content: string): Element {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
  return el;
}

function upsertCanonical(href: string): Element {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
  return el;
}

const JSONLD_ID = 'exyconn-tool-jsonld';

export function applyMeta(meta: BuiltMeta): void {
  document.title = meta.title;
  upsertMeta('name', 'description', meta.description);
  upsertMeta('name', 'keywords', meta.keywords);
  upsertCanonical(meta.canonical);
  Object.entries(meta.ogTags).forEach(([key, value]) => upsertMeta('property', key, value));
  Object.entries(meta.twitterTags).forEach(([key, value]) => upsertMeta('name', key, value));

  let script = document.getElementById(JSONLD_ID) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = JSONLD_ID;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(meta.jsonLd);
}

/** Remove the per-tool JSON-LD when leaving a tool page. */
export function clearToolJsonLd(): void {
  document.getElementById(JSONLD_ID)?.remove();
}

// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { applyHeadTags, toTagList, type PageMeta } from '../../src';

const page = (slug: string): PageMeta => ({
  title: `Tool ${slug}`,
  description: `About ${slug}`,
  canonical: `https://tools.exyconn.com/tools/${slug}`,
  image: { url: 'https://tools.exyconn.com/og.png', width: 1200, height: 630 },
  jsonLd: [{ '@type': 'Thing', name: slug }],
});

describe('applyHeadTags', () => {
  beforeEach(() => {
    document.head.innerHTML = [
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width">',
      '<link rel="icon" href="/favicon.svg">',
      '<meta name="description" content="prerendered">',
      '<meta property="og:title" content="prerendered">',
      '<script type="application/ld+json">{}</script>',
    ].join('');
  });

  it('replaces the prerendered meta and keeps unrelated head tags', () => {
    applyHeadTags(document, toTagList(page('merge-pdf')));
    expect(document.title).toBe('Tool merge-pdf');
    expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'About merge-pdf',
    );
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://tools.exyconn.com/tools/merge-pdf',
    );
    expect(document.querySelector('meta[name="viewport"]')).not.toBeNull();
    expect(document.querySelector('link[rel="icon"]')).not.toBeNull();
  });

  it('leaves exactly one set of tags after repeated navigations', () => {
    applyHeadTags(document, toTagList(page('a')));
    applyHeadTags(document, toTagList(page('b')));
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    expect(JSON.parse(scripts[0].textContent ?? '')).toEqual({ '@type': 'Thing', name: 'b' });
    expect(document.querySelectorAll('meta[property="og:title"]')).toHaveLength(1);
    expect(document.querySelector('meta[property="og:image:width"]')?.getAttribute('content')).toBe(
      '1200',
    );
  });
});

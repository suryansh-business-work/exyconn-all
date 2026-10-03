import { describe, expect, it } from 'vitest';
import { createPageMeta, ROBOTS_INDEX, ROBOTS_NOINDEX, type SiteDefaults } from '../../src';

const site: SiteDefaults = {
  origin: 'https://tools.exyconn.com',
  name: 'Exyconn Tools',
  locale: 'en-US',
  themeColor: '#0b0b1f',
  image: { url: '/og.png', width: 1200, height: 630, alt: 'Exyconn Tools' },
  twitter: { site: '@exyconn' },
};

describe('createPageMeta', () => {
  it('fills the site defaults around the page values', () => {
    const meta = createPageMeta(site, {
      path: '/tools',
      title: 'All tools',
      description: 'Every tool.',
    });
    expect(meta).toEqual({
      title: 'All tools',
      description: 'Every tool.',
      canonical: 'https://tools.exyconn.com/tools',
      keywords: undefined,
      robots: ROBOTS_INDEX,
      locale: 'en-US',
      alternates: undefined,
      siteName: 'Exyconn Tools',
      type: 'website',
      image: {
        url: 'https://tools.exyconn.com/og.png',
        width: 1200,
        height: 630,
        alt: 'Exyconn Tools',
      },
      twitter: { site: '@exyconn' },
      themeColor: '#0b0b1f',
      jsonLd: undefined,
    });
  });

  it('prefers the page image, type, keywords and json-ld, and honours noindex', () => {
    const meta = createPageMeta(site, {
      path: 'https://tools.exyconn.com/x',
      title: 'X',
      description: 'Y',
      keywords: ['a', 'b'],
      image: { url: 'https://cdn.example.com/x.png' },
      type: 'article',
      noindex: true,
      alternates: [{ hreflang: 'x-default', href: 'https://tools.exyconn.com/x' }],
      jsonLd: [{ '@type': 'Thing' }],
    });
    expect(meta.image).toEqual({ url: 'https://cdn.example.com/x.png' });
    expect(meta.type).toBe('article');
    expect(meta.robots).toBe(ROBOTS_NOINDEX);
    expect(meta.keywords).toEqual(['a', 'b']);
    expect(meta.alternates).toHaveLength(1);
    expect(meta.jsonLd).toEqual([{ '@type': 'Thing' }]);
  });

  it('leaves the image unset when neither site nor page has one', () => {
    const meta = createPageMeta(
      { origin: 'https://a.b', name: 'A' },
      { path: '/', title: 't', description: 'd' },
    );
    expect(meta.image).toBeUndefined();
    expect(meta.canonical).toBe('https://a.b/');
  });
});

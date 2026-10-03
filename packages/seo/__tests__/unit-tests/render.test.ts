import { describe, expect, it } from 'vitest';
import { renderHead, renderTag, toTagList, type PageMeta } from '../../src';

const full: PageMeta = {
  title: 'Merge PDF & Split — Free',
  description: 'Combine "PDFs" <fast>.',
  canonical: 'https://tools.exyconn.com/tools/merge-pdf',
  keywords: ['merge pdf', 'combine pdf'],
  robots: 'index, follow',
  locale: 'en-US',
  alternates: [
    { hreflang: 'en-US', href: 'https://tools.exyconn.com/tools/merge-pdf' },
    { hreflang: 'x-default', href: 'https://tools.exyconn.com/tools/merge-pdf' },
  ],
  siteName: 'Exyconn Tools',
  type: 'website',
  image: {
    url: 'https://tools.exyconn.com/og.png',
    type: 'image/png',
    width: 1200,
    height: 630,
    alt: "Tools' card",
  },
  twitter: { site: '@exyconn', creator: '@me' },
  themeColor: '#0b0b1f',
  jsonLd: [{ '@context': 'https://schema.org', '@type': 'Thing', name: '</script>' }],
};

describe('renderHead', () => {
  it('prints every tag, escaped, in a fixed order', () => {
    expect(renderHead(full)).toMatchInlineSnapshot(`
      "<title>Merge PDF &amp; Split — Free</title>
      <meta name="description" content="Combine &quot;PDFs&quot; &lt;fast&gt;.">
      <meta name="keywords" content="merge pdf, combine pdf">
      <link rel="canonical" href="https://tools.exyconn.com/tools/merge-pdf">
      <link rel="alternate" hreflang="en-US" href="https://tools.exyconn.com/tools/merge-pdf">
      <link rel="alternate" hreflang="x-default" href="https://tools.exyconn.com/tools/merge-pdf">
      <meta name="robots" content="index, follow">
      <meta property="og:site_name" content="Exyconn Tools">
      <meta property="og:type" content="website">
      <meta property="og:url" content="https://tools.exyconn.com/tools/merge-pdf">
      <meta property="og:title" content="Merge PDF &amp; Split — Free">
      <meta property="og:description" content="Combine &quot;PDFs&quot; &lt;fast&gt;.">
      <meta property="og:locale" content="en_US">
      <meta property="og:image" content="https://tools.exyconn.com/og.png">
      <meta property="og:image:type" content="image/png">
      <meta property="og:image:width" content="1200">
      <meta property="og:image:height" content="630">
      <meta property="og:image:alt" content="Tools&#39; card">
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:site" content="@exyconn">
      <meta name="twitter:creator" content="@me">
      <meta name="twitter:title" content="Merge PDF &amp; Split — Free">
      <meta name="twitter:description" content="Combine &quot;PDFs&quot; &lt;fast&gt;.">
      <meta name="twitter:image" content="https://tools.exyconn.com/og.png">
      <meta name="twitter:image:alt" content="Tools&#39; card">
      <meta name="theme-color" content="#0b0b1f">
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"Thing","name":"\\u003c/script\\u003e"}</script>"
    `);
  });

  it('is deterministic', () => {
    expect(renderHead(full)).toBe(renderHead({ ...full }));
  });

  it('takes a custom separator', () => {
    expect(renderHead(full, '').includes('\n')).toBe(false);
  });

  it('prints only the required tags for a minimal page', () => {
    const minimal: PageMeta = { title: 'T', description: 'D', canonical: 'https://a.b/' };
    expect(renderHead(minimal).split('\n')).toEqual([
      '<title>T</title>',
      '<meta name="description" content="D">',
      '<link rel="canonical" href="https://a.b/">',
      '<meta property="og:type" content="website">',
      '<meta property="og:url" content="https://a.b/">',
      '<meta property="og:title" content="T">',
      '<meta property="og:description" content="D">',
      '<meta name="twitter:card" content="summary">',
      '<meta name="twitter:title" content="T">',
      '<meta name="twitter:description" content="D">',
    ]);
  });
});

describe('toTagList', () => {
  it('prints a keyword string as given and skips empty optional values', () => {
    const tags = toTagList({
      title: 'T',
      description: 'D',
      canonical: 'https://a.b/',
      keywords: 'a, b',
      robots: '',
      twitter: { card: 'summary' },
      image: { url: 'https://a.b/i.png' },
    });
    expect(tags).toContainEqual({ kind: 'meta', attrs: { name: 'keywords', content: 'a, b' } });
    expect(tags).toContainEqual({
      kind: 'meta',
      attrs: { name: 'twitter:card', content: 'summary' },
    });
    expect(tags.some((tag) => tag.kind === 'meta' && tag.attrs.name === 'robots')).toBe(false);
    expect(tags.some((tag) => tag.kind === 'meta' && tag.attrs.property === 'og:image:alt')).toBe(
      false,
    );
  });
});

describe('renderTag', () => {
  it('renders a link tag', () => {
    expect(renderTag({ kind: 'link', attrs: { rel: 'icon', href: '/a"b' } })).toBe(
      '<link rel="icon" href="/a&quot;b">',
    );
  });
});

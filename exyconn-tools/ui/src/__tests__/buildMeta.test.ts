/**
 * Pure unit tests for the shared SEO meta builder. `buildToolMeta` is the one
 * function both the runtime SPA (applyMeta) and the build-time prerenderer
 * depend on, so its output shape is contractual.
 */
import { describe, it, expect } from 'vitest';
import { buildToolMeta, SITE_NAME, SITE_ORIGIN, type ToolMetaInput } from '../shared/seo/buildMeta';
import type { ToolDetailContent } from '../shared/data/toolDetails/types';

const baseInput: ToolMetaInput = {
  id: 'sitemap-finder',
  name: 'Sitemap Finder Pro',
  description: 'Find and validate all sitemaps on any website instantly.',
  categoryName: 'Sitemap Tools',
};

const details = (overrides: Partial<ToolDetailContent> = {}): ToolDetailContent => ({
  longDescription: ['a'.repeat(200), 'b'.repeat(200)],
  features: ['f1', 'f2', 'f3', 'f4'],
  useCases: ['u1', 'u2', 'u3'],
  howTo: ['h1', 'h2', 'h3'],
  faqs: [
    { question: 'Is it free?', answer: 'Yes, it is completely free to use with no signup.' },
    { question: 'Is it private?', answer: 'Yes, files never leave your browser at any point.' },
    { question: 'Any limits?', answer: 'No hard limits are applied to normal everyday usage.' },
    { question: 'Mobile?', answer: 'Yes, the interface is fully responsive on phones too.' },
  ],
  keywords: ['sitemap finder', 'sitemap checker', 'xml sitemap', 'seo tool', 'free tool'],
  metaDescription: 'Find every sitemap on any website in seconds. Free, private and instant, with no signup and no limits on how many sites you check.',
  ...overrides,
});

const typeOf = (jsonLd: object[], type: string) =>
  jsonLd.find((entry) => (entry as Record<string, unknown>)['@type'] === type) as
    | Record<string, unknown>
    | undefined;

describe('buildToolMeta', () => {
  describe('title', () => {
    it('uses the default "<name> — Free Online Tool | <site>" format', () => {
      expect(buildToolMeta(baseInput).title).toBe(`Sitemap Finder Pro — Free Online Tool | ${SITE_NAME}`);
    });

    it('prefers an explicit metaTitle override', () => {
      const meta = buildToolMeta({ ...baseInput, details: details({ metaTitle: 'Sitemap Finder — Custom Title' }) });
      expect(meta.title).toBe('Sitemap Finder — Custom Title');
    });

    it('falls back to the default format when details exist without metaTitle', () => {
      const meta = buildToolMeta({ ...baseInput, details: details() });
      expect(meta.title).toBe(`Sitemap Finder Pro — Free Online Tool | ${SITE_NAME}`);
    });
  });

  describe('description', () => {
    it('falls back to the registry description when there are no details', () => {
      expect(buildToolMeta(baseInput).description).toBe(baseInput.description);
    });

    it('prefers the hand-written metaDescription', () => {
      const content = details();
      expect(buildToolMeta({ ...baseInput, details: content }).description).toBe(content.metaDescription);
    });
  });

  describe('canonical', () => {
    it('is the site origin plus /tools/<id>', () => {
      expect(buildToolMeta(baseInput).canonical).toBe(`${SITE_ORIGIN}/tools/sitemap-finder`);
    });

    it('tracks the id, not the name', () => {
      expect(buildToolMeta({ ...baseInput, id: 'merge-pdf' }).canonical).toBe(`${SITE_ORIGIN}/tools/merge-pdf`);
    });
  });

  describe('keywords', () => {
    it('joins the detail keywords with ", "', () => {
      const content = details();
      expect(buildToolMeta({ ...baseInput, details: content }).keywords).toBe(content.keywords.join(', '));
    });

    it('falls back to name + generic keywords when there are no details', () => {
      expect(buildToolMeta(baseInput).keywords).toBe('Sitemap Finder Pro, free online tool, exyconn');
    });
  });

  describe('open graph and twitter tags', () => {
    it('mirrors title, description and url into og tags', () => {
      const meta = buildToolMeta(baseInput);
      expect(meta.ogTags).toEqual({
        'og:site_name': SITE_NAME,
        'og:type': 'website',
        'og:title': meta.title,
        'og:description': meta.description,
        'og:url': meta.canonical,
      });
    });

    it('emits a summary twitter card mirroring title and description', () => {
      const meta = buildToolMeta(baseInput);
      expect(meta.twitterTags).toEqual({
        'twitter:card': 'summary',
        'twitter:title': meta.title,
        'twitter:description': meta.description,
      });
    });
  });

  describe('JSON-LD', () => {
    it('always includes a SoftwareApplication node', () => {
      const app = typeOf(buildToolMeta(baseInput).jsonLd, 'SoftwareApplication');
      expect(app).toMatchObject({
        '@context': 'https://schema.org',
        name: 'Sitemap Finder Pro',
        applicationCategory: 'WebApplication',
        operatingSystem: 'All',
        url: `${SITE_ORIGIN}/tools/sitemap-finder`,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      });
    });

    it('always includes a 3-level BreadcrumbList ending at the tool', () => {
      const crumbs = typeOf(buildToolMeta(baseInput).jsonLd, 'BreadcrumbList');
      expect(crumbs?.itemListElement).toEqual([
        { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE_ORIGIN}/tools` },
        { '@type': 'ListItem', position: 2, name: 'Sitemap Tools', item: `${SITE_ORIGIN}/tools` },
        { '@type': 'ListItem', position: 3, name: 'Sitemap Finder Pro', item: `${SITE_ORIGIN}/tools/sitemap-finder` },
      ]);
    });

    it('omits FAQPage when there are no details at all', () => {
      const meta = buildToolMeta(baseInput);
      expect(meta.jsonLd).toHaveLength(2);
      expect(typeOf(meta.jsonLd, 'FAQPage')).toBeUndefined();
    });

    it('omits FAQPage when details carry an empty faqs array', () => {
      const meta = buildToolMeta({ ...baseInput, details: details({ faqs: [] }) });
      expect(meta.jsonLd).toHaveLength(2);
      expect(typeOf(meta.jsonLd, 'FAQPage')).toBeUndefined();
    });

    it('adds a FAQPage node mapping every faq to a Question when faqs exist', () => {
      const content = details();
      const meta = buildToolMeta({ ...baseInput, details: content });
      const faqNode = typeOf(meta.jsonLd, 'FAQPage');
      expect(meta.jsonLd).toHaveLength(3);
      expect(faqNode?.mainEntity).toHaveLength(content.faqs.length);
      expect((faqNode?.mainEntity as object[])[0]).toEqual({
        '@type': 'Question',
        name: content.faqs[0].question,
        acceptedAnswer: { '@type': 'Answer', text: content.faqs[0].answer },
      });
    });

    it('keeps SoftwareApplication description in sync with the resolved description', () => {
      const content = details();
      const app = typeOf(buildToolMeta({ ...baseInput, details: content }).jsonLd, 'SoftwareApplication');
      expect(app?.description).toBe(content.metaDescription);
    });
  });
});

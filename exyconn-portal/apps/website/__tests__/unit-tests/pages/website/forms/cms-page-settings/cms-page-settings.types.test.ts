import { describe, expect, it } from 'vitest';
import { CmsDocumentStatus, CmsPageKind, CmsPageLayout } from '@exyconn/shell/graphql/generated';
import {
  pageSettingsSchema,
  toPageSettingsInput,
  toPageSettingsValues,
  type CmsPageDetail,
  type PageSettingsFormValues,
} from '../../../../../../src/pages/website/forms/cms-page-settings/cms-page-settings.types';

const page: CmsPageDetail = {
  id: 'page-1',
  siteId: 'site-1',
  path: '/blog/:slug',
  kind: CmsPageKind.Template,
  title: 'Blog post',
  layout: CmsPageLayout.Bare,
  status: CmsDocumentStatus.Published,
  updatedByName: 'Asha',
  updatedAt: '2026-01-02T00:00:00.000Z',
  seo: {
    title: 'Blog',
    description: 'Posts',
    keywords: 'ai, data',
    ogImageUrl: 'https://cdn.example.com/og.png',
    canonical: 'https://example.com/blog',
    noindex: true,
    jsonLd: { '@type': 'Article' },
  },
  draft: null,
  published: null,
};

const valid = (overrides: Partial<PageSettingsFormValues> = {}): PageSettingsFormValues => ({
  ...toPageSettingsValues(null),
  title: 'About',
  path: '/about-us',
  ...overrides,
});

const messages = (values: unknown) => {
  const result = pageSettingsSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

const withJsonLd = (jsonLd: string) => valid({ seo: { ...valid().seo, jsonLd } });

describe('toPageSettingsValues', () => {
  it('starts a new page at / with the default layout and empty search settings', () => {
    expect(toPageSettingsValues(null)).toEqual({
      path: '/',
      title: '',
      kind: CmsPageKind.Page,
      layout: CmsPageLayout.Default,
      seo: {
        title: '',
        description: '',
        keywords: '',
        ogImageUrl: '',
        canonical: '',
        noindex: false,
        jsonLd: '',
      },
    });
  });

  it('reads a page, pretty-printing its structured data', () => {
    const values = toPageSettingsValues(page);
    expect(values.path).toBe('/blog/:slug');
    expect(values.kind).toBe(CmsPageKind.Template);
    expect(values.layout).toBe(CmsPageLayout.Bare);
    expect(values.seo).toEqual({
      title: 'Blog',
      description: 'Posts',
      keywords: 'ai, data',
      ogImageUrl: 'https://cdn.example.com/og.png',
      canonical: 'https://example.com/blog',
      noindex: true,
      jsonLd: JSON.stringify({ '@type': 'Article' }, null, 2),
    });
  });

  it('leaves the structured data empty when the page has none', () => {
    const values = toPageSettingsValues({ ...page, seo: { ...page.seo, jsonLd: null } });
    expect(values.seo.jsonLd).toBe('');
  });
});

describe('toPageSettingsInput', () => {
  it('sends empty structured data as null', () => {
    expect(toPageSettingsInput(withJsonLd('   ')).seo?.jsonLd).toBeNull();
  });

  it('parses written structured data', () => {
    const input = toPageSettingsInput(withJsonLd('{"@type":"WebPage"}'));
    expect(input.seo?.jsonLd).toEqual({ '@type': 'WebPage' });
    expect(input.path).toBe('/about-us');
  });
});

describe('pageSettingsSchema', () => {
  it('accepts a plain page and a template with a parameter', () => {
    expect(messages(valid())).toEqual([]);
    expect(messages(valid({ kind: CmsPageKind.Template, path: '/blog/:slug' }))).toEqual([]);
  });

  it('asks a template for a parameter in its path', () => {
    expect(messages(valid({ kind: CmsPageKind.Template, path: '/blog' }))).toEqual([
      'A template needs a parameter in its path, like /blog/:slug',
    ]);
  });

  it('keeps parameters out of a plain page path', () => {
    expect(messages(valid({ path: '/blog/:slug' }))).toEqual([
      'Only a template may have a parameter in its path',
    ]);
  });

  it('accepts a JSON object, an array or nothing as structured data', () => {
    expect(messages(withJsonLd('{"a":1}'))).toEqual([]);
    expect(messages(withJsonLd('[{"a":1}]'))).toEqual([]);
    expect(messages(withJsonLd(''))).toEqual([]);
  });

  it.each(['null', '42', '"text"', '{broken'])('rejects %s as structured data', (jsonLd) => {
    expect(messages(withJsonLd(jsonLd))).toEqual([
      'Enter a JSON object or array, or leave it empty',
    ]);
  });

  it('rejects a malformed path and a missing title', () => {
    expect(messages(valid({ path: '/About Us', title: ' ' }))).toEqual([
      'Use a path like /about-us: lower-case letters, digits and dashes',
      'Title is required',
    ]);
  });
});

import { describe, expect, it } from 'vitest';
import { CmsSiteStatus } from '@exyconn/shell/graphql/generated';
import {
  cmsSiteSchema,
  toSiteFormValues,
  toSiteInput,
} from '../../../../../../src/pages/website/forms/cms-site/cms-site.types';
import { siteFixture } from '../../../cms/cms-helpers';

const messages = (values: unknown) => {
  const result = cmsSiteSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

const valid = () => ({ ...toSiteFormValues(null), name: 'Docs', slug: 'docs' });

describe('toSiteFormValues', () => {
  it('starts a new site as a draft in English with a pass-through title template', () => {
    expect(toSiteFormValues(null)).toEqual({
      name: '',
      slug: '',
      domains: [],
      status: CmsSiteStatus.Draft,
      markets: false,
      defaultLocale: 'en',
      faviconUrl: '',
      seo: { titleTemplate: '%s', description: '', ogImageUrl: '' },
      headerFragmentId: '',
      footerFragmentId: '',
      designSystemId: '',
      notFoundPageId: '',
      headHtml: '',
      bodyEndHtml: '',
      globalCss: '',
    });
  });

  it('copies an existing site, with its own domain list', () => {
    const site = siteFixture({
      headHtml: '<meta name="x">',
      seo: { titleTemplate: '%s | Exyconn', description: 'AI', ogImageUrl: 'og.png' },
    });
    const values = toSiteFormValues(site);

    expect(values).toMatchObject({
      name: 'Exyconn',
      slug: 'main',
      status: CmsSiteStatus.Active,
      designSystemId: 'design-1',
      headHtml: '<meta name="x">',
      seo: { titleTemplate: '%s | Exyconn', description: 'AI', ogImageUrl: 'og.png' },
    });
    expect(values.domains).toEqual(['exyconn.com']);
    expect(values.domains).not.toBe(site.domains);
  });
});

describe('toSiteInput', () => {
  it('sends the form values as they stand', () => {
    const values = valid();
    expect(toSiteInput(values)).toBe(values);
  });
});

describe('cmsSiteSchema', () => {
  it('accepts a minimal site and lower-cases its domains', () => {
    const result = cmsSiteSchema.parse({ ...valid(), domains: [' Example.COM '] });
    expect(result.domains).toEqual(['example.com']);
  });

  it('needs a name, a key of two characters and a locale', () => {
    expect(messages({ ...valid(), name: '', slug: 'd', defaultLocale: 'e' })).toEqual([
      'Name is required',
      'The key needs at least 2 characters',
      'Enter a locale, like en',
    ]);
  });

  it('rejects a key with capitals and a domain with a scheme', () => {
    expect(messages({ ...valid(), slug: 'My-Site', domains: ['https://example.com'] })).toEqual([
      'Use lower-case letters, digits and dashes',
      'Enter a bare domain, like example.com',
    ]);
  });

  it('allows at most 20 domains', () => {
    const domains = Array.from({ length: 21 }, (_unused, index) => `site${index}.example.com`);
    expect(messages({ ...valid(), domains })).toEqual(['At most 20 domains']);
  });

  it('caps the code added to every page', () => {
    expect(messages({ ...valid(), globalCss: 'a'.repeat(100_001) })).toEqual(['Too long']);
  });
});

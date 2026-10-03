import { describe, expect, it } from 'vitest';
import {
  applicationLd,
  articleLd,
  breadcrumbLd,
  collectionPageLd,
  faqPageLd,
  organizationLd,
  organizationRef,
  serviceLd,
  webSiteLd,
} from '../../src';

const ctx = 'https://schema.org';

describe('organizationLd', () => {
  it('keeps field order and nests the contact point', () => {
    const node = organizationLd({
      name: 'Exyconn',
      url: 'https://exyconn.com',
      logo: 'https://exyconn.com/logo.svg',
      description: 'd',
      knowsAbout: ['AI'],
      sameAs: ['https://x.com/exyconn'],
      contactPoint: {
        contactType: 'customer support',
        url: 'https://exyconn.com/contact',
        availableLanguage: ['English'],
      },
    });
    expect(JSON.stringify(node)).toBe(
      JSON.stringify({
        '@context': ctx,
        '@type': 'Organization',
        name: 'Exyconn',
        url: 'https://exyconn.com',
        logo: 'https://exyconn.com/logo.svg',
        description: 'd',
        knowsAbout: ['AI'],
        sameAs: ['https://x.com/exyconn'],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          url: 'https://exyconn.com/contact',
          availableLanguage: ['English'],
        },
      }),
    );
  });

  it('omits unset fields and empty lists', () => {
    expect(organizationLd({ name: 'A', url: 'https://a.b', sameAs: [] })).toEqual({
      '@context': ctx,
      '@type': 'Organization',
      name: 'A',
      url: 'https://a.b',
    });
  });
});

describe('webSiteLd', () => {
  it('adds a SearchAction when there is a search template', () => {
    expect(
      webSiteLd({
        name: 'T',
        url: 'https://t.b',
        searchUrlTemplate: 'https://t.b/?q={search_term_string}',
      }),
    ).toEqual({
      '@context': ctx,
      '@type': 'WebSite',
      name: 'T',
      url: 'https://t.b',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://t.b/?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    });
  });

  it('has no SearchAction without one', () => {
    expect(webSiteLd({ name: 'T', url: 'https://t.b', description: 'd' })).not.toHaveProperty(
      'potentialAction',
    );
  });
});

describe('applicationLd', () => {
  it('defaults to a WebApplication that runs anywhere', () => {
    expect(
      applicationLd({
        name: 'Merge PDF',
        url: 'https://t.b/m',
        description: 'd',
        applicationCategory: 'UtilitiesApplication',
      }),
    ).toEqual({
      '@context': ctx,
      '@type': 'WebApplication',
      name: 'Merge PDF',
      description: 'd',
      url: 'https://t.b/m',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'All',
    });
  });

  it('prints offer, provider and an explicit type', () => {
    const node = applicationLd({
      name: 'A',
      url: 'https://t.b/a',
      description: 'd',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Windows',
      type: 'SoftwareApplication',
      image: 'https://t.b/i.png',
      offer: { price: '0', priceCurrency: 'USD' },
      provider: { name: 'Exyconn', url: 'https://exyconn.com' },
    });
    expect(node).toMatchObject({
      '@type': 'SoftwareApplication',
      operatingSystem: 'Windows',
      image: 'https://t.b/i.png',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      provider: { '@type': 'Organization', name: 'Exyconn', url: 'https://exyconn.com' },
    });
  });
});

describe('breadcrumbLd', () => {
  it('numbers the crumbs from 1', () => {
    expect(
      breadcrumbLd([
        { name: 'Tools', url: 'https://t.b/tools' },
        { name: 'PDF', url: 'https://t.b/categories/pdf' },
      ]),
    ).toEqual({
      '@context': ctx,
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Tools', item: 'https://t.b/tools' },
        { '@type': 'ListItem', position: 2, name: 'PDF', item: 'https://t.b/categories/pdf' },
      ],
    });
  });
});

describe('faqPageLd', () => {
  it('maps every faq to a Question with an Answer', () => {
    expect(faqPageLd([{ question: 'Free?', answer: 'Yes.' }])).toEqual({
      '@context': ctx,
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes.' } },
      ],
    });
  });
});

describe('articleLd', () => {
  it('prints author, publisher with logo and the page it belongs to', () => {
    expect(
      articleLd({
        headline: 'H',
        url: 'https://e.c/blog/h',
        description: 'd',
        image: 'https://e.c/i.png',
        datePublished: '2026-10-01',
        dateModified: '2026-10-02',
        authorName: 'Ann',
        publisher: { name: 'Exyconn', url: 'https://e.c', logo: 'https://e.c/l.svg' },
        type: 'BlogPosting',
      }),
    ).toEqual({
      '@context': ctx,
      '@type': 'BlogPosting',
      headline: 'H',
      description: 'd',
      image: 'https://e.c/i.png',
      datePublished: '2026-10-01',
      dateModified: '2026-10-02',
      author: { '@type': 'Person', name: 'Ann' },
      publisher: {
        '@type': 'Organization',
        name: 'Exyconn',
        url: 'https://e.c',
        logo: { '@type': 'ImageObject', url: 'https://e.c/l.svg' },
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://e.c/blog/h' },
    });
  });

  it('defaults to Article and drops what is unset', () => {
    expect(
      articleLd({
        headline: 'H',
        url: 'https://e.c/a',
        publisher: { name: 'E', url: 'https://e.c' },
      }),
    ).toEqual({
      '@context': ctx,
      '@type': 'Article',
      headline: 'H',
      publisher: { '@type': 'Organization', name: 'E', url: 'https://e.c' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://e.c/a' },
    });
  });
});

describe('serviceLd', () => {
  it('prints the provider as an organization reference', () => {
    expect(
      serviceLd({
        name: 'AI agents',
        description: 'd',
        url: 'https://e.c/s',
        serviceType: 'AI',
        areaServed: 'Worldwide',
        provider: { name: 'Exyconn', url: 'https://e.c' },
      }),
    ).toEqual({
      '@context': ctx,
      '@type': 'Service',
      name: 'AI agents',
      description: 'd',
      url: 'https://e.c/s',
      serviceType: 'AI',
      areaServed: 'Worldwide',
      provider: organizationRef({ name: 'Exyconn', url: 'https://e.c' }),
    });
  });

  it('drops an unset provider', () => {
    expect(serviceLd({ name: 'S', description: 'd' })).not.toHaveProperty('provider');
  });
});

describe('collectionPageLd', () => {
  it('lists the items as a numbered ItemList', () => {
    expect(
      collectionPageLd({
        name: 'PDF tools',
        description: 'd',
        url: 'https://t.b/categories/pdf',
        items: [{ name: 'Merge PDF', url: 'https://t.b/tools/merge-pdf' }],
      }),
    ).toEqual({
      '@context': ctx,
      '@type': 'CollectionPage',
      name: 'PDF tools',
      description: 'd',
      url: 'https://t.b/categories/pdf',
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: 1,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Merge PDF',
            url: 'https://t.b/tools/merge-pdf',
          },
        ],
      },
    });
  });

  it('has no ItemList without items', () => {
    expect(
      collectionPageLd({ name: 'C', description: 'd', url: 'https://t.b/c' }),
    ).not.toHaveProperty('mainEntity');
  });
});

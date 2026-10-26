import {
  fromApifyItem,
  fromMcpProvider,
  fromMcpReview,
  plainText,
} from '../../../../src/modules/lead-sources/clutch/clutch.normalize';
import { actorInput } from '../../../../src/modules/lead-sources/clutch/clutch.apify.client';
import { profileSlug } from '../../../../src/modules/lead-sources/clutch/clutch.engines';

const MCP_PROVIDER = {
  id: 1785641,
  title: 'rtCamp',
  url: 'https://clutch.co/profile/rtcamp',
  logo_url: 'https://img/logo.svg',
  rating: 4.8,
  reviews_number: 17,
  headquarters: 'Atlanta, United States',
  office_locations: ['Pune, India'],
  description: 'A WordPress agency.',
  details:
    'Min. project size: $10,000; most common $50,000\nHourly rate: $50 - $99\nCertified in: Web Development, WordPress CMS',
  verification_level: 'premier',
};

describe('reading Clutch’s MCP server', () => {
  it('turns a provider into a company, reading the rate and services out of its details', () => {
    expect(fromMcpProvider(MCP_PROVIDER)).toMatchObject({
      key: '1785641',
      name: 'rtCamp',
      rating: 4.8,
      reviewCount: 17,
      hourlyRate: '$50 - $99',
      minProjectSize: '$10,000',
      services: ['Web Development', 'WordPress CMS'],
      locations: ['Pune, India'],
      verification: 'premier',
      reviews: [],
    });
    expect(fromMcpProvider({ url: 'https://clutch.co/profile/x' })).toMatchObject({
      key: 'https://clutch.co/profile/x',
      rating: null,
      hourlyRate: '',
    });
  });

  it('turns a review into plain text', () => {
    const review = fromMcpReview({
      title: 'Website rebuild',
      overall_rating: 5,
      project_size: 'Confidential',
      created_at: '2026-08-20T16:39:50Z',
      summary: '<p>Great work &amp; on time.</p><p>Would hire again.</p>',
    });
    expect(review).toEqual({
      title: 'Website rebuild',
      rating: 5,
      comment: 'Great work & on time.\nWould hire again.',
      reviewer: '',
      reviewerTitle: '',
      industry: '',
      projectSize: 'Confidential',
      date: '2026-08-20',
    });
    expect(plainText('<b>x</b>')).toBe('x');
  });

  it('looks a profile link up by its slug', () => {
    expect(profileSlug('https://clutch.co/profile/rtcamp?utm=x')).toBe('rtcamp');
    expect(profileSlug('https://clutch.co/web-developers')).toBe('');
  });
});

describe('reading an Apify Clutch scraper', () => {
  it('reads ScrapeAI’s summary shape, with reviews, portfolio and the phone on an address', () => {
    const company = fromApifyItem({
      url: 'https://clutch.co/profile/acme',
      websiteUrl: 'https://acme.dev',
      summary: {
        name: 'Acme',
        logo: 'https://img/acme.png',
        title: 'We build apps',
        rating: '4.9',
        noOfReviews: 12,
        averageHourlyRate: '$25 - $49',
        employees: '50 - 249',
        founded: '2012',
        addresses: [
          { locality: 'Pune', region: 'MH', country: 'India', phone: '+91 20 1234 5678' },
        ],
      },
      serviceProvided: [{ name: 'Mobile App Development', percent: 60 }],
      portfolio: [{ image: 'https://img/p.png', description: 'A banking app' }],
      reviews: [
        {
          datePublished: '2026-01-02',
          project: { name: 'App', size: '$50k' },
          review: { rating: 5, comments: 'Superb' },
          reviewer: { name: 'Jo', title: 'CTO', industry: 'Fintech' },
        },
      ],
    });
    expect(company).toMatchObject({
      key: 'https://clutch.co/profile/acme',
      name: 'Acme',
      website: 'https://acme.dev',
      tagline: 'We build apps',
      rating: 4.9,
      reviewCount: 12,
      headquarters: 'Pune, MH, India',
      phone: '+91 20 1234 5678',
      services: ['Mobile App Development'],
      portfolio: [{ title: '', description: 'A banking app', imageUrl: 'https://img/p.png' }],
      reviews: [
        {
          title: 'App',
          rating: 5,
          comment: 'Superb',
          reviewer: 'Jo',
          reviewerTitle: 'CTO',
          industry: 'Fintech',
          projectSize: '$50k',
          date: '2026-01-02',
        },
      ],
    });
  });

  it('reads the flat shape other actors use, with emails and listed people', () => {
    const company = fromApifyItem({
      name: 'Beta',
      url: 'https://clutch.co/profile/beta',
      website: 'https://beta.io',
      phone: '+1 415 555 0100',
      headquarters: { title: 'Austin, TX' },
      services: [{ title: 'SEO' }],
      emails: ['Hello@Beta.io', 'hello@beta.io'],
      contacts: [{ name: 'Sam', title: 'CEO', email: 'Sam@Beta.io' }, { email: 'no-name@beta.io' }],
    });
    expect(company).toMatchObject({
      name: 'Beta',
      phone: '+1 415 555 0100',
      headquarters: 'Austin, TX',
      services: ['SEO'],
      emails: ['hello@beta.io'],
      people: [{ name: 'Sam', title: 'CEO', email: 'sam@beta.io', phone: '' }],
    });
  });
});

describe('the Apify actor input', () => {
  it('asks for every result page by keyword, full profiles on request and portfolio as an extra', () => {
    expect(
      actorInput({
        keyword: 'api development',
        profileUrls: [],
        includeDetails: true,
        includeReviews: true,
        includePortfolio: false,
        maxItems: 50,
      }),
    ).toEqual({
      search: 'api development',
      mode: 'profiles',
      includeReviews: true,
      excludePortfolio: true,
      maxItems: 50,
      proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] },
    });
    expect(
      actorInput({
        keyword: '',
        profileUrls: ['https://clutch.co/profile/a'],
        includeDetails: false,
        includeReviews: false,
        includePortfolio: true,
        maxItems: 1,
      }),
    ).toMatchObject({
      startUrls: [{ url: 'https://clutch.co/profile/a' }],
      excludePortfolio: false,
    });
    expect(
      actorInput({
        keyword: 'seo',
        profileUrls: [],
        includeDetails: false,
        includeReviews: false,
        includePortfolio: false,
        maxItems: 5,
      }).mode,
    ).toBe('companies');
  });
});

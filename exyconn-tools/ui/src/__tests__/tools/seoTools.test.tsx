import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { apiOk, clickAway, findAlert, jsonReply, renderTool, stubFetch } from '../helpers/toolHarness';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () =>
  (await import('../helpers/toolHarness')).toolLayoutStub()
);

import BacklinkChecker from '../../tools/backlink-checker';
import CompetitorFinder from '../../tools/competitor-finder';
import KeywordRankChecker from '../../tools/keyword-rank-checker';
import KeywordTool from '../../tools/keyword-tool';
import KeywordVolumeChecker from '../../tools/keyword-volume-checker';
import SeoChecker from '../../tools/seo-checker';
import SerpChecker from '../../tools/serp-checker';
import SerpSimulator from '../../tools/serp-simulator';
import WebsiteAuthorityChecker from '../../tools/website-authority-checker';
import WebsiteTrafficChecker from '../../tools/website-traffic-checker';

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn() }, configurable: true });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const pressEnter = (label: string | RegExp) => fireEvent.keyDown(screen.getByLabelText(label), { key: 'Enter' });
const typeInto = (label: string | RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const bodyOf = (fetchMock: ReturnType<typeof stubFetch>, call = 0) =>
  JSON.parse(String((fetchMock.mock.calls[call] as [string, RequestInit])[1].body));

/** What the SEO check endpoint really answers with. */
const seoData = (overrides: Record<string, unknown> = {}) => ({
  url: 'https://example.org',
  score: 85,
  title: { text: 'Example title', length: 13 },
  metaDescription: { text: 'Example description', length: 19 },
  metaKeywords: '',
  canonical: 'https://example.org/',
  robots: '',
  openGraph: { title: 'OG', description: '', image: '' },
  twitterCard: '',
  viewport: 'width=device-width',
  charset: 'utf-8',
  language: 'en',
  favicon: '/f.ico',
  headings: { h1: ['Welcome'], h2: ['One', 'Two'] },
  images: { total: 3, withAlt: 2, withoutAlt: 1, missingAlt: ['a.png'] },
  links: { internal: 12, external: 4, nofollow: 1, total: 16 },
  wordCount: 480,
  schemaMarkup: ['Organization'],
  issues: [
    { type: 'images', severity: 'warning', message: '1 image(s) missing alt text' },
    { type: 'og', severity: 'info', message: 'Missing Open Graph title' },
    { type: 'title', severity: 'critical', message: 'Missing page title' },
  ],
  ...overrides,
});

describe('seo-checker', () => {
  it('posts the URL with https added, and shows score, issues, meta tags and headings', async () => {
    const fetchMock = stubFetch(apiOk(seoData()));
    renderTool(SeoChecker);
    expect(screen.getByRole('button', { name: 'Check SEO' })).toBeDisabled();

    typeInto('Website URL', 'example.org');
    fireEvent.click(screen.getByRole('button', { name: 'Check SEO' }));

    expect(await screen.findByText('SEO Score')).toBeInTheDocument();
    expect(bodyOf(fetchMock)).toEqual({ url: 'https://example.org' });
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('480 words')).toBeInTheDocument();
    expect(screen.getByText('Schema found')).toBeInTheDocument();
    expect(screen.getByText('Issues (3)')).toBeInTheDocument();
    expect(screen.getByText('Missing page title')).toBeInTheDocument();
    expect(screen.getByText('Title (13/60)')).toBeInTheDocument();
    expect(screen.getByText('Example title')).toBeInTheDocument();
    expect(screen.getByText('H2 (2)')).toBeInTheDocument();
  });

  it('shows the healthy and the poor extremes, with nothing found', async () => {
    stubFetch(
      apiOk(
        seoData({
          score: 40,
          issues: [],
          schemaMarkup: [],
          title: { text: '', length: 0 },
          metaDescription: { text: '', length: 0 },
          canonical: '',
          language: '',
          headings: {},
        })
      )
    );
    renderTool(SeoChecker);

    typeInto('Website URL', 'https://example.org');
    pressEnter('Website URL');

    expect(await screen.findByText('No issues found!')).toBeInTheDocument();
    expect(screen.queryByText('Schema found')).not.toBeInTheDocument();
    expect(screen.getAllByText('Not found').length).toBeGreaterThan(0);
    expect(screen.getByText('Not set')).toBeInTheDocument();
  });

  it('rates a middling score, and ignores Enter on an empty box', async () => {
    const fetchMock = stubFetch(apiOk(seoData({ score: 60 })));
    renderTool(SeoChecker);

    pressEnter('Website URL');
    expect(fetchMock).not.toHaveBeenCalled();

    typeInto('Website URL', 'http://example.org');
    pressEnter('Website URL');
    expect(await screen.findByText('60')).toBeInTheDocument();
    expect(bodyOf(fetchMock)).toEqual({ url: 'http://example.org' });
  });

  it('shows errors and the working state', async () => {
    stubFetch(jsonReply({ success: false, error: 'Site unreachable' }));
    renderTool(SeoChecker);
    typeInto('Website URL', 'example.org');
    fireEvent.click(screen.getByRole('button', { name: 'Check SEO' }));
    expect(await findAlert('Site unreachable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Site unreachable')).not.toBeInTheDocument());

    stubFetch(jsonReply({ success: false }));
    fireEvent.click(screen.getByRole('button', { name: 'Check SEO' }));
    expect(await findAlert('SEO check failed')).toBeInTheDocument();
    await clickAway();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Check SEO' }));
    await waitFor(() => expect(screen.getByText('SEO check failed')).toBeInTheDocument());

    let finish: (value: unknown) => void = () => undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      )
    );
    fireEvent.click(screen.getByRole('button', { name: 'Check SEO' }));
    expect(await screen.findByRole('button', { name: 'Analyzing...' })).toBeDisabled();
    await act(async () => finish(jsonReply({ success: false })));
  });
});

describe('keyword-rank-checker', () => {
  it('turns the SEO check into health figures: score, links, title, description, heading counts', async () => {
    const fetchMock = stubFetch(
      apiOk(seoData({ score: 55, headings: { h1: ['Welcome'], h2: ['One', 'Two'], h3: ['Deep'] } }))
    );
    renderTool(KeywordRankChecker);

    typeInto('Website URL', 'example.org');
    fireEvent.click(screen.getByRole('button', { name: 'Analyze SEO' }));

    expect(await screen.findByText('SEO Health Analysis')).toBeInTheDocument();
    expect(bodyOf(fetchMock)).toEqual({ url: 'https://example.org' });
    expect(screen.getByText('55')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Example title')).toBeInTheDocument();
    expect(screen.getByText('Example description')).toBeInTheDocument();
    expect(screen.getByText('H1: 1')).toBeInTheDocument();
    expect(screen.getByText('H2: 2')).toBeInTheDocument();
    expect(screen.getByText('H3: 1')).toBeInTheDocument();
  });

  it('shows poor and strong scores, leaves out a missing title and description, and handles failures', async () => {
    stubFetch(apiOk(seoData({ score: 90, title: { text: '', length: 0 }, metaDescription: { text: '', length: 0 } })));
    renderTool(KeywordRankChecker);
    typeInto('Website URL', 'https://example.org');
    pressEnter('Website URL');
    expect(await screen.findByText('90')).toBeInTheDocument();
    expect(screen.queryByText('Page Title')).not.toBeInTheDocument();
    expect(screen.queryByText('Meta Description')).not.toBeInTheDocument();

    stubFetch(apiOk(seoData({ score: 20, headings: {} })));
    pressEnter('Website URL');
    expect(await screen.findByText('20')).toBeInTheDocument();
    expect(screen.getByText('H1: 0')).toBeInTheDocument();

    stubFetch(jsonReply({ success: false }));
    pressEnter('Website URL');
    expect(await findAlert('Failed to analyze')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    pressEnter('Website URL');
    expect(await findAlert('An error occurred')).toBeInTheDocument();
    await clickAway();

    typeInto('Website URL', '   ');
    const calls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.length;
    pressEnter('Website URL');
    expect((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(calls);
  });

  it('shows the working state', async () => {
    let finish: (value: unknown) => void = () => undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      )
    );
    renderTool(KeywordRankChecker);
    typeInto('Website URL', 'example.org');

    fireEvent.click(screen.getByRole('button', { name: 'Analyze SEO' }));

    expect(await screen.findByRole('button', { name: 'Analyzing...' })).toBeDisabled();
    await act(async () => finish(jsonReply({ success: false })));
  });
});

describe('backlink-checker', () => {
  const linkData = (overrides: Record<string, unknown> = {}) => ({
    domain: 'example.org',
    analyzedUrl: 'https://example.org',
    internalLinks: { total: 3, links: [] },
    externalLinks: {
      total: 4,
      dofollow: 3,
      nofollow: 1,
      uniqueDomains: 2,
      domainList: ['partner.test', 'other.test'],
      links: [
        { url: 'https://partner.test/a', anchor: 'Partner', nofollow: false, domain: 'partner.test' },
        { url: 'https://other.test/', anchor: '', nofollow: true, domain: 'other.test' },
      ],
    },
    summary: { totalLinks: 7, internalCount: 3, externalCount: 4, uniqueExternalDomains: 2 },
    ...overrides,
  });

  it('shows the link profile with percentages, domains and each link marked follow or nofollow', async () => {
    const fetchMock = stubFetch(apiOk(linkData()));
    renderTool(BacklinkChecker);

    typeInto('URL', 'example.org');
    fireEvent.click(screen.getByRole('button', { name: 'Analyze Links' }));

    expect(await screen.findByText('Link Analysis: example.org')).toBeInTheDocument();
    expect(bodyOf(fetchMock)).toEqual({ url: 'https://example.org' });
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('3 (43%)')).toBeInTheDocument();
    expect(screen.getByText('4 (57%)')).toBeInTheDocument();
    expect(screen.getByText('1 (25%)')).toBeInTheDocument();
    expect(screen.getByText('Unique External Domains (2)')).toBeInTheDocument();
    expect(screen.getByText('partner.test')).toBeInTheDocument();
    expect(screen.getByText('Partner')).toBeInTheDocument();
    expect(screen.getByText('(no anchor)')).toBeInTheDocument();
    expect(screen.getByText('dofollow')).toBeInTheDocument();
    expect(screen.getByText('nofollow')).toBeInTheDocument();
  });

  it('opens an external link in a new tab, and copes with a page that has no links', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    stubFetch(apiOk(linkData()));
    renderTool(BacklinkChecker);
    typeInto('URL', 'https://example.org');
    pressEnter('URL');
    await screen.findByText('Partner');

    const icon = document.querySelector('svg[data-testid="OpenInNewIcon"]') as SVGElement;
    fireEvent.click(icon);
    expect(open).toHaveBeenCalledWith('https://partner.test/a', '_blank');

    stubFetch(
      apiOk(
        linkData({
          internalLinks: { total: 0, links: [] },
          externalLinks: { total: 0, dofollow: 0, nofollow: 0, uniqueDomains: 0, domainList: [], links: [] },
          summary: { totalLinks: 0, internalCount: 0, externalCount: 0, uniqueExternalDomains: 0 },
        })
      )
    );
    pressEnter('URL');
    await waitFor(() => expect(screen.queryByText('Partner')).not.toBeInTheDocument());
    expect(screen.getAllByText('0 (0%)').length).toBe(3);
  });

  it('shows errors and the working state', async () => {
    stubFetch(jsonReply({ success: false, error: 'Cannot fetch' }));
    renderTool(BacklinkChecker);
    typeInto('URL', 'example.org');
    fireEvent.click(screen.getByRole('button', { name: 'Analyze Links' }));
    expect(await findAlert('Cannot fetch')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    stubFetch(jsonReply({ success: false }));
    fireEvent.click(screen.getByRole('button', { name: 'Analyze Links' }));
    expect(await findAlert('Failed to analyze')).toBeInTheDocument();
    await clickAway();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Analyze Links' }));
    expect(await findAlert('An error occurred')).toBeInTheDocument();

    let finish: (value: unknown) => void = () => undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      )
    );
    fireEvent.click(screen.getByRole('button', { name: 'Analyze Links' }));
    expect(await screen.findByRole('button', { name: 'Analyzing...' })).toBeDisabled();
    await act(async () => finish(jsonReply({ success: false })));

    stubFetch();
    typeInto('URL', '  ');
    pressEnter('URL');
  });
});

describe('competitor-finder', () => {
  const competitors = (overrides: Record<string, unknown> = {}) => ({
    analyzedDomain: 'example.org',
    analyzedUrl: 'https://example.org',
    siteContext: { title: 'Example Site', description: 'About us', h1: 'Welcome', keywords: 'seo, tools ,, ' },
    relatedSites: [
      { domain: 'rival.test', mentions: 5, anchors: ['Rival', 'Rival site', 'Rival blog', 'More'] },
      { domain: 'minor.test', mentions: 1, anchors: [''] },
    ],
    totalExternalDomains: 2,
    ...overrides,
  });

  it('lists related sites with their anchors, and the site context with its keywords', async () => {
    const fetchMock = stubFetch(apiOk(competitors()));
    renderTool(CompetitorFinder);

    typeInto('Website URL', 'example.org');
    fireEvent.click(screen.getByRole('button', { name: 'Find Related Sites' }));

    expect(await screen.findByText('2 Related Sites Found')).toBeInTheDocument();
    expect(bodyOf(fetchMock)).toEqual({ url: 'https://example.org' });
    expect(screen.getByText('Example Site')).toBeInTheDocument();
    expect(screen.getByText('About us')).toBeInTheDocument();
    expect(screen.getByText('seo')).toBeInTheDocument();
    expect(screen.getByText('tools')).toBeInTheDocument();
    expect(screen.getByText('rival.test')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    fireEvent.click(document.querySelector('svg[data-testid="OpenInNewIcon"]') as SVGElement);
    expect(open).toHaveBeenCalledWith('https://rival.test', '_blank');
    expect(screen.getByText('(no text)')).toBeInTheDocument();
    expect(screen.getByText('Total external domains found: 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Copy Domains' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('rival.test\nminor.test');
    expect(await screen.findByRole('button', { name: 'Copied!' })).toBeInTheDocument();
  });

  it('shows an empty result without keywords, description or title', async () => {
    stubFetch(
      apiOk(
        competitors({
          siteContext: { title: '', description: '', h1: '', keywords: '' },
          relatedSites: [],
          totalExternalDomains: 0,
        })
      )
    );
    renderTool(CompetitorFinder);

    typeInto('Website URL', 'https://example.org');
    pressEnter('Website URL');

    expect(await screen.findByText('0 Related Sites Found')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy Domains' })).not.toBeInTheDocument();
  });

  it('shows a title without a description, and errors', async () => {
    stubFetch(apiOk(competitors({ siteContext: { title: 'Only title', description: '', h1: '', keywords: '' } })));
    renderTool(CompetitorFinder);
    typeInto('Website URL', 'example.org');
    pressEnter('Website URL');
    expect(await screen.findByText('Only title')).toBeInTheDocument();

    stubFetch(jsonReply({ success: false, error: 'No links found' }));
    pressEnter('Website URL');
    expect(await findAlert('No links found')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    stubFetch(jsonReply({ success: false }));
    pressEnter('Website URL');
    expect(await findAlert('Failed to analyze')).toBeInTheDocument();
    await clickAway();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    pressEnter('Website URL');
    expect(await findAlert('An error occurred')).toBeInTheDocument();

    typeInto('Website URL', ' ');
    pressEnter('Website URL');
  });

  it('shows the working state', async () => {
    let finish: (value: unknown) => void = () => undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      )
    );
    renderTool(CompetitorFinder);
    typeInto('Website URL', 'example.org');

    fireEvent.click(screen.getByRole('button', { name: 'Find Related Sites' }));

    expect(await screen.findByRole('button', { name: 'Analyzing...' })).toBeDisabled();
    await act(async () => finish(jsonReply({ success: false })));
  });
});

describe('website-traffic-checker', () => {
  const traffic = (overrides: Record<string, unknown> = {}) => ({
    domain: 'example.org',
    url: 'https://example.org',
    performance: { loadTimeMs: 420, pageSizeKB: 88, scripts: 5, stylesheets: 2, images: 9, iframes: 1 },
    content: { title: 'Example', metaDescription: 'Meta text', wordCount: 700, internalPages: 14, externalDomains: 3 },
    social: { platforms: ['twitter.com', 'instagram.com'], count: 2 },
    technology: { detected: ['Astro', 'Server: nginx'], ogType: 'website' },
    links: { internalPages: 14, externalDomains: 3, externalDomainList: ['a.test', 'b.test', 'a.test'] },
    ...overrides,
  });

  it('shows performance, content, technology, social and link figures', async () => {
    const fetchMock = stubFetch(apiOk(traffic()));
    renderTool(WebsiteTrafficChecker);

    typeInto('URL', 'example.org');
    fireEvent.click(screen.getByRole('button', { name: 'Analyze Website' }));

    expect(await screen.findByText('Technology Stack')).toBeInTheDocument();
    expect(bodyOf(fetchMock)).toEqual({ url: 'https://example.org' });
    expect(screen.getByText('Astro')).toBeInTheDocument();
    expect(screen.getByText('Meta text')).toBeInTheDocument();
    expect(screen.getByText('twitter.com')).toBeInTheDocument();
    expect(screen.getAllByText('a.test').length).toBe(2);
    expect(screen.getByText('Words: 700')).toBeInTheDocument();
  });

  it('leaves out sections that have nothing to show, and handles errors', async () => {
    stubFetch(
      apiOk(
        traffic({
          content: { title: '', metaDescription: '', wordCount: 0, internalPages: 0, externalDomains: 0 },
          social: { platforms: [], count: 0 },
          technology: { detected: [], ogType: '' },
          links: { internalPages: 0, externalDomains: 0, externalDomainList: [] },
        })
      )
    );
    renderTool(WebsiteTrafficChecker);
    typeInto('URL', 'https://example.org');
    pressEnter('URL');
    await screen.findByText('Load Time');
    expect(screen.queryByText('Technology Stack')).not.toBeInTheDocument();
    expect(screen.queryByText('Social Presence')).not.toBeInTheDocument();

    stubFetch(jsonReply({ success: false, error: 'Timed out' }));
    pressEnter('URL');
    expect(await findAlert('Timed out')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    stubFetch(jsonReply({ success: false }));
    pressEnter('URL');
    expect(await findAlert('Failed to analyze')).toBeInTheDocument();
    await clickAway();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    pressEnter('URL');
    expect(await findAlert('An error occurred')).toBeInTheDocument();

    typeInto('URL', ' ');
    pressEnter('URL');
  });

  it('shows the working state', async () => {
    let finish: (value: unknown) => void = () => undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      )
    );
    renderTool(WebsiteTrafficChecker);
    typeInto('URL', 'example.org');

    fireEvent.click(screen.getByRole('button', { name: 'Analyze Website' }));

    expect(await screen.findByRole('button', { name: 'Analyzing...' })).toBeDisabled();
    await act(async () => finish(jsonReply({ success: false })));
  });
});

describe('website-authority-checker', () => {
  it('turns the SEO check into key metrics and improvement tips', async () => {
    const issues = Array.from({ length: 10 }, (_, i) => ({ type: 't', severity: 'info', message: `Tip ${i + 1}` }));
    const fetchMock = stubFetch(apiOk(seoData({ score: 90, issues })));
    renderTool(WebsiteAuthorityChecker);

    typeInto('Domain', 'example.org');
    fireEvent.click(screen.getByRole('button', { name: 'Check Authority' }));

    expect(await screen.findByText('Key Metrics')).toBeInTheDocument();
    expect(bodyOf(fetchMock)).toEqual({ url: 'https://example.org' });
    expect(screen.getByText('SEO Score: 90/100')).toBeInTheDocument();
    expect(screen.getByText('Word Count: 480')).toBeInTheDocument();
    expect(screen.getByText('Tip 8')).toBeInTheDocument();
    expect(screen.queryByText('Tip 9')).not.toBeInTheDocument();
  });

  it('colours middling and poor scores, and has no tips for a clean page', async () => {
    stubFetch(apiOk(seoData({ score: 60, issues: [] })));
    renderTool(WebsiteAuthorityChecker);
    typeInto('Domain', 'https://example.org');
    fireEvent.click(screen.getByRole('button', { name: 'Check Authority' }));
    await screen.findByText('SEO Score: 60/100');
    expect(screen.queryByText('Improvement Tips')).not.toBeInTheDocument();

    stubFetch(apiOk(seoData({ score: 30 })));
    fireEvent.click(screen.getByRole('button', { name: 'Check Authority' }));
    await screen.findByText('SEO Score: 30/100');
  });

  it('shows errors and the working state', async () => {
    stubFetch(jsonReply({ success: false, error: 'Unreachable' }));
    renderTool(WebsiteAuthorityChecker);
    typeInto('Domain', 'example.org');
    fireEvent.click(screen.getByRole('button', { name: 'Check Authority' }));
    expect(await findAlert('Unreachable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    stubFetch(jsonReply({ success: false }));
    fireEvent.click(screen.getByRole('button', { name: 'Check Authority' }));
    expect(await findAlert('Failed to check authority')).toBeInTheDocument();
    await clickAway();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Check Authority' }));
    expect(await findAlert('An error occurred')).toBeInTheDocument();

    let finish: (value: unknown) => void = () => undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      )
    );
    fireEvent.click(screen.getByRole('button', { name: 'Check Authority' }));
    expect(await screen.findByRole('button', { name: 'Analyzing...' })).toBeDisabled();
    await act(async () => finish(jsonReply({ success: false })));
  });
});

describe('keyword suggestion tools', () => {
  const suggestions = (...words: string[]) =>
    apiOk({
      totalSuggestions: words.length,
      keywords: words.map((keyword) => ({ keyword, wordCount: keyword.split(' ').length, charCount: keyword.length })),
    });

  it('keyword-tool lists suggestions and copies them', async () => {
    const fetchMock = stubFetch(suggestions('seo tools', 'seo tips'));
    renderTool(KeywordTool);
    expect(screen.getByRole('button', { name: 'Find Keywords' })).toBeDisabled();

    typeInto('Seed Keyword', ' seo ');
    fireEvent.click(screen.getByRole('button', { name: 'Find Keywords' }));

    expect(await screen.findByText('seo tools')).toBeInTheDocument();
    expect(bodyOf(fetchMock)).toEqual({ keyword: 'seo' });
    fireEvent.click(screen.getByRole('button', { name: 'Copy All' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('seo tools\nseo tips');
    expect(await screen.findByRole('button', { name: 'Copied!' })).toBeInTheDocument();
  });

  it('keyword-tool handles empty answers, Enter and errors', async () => {
    stubFetch(apiOk({}));
    renderTool(KeywordTool);
    pressEnter('Seed Keyword');
    typeInto('Seed Keyword', 'seo');
    pressEnter('Seed Keyword');
    await waitFor(() =>
      expect(screen.getByText('Enter a seed keyword to find real Google suggestions')).toBeInTheDocument()
    );

    stubFetch(jsonReply({ success: false, error: 'Rate limited' }));
    pressEnter('Seed Keyword');
    expect(await findAlert('Rate limited')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    stubFetch(jsonReply({ success: false }));
    pressEnter('Seed Keyword');
    expect(await findAlert('Failed to fetch suggestions')).toBeInTheDocument();
    await clickAway();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    pressEnter('Seed Keyword');
    expect(await findAlert('An error occurred')).toBeInTheDocument();
  });

  it('serp-checker ranks suggestions, copies them and handles errors', async () => {
    const words = Array.from({ length: 12 }, (_, i) => `best seo tool ${i}`);
    const fetchMock = stubFetch(suggestions(...words));
    renderTool(SerpChecker);

    typeInto('Keyword', 'best seo');
    fireEvent.click(screen.getByRole('button', { name: 'Analyze SERP' }));

    expect(await screen.findByText('best seo tool 0')).toBeInTheDocument();
    expect(bodyOf(fetchMock)).toEqual({ keyword: 'best seo' });
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(words.join('\n'));
    expect(await screen.findByRole('button', { name: 'Copied!' })).toBeInTheDocument();

    stubFetch(apiOk({}));
    pressEnter('Keyword');
    await waitFor(() => expect(screen.queryByText('best seo tool 0')).not.toBeInTheDocument());

    stubFetch(jsonReply({ success: false, error: 'Blocked' }));
    pressEnter('Keyword');
    expect(await findAlert('Blocked')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    stubFetch(jsonReply({ success: false }));
    pressEnter('Keyword');
    expect(await findAlert('Failed to fetch data')).toBeInTheDocument();
    await clickAway();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    pressEnter('Keyword');
    expect(await findAlert('An error occurred')).toBeInTheDocument();

    typeInto('Keyword', ' ');
    pressEnter('Keyword');
  });

  it('keyword-volume-checker merges suggestions for up to five keywords without repeats', async () => {
    const fetchMock = stubFetch(
      suggestions('alpha one', 'shared'),
      suggestions('shared', 'beta two'),
      jsonReply({ success: false }),
      apiOk({}),
      suggestions()
    );
    renderTool(KeywordVolumeChecker);
    const box = screen.getByLabelText('Keywords (one per line, max 5)');
    expect(screen.getByRole('button', { name: 'Get Keyword Ideas' })).toBeDisabled();

    fireEvent.change(box, { target: { value: 'alpha\nbeta\n\ngamma\ndelta\nepsilon\nzeta' } });
    fireEvent.click(screen.getByRole('button', { name: 'Get Keyword Ideas' }));

    expect(await screen.findByText('3 Keyword Ideas')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(screen.getByText('alpha one')).toBeInTheDocument();
    expect(screen.getByText('beta two')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Copy All' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('alpha one\nshared\nbeta two');
    expect(await screen.findByRole('button', { name: 'Copied!' })).toBeInTheDocument();
  });

  it('keyword-volume-checker reports a failed request and the working state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network down')));
    renderTool(KeywordVolumeChecker);
    const box = screen.getByLabelText('Keywords (one per line, max 5)');
    fireEvent.change(box, { target: { value: 'alpha' } });
    fireEvent.click(screen.getByRole('button', { name: 'Get Keyword Ideas' }));
    expect(await findAlert('Network down')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Get Keyword Ideas' }));
    expect(await findAlert('An error occurred')).toBeInTheDocument();
    await clickAway();

    let finish: (value: unknown) => void = () => undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      )
    );
    fireEvent.click(screen.getByRole('button', { name: 'Get Keyword Ideas' }));
    expect(await screen.findByRole('button', { name: 'Fetching...' })).toBeDisabled();
    await act(async () => finish(jsonReply({ success: false })));
  });
});

describe('serp-simulator', () => {
  const simulated = (overrides: Record<string, unknown> = {}) => ({
    preview: {
      title: 'Server title',
      description: 'Server description',
      url: 'https://example.org/p',
      displayUrl: 'example.org',
    },
    analysis: {
      title: { text: 'Server title', length: 12, maxLength: 60, pixelWidth: 96 },
      description: { text: 'Server description', length: 18, maxLength: 160 },
    },
    issues: [{ field: 'title', message: 'Title is too short for optimal SEO', severity: 'info' }],
    score: 85,
    ...overrides,
  });

  const fill = () => {
    typeInto('Page Title', 'My title');
    typeInto('Meta Description', 'My description');
    typeInto('URL', 'example.org/p');
  };

  it('previews the typed text live, then shows the server analysis', async () => {
    const fetchMock = stubFetch(apiOk(simulated()));
    renderTool(SerpSimulator);
    expect(screen.getByText('Your Page Title')).toBeInTheDocument();
    expect(screen.getByText('Your meta description will appear here...')).toBeInTheDocument();

    fill();
    expect(screen.getByText('My title')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Preview SERP' }));

    expect(await screen.findByText('Score: 85/100')).toBeInTheDocument();
    expect(bodyOf(fetchMock)).toEqual({
      title: 'My title',
      description: 'My description',
      url: 'https://example.org/p',
    });
    expect(screen.getByText('Title: 12/60')).toBeInTheDocument();
    expect(screen.getByText('Desc: 18/160')).toBeInTheDocument();
    expect(screen.getByText('Title is too short for optimal SEO')).toBeInTheDocument();
    expect(screen.getByText('Server title')).toBeInTheDocument();
  });

  it('flags over-long text, warnings and a clean result', async () => {
    stubFetch(
      apiOk(
        simulated({
          analysis: {
            title: { text: 't', length: 70, maxLength: 60, pixelWidth: 560 },
            description: { text: 'd', length: 170, maxLength: 160 },
          },
          issues: [{ field: 'description', message: 'Description is 10 chars over', severity: 'warning' }],
          score: 55,
        })
      )
    );
    renderTool(SerpSimulator);
    typeInto('Page Title', 't'.repeat(70));
    typeInto('Meta Description', 'd'.repeat(170));
    typeInto('URL', 'https://example.org');
    expect(screen.getAllByText(/\.\.\.$/).length).toBe(2);
    fireEvent.click(screen.getByRole('button', { name: 'Preview SERP' }));
    expect(await screen.findByText('Description is 10 chars over')).toBeInTheDocument();

    stubFetch(apiOk(simulated({ issues: [], score: 30 })));
    fireEvent.click(screen.getByRole('button', { name: 'Preview SERP' }));
    expect(await screen.findByText('All optimized!')).toBeInTheDocument();
  });

  it('does nothing until all three fields are filled, and ignores a failed preview', async () => {
    const fetchMock = stubFetch(jsonReply({ success: false }));
    renderTool(SerpSimulator);

    fireEvent.click(screen.getByRole('button', { name: 'Preview SERP' }));
    expect(fetchMock).not.toHaveBeenCalled();

    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Preview SERP' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/Score:/)).not.toBeInTheDocument();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Preview SERP' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Preview SERP' })).toBeEnabled());

    let finish: (value: unknown) => void = () => undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          })
      )
    );
    fireEvent.click(screen.getByRole('button', { name: 'Preview SERP' }));
    expect(await screen.findByRole('button', { name: 'Simulating...' })).toBeDisabled();
    await act(async () => finish(jsonReply({ success: false })));
  });
});

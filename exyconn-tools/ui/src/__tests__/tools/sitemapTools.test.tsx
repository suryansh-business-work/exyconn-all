import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { clickAway, findAlert, jsonReply, renderTool, stubFetch } from '../helpers/toolHarness';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () =>
  (await import('../helpers/toolHarness')).toolLayoutStub()
);

import SitemapCompare from '../../tools/sitemap-compare';
import SitemapFrequencyAnalyzer from '../../tools/sitemap-frequency-analyzer';
import SitemapInsights from '../../tools/sitemap-insights';
import SitemapSplitMerge from '../../tools/sitemap-split-merge';
import SitemapUrlExtractor from '../../tools/sitemap-url-extractor';
import SitemapValidator from '../../tools/sitemap-validator';

let downloads: string[];
let blobParts: BlobPart[][];

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn() }, configurable: true });
  downloads = [];
  blobParts = [];
  const create = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const element = create(tag);
    if (tag === 'a') {
      Object.defineProperty(element, 'download', {
        set: (value: string) => downloads.push(value),
        get: () => downloads.at(-1) ?? '',
      });
    }
    return element;
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  const Real = Blob;
  vi.stubGlobal(
    'Blob',
    class extends Real {
      constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options);
        blobParts.push(parts ?? []);
      }
    }
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const ok = (body: Record<string, unknown>) => jsonReply({ success: true, ...body });
const SITEMAP_URL = 'https://example.org/sitemap.xml';
const bodyOf = (fetchMock: ReturnType<typeof stubFetch>) =>
  JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body));

/** The three states every single-URL tool goes through that are not its success path. */
async function failures(button: string, boxPlaceholder: string, messages: { server: string; fallback: string }) {
  stubFetch(jsonReply({ error: messages.server }, { ok: false, status: 400 }));
  fireEvent.click(screen.getByRole('button', { name: button }));
  expect(await findAlert(messages.server)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  await waitFor(() => expect(screen.queryByText(messages.server)).not.toBeInTheDocument());

  stubFetch(jsonReply({}, { ok: false, status: 500 }));
  fireEvent.click(screen.getByRole('button', { name: button }));
  expect(await findAlert(messages.fallback)).toBeInTheDocument();
  await clickAway();

  vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
  fireEvent.click(screen.getByRole('button', { name: button }));
  expect(await findAlert(messages.fallback)).toBeInTheDocument();
  await clickAway();
  expect(screen.getByPlaceholderText(boxPlaceholder)).toBeInTheDocument();
}

describe('sitemap-validator', () => {
  const urlBox = () => screen.getByPlaceholderText('https://example.com/sitemap.xml');

  it('validates the sitemap and lists errors and warnings', async () => {
    const fetchMock = stubFetch(
      ok({
        isValid: false,
        urlCount: 1204,
        fileSize: 2048,
        issues: [
          { type: 'error', message: 'Invalid URL format', url: 'not a url' },
          { type: 'warning', message: 'Invalid lastmod format', url: 'https://example.org/a' },
          { type: 'warning', message: 'Invalid priority' },
        ],
      })
    );
    renderTool(SitemapValidator);
    expect(screen.getByRole('button', { name: 'Validate Sitemap' })).toBeDisabled();

    fireEvent.change(urlBox(), { target: { value: SITEMAP_URL } });
    fireEvent.click(screen.getByRole('button', { name: 'Validate Sitemap' }));

    expect(await screen.findByText('Invalid Sitemap')).toBeInTheDocument();
    expect(bodyOf(fetchMock)).toEqual({ url: SITEMAP_URL });
    expect(screen.getByText('1,204')).toBeInTheDocument();
    expect(screen.getByText('2 KB')).toBeInTheDocument();
    expect(screen.getByText('Errors (1)')).toBeInTheDocument();
    expect(screen.getByText('Warnings (2)')).toBeInTheDocument();
    expect(screen.getByText('not a url')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('celebrates a clean sitemap, formats sizes and truncates long issue lists', async () => {
    stubFetch(ok({ isValid: true, urlCount: 3, fileSize: 0, issues: [] }));
    renderTool(SitemapValidator);
    fireEvent.change(urlBox(), { target: { value: SITEMAP_URL } });
    fireEvent.click(screen.getByRole('button', { name: 'Validate Sitemap' }));
    expect(await screen.findByText('Valid Sitemap')).toBeInTheDocument();
    expect(screen.getByText('0 Bytes')).toBeInTheDocument();
    expect(screen.getByText(/valid and follows all SEO best practices/)).toBeInTheDocument();

    const many = Array.from({ length: 25 }, (_, i) => ({ type: 'error', message: `Problem ${i}`, url: `u${i}` }));
    stubFetch(ok({ isValid: false, urlCount: 25, fileSize: 5 * 1024 * 1024, issues: many }));
    fireEvent.click(screen.getByRole('button', { name: 'Validate Sitemap' }));
    expect(await screen.findByText('Showing 20 of 25 issues')).toBeInTheDocument();
    expect(screen.getByText('5 MB')).toBeInTheDocument();
  });

  it('shows failures and the working state', async () => {
    renderTool(SitemapValidator);
    fireEvent.change(urlBox(), { target: { value: SITEMAP_URL } });
    await failures('Validate Sitemap', 'https://example.com/sitemap.xml', {
      server: 'Sitemap not reachable',
      fallback: 'Validation failed',
    });

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
    fireEvent.click(screen.getByRole('button', { name: 'Validate Sitemap' }));
    expect(await screen.findByRole('button', { name: 'Validating...' })).toBeDisabled();
    await act(async () => finish(jsonReply({}, { ok: false, status: 500 })));
  });
});

describe('sitemap-insights', () => {
  const INSIGHTS = {
    totalUrls: 1500,
    urlPatterns: [{ pattern: 'blog', count: 900, percentage: 60 }],
    depthAnalysis: [
      { depth: 0, count: 1 },
      { depth: 2, count: 700 },
    ],
    domainBreakdown: [{ domain: 'example.org', count: 1500 }],
    fileTypes: [{ extension: 'html', count: 10 }],
    lastmodFreshness: [{ category: 'Last 7 days', count: 20 }],
    changefreqDistribution: [{ freq: 'daily', count: 5 }],
    priorityDistribution: [{ range: 'High (0.8-1.0)', count: 3 }],
  };

  it('shows each insight card', async () => {
    const fetchMock = stubFetch(ok(INSIGHTS));
    renderTool(SitemapInsights);
    const box = screen.getByPlaceholderText('https://example.com/sitemap.xml');
    expect(screen.getByRole('button', { name: 'Analyze Sitemap' })).toBeDisabled();

    fireEvent.change(box, { target: { value: SITEMAP_URL } });
    fireEvent.click(screen.getByRole('button', { name: 'Analyze Sitemap' }));

    expect(await screen.findByText('1,500')).toBeInTheDocument();
    expect(bodyOf(fetchMock)).toEqual({ url: SITEMAP_URL });
    for (const text of ['Depth 2', 'Last 7 days', '/blog', 'daily', 'High (0.8-1.0)', 'html (10)', 'example.org']) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
  });

  it('says when there is no changefreq or priority data', async () => {
    stubFetch(ok({ ...INSIGHTS, changefreqDistribution: [], priorityDistribution: [] }));
    renderTool(SitemapInsights);
    fireEvent.change(screen.getByPlaceholderText('https://example.com/sitemap.xml'), {
      target: { value: SITEMAP_URL },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Analyze Sitemap' }));

    expect(await screen.findByText('No changefreq data')).toBeInTheDocument();
    expect(screen.getByText('No priority data')).toBeInTheDocument();
  });

  it('shows failures and the working state', async () => {
    renderTool(SitemapInsights);
    fireEvent.change(screen.getByPlaceholderText('https://example.com/sitemap.xml'), {
      target: { value: SITEMAP_URL },
    });
    await failures('Analyze Sitemap', 'https://example.com/sitemap.xml', {
      server: 'Cannot analyze',
      fallback: 'Analysis failed',
    });

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
    fireEvent.click(screen.getByRole('button', { name: 'Analyze Sitemap' }));
    expect(await screen.findByRole('button', { name: 'Analyzing...' })).toBeDisabled();
    await act(async () => finish(jsonReply({}, { ok: false, status: 500 })));
  });
});

describe('sitemap-url-extractor', () => {
  const urls = Array.from({ length: 205 }, (_, i) => ({
    loc: `https://example.org/page-${i}`,
    ...(i === 0 ? { lastmod: '2026-10-01', changefreq: 'daily', priority: 0.8 } : {}),
  }));

  it('lists the URLs of a sitemap index, filters, copies and exports them', async () => {
    const fetchMock = stubFetch(
      ok({ urls, totalCount: 205, sitemapType: 'sitemapindex', childSitemaps: ['a.xml', 'b.xml'] })
    );
    renderTool(SitemapUrlExtractor);
    fireEvent.change(screen.getByPlaceholderText('https://example.com/sitemap.xml'), {
      target: { value: SITEMAP_URL },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Extract URLs' }));

    expect(await screen.findByText('Showing 200 of 205 URLs')).toBeInTheDocument();
    expect(bodyOf(fetchMock)).toEqual({ url: SITEMAP_URL, followIndex: true });
    expect(screen.getByText('Child Sitemaps')).toBeInTheDocument();
    expect(screen.getByText('2026-10-01')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Filter URLs...'), { target: { value: 'PAGE-17' } });
    await waitFor(() => expect(screen.queryByText('Showing 200 of 205 URLs')).not.toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Copy All URLs'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('https://example.org/page-17'));
    expect(await screen.findByText('URLs copied to clipboard!')).toBeInTheDocument();
    await clickAway();

    fireEvent.click(screen.getByLabelText('Export CSV'));
    expect(downloads).toContain('sitemap-urls.csv');
    expect(String(blobParts.at(-1)?.[0])).toContain('URL,Last Modified,Change Frequency,Priority');
  });

  it('exports every field of a URL, and shows plain urlsets', async () => {
    stubFetch(ok({ urls: urls.slice(0, 1), totalCount: 1, sitemapType: 'urlset' }));
    renderTool(SitemapUrlExtractor);
    fireEvent.change(screen.getByPlaceholderText('https://example.com/sitemap.xml'), {
      target: { value: SITEMAP_URL },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Extract URLs' }));
    await screen.findByText('https://example.org/page-0');
    expect(screen.queryByText('Child Sitemaps')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Export CSV'));

    expect(String(blobParts.at(-1)?.[0])).toContain('"https://example.org/page-0","2026-10-01","daily","0.8"');
  });

  it('shows failures and the working state', async () => {
    renderTool(SitemapUrlExtractor);
    fireEvent.change(screen.getByPlaceholderText('https://example.com/sitemap.xml'), {
      target: { value: SITEMAP_URL },
    });
    await failures('Extract URLs', 'https://example.com/sitemap.xml', {
      server: 'Not a sitemap',
      fallback: 'Extraction failed',
    });

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
    fireEvent.click(screen.getByRole('button', { name: 'Extract URLs' }));
    expect(await screen.findByRole('button', { name: 'Extracting...' })).toBeDisabled();
    await act(async () => finish(jsonReply({}, { ok: false, status: 500 })));
  });
});

describe('sitemap-compare', () => {
  const fill = () => {
    fireEvent.change(screen.getByPlaceholderText('https://example.com/sitemap-old.xml'), {
      target: { value: 'https://a.test/old.xml' },
    });
    fireEvent.change(screen.getByPlaceholderText('https://example.com/sitemap-new.xml'), {
      target: { value: 'https://a.test/new.xml' },
    });
  };
  const added = Array.from({ length: 30 }, (_, i) => ({
    loc: `https://a.test/new-${i}`,
    ...(i === 0 ? { lastmod: '2026-10-01' } : {}),
  }));
  const COMPARED = {
    added,
    removed: [{ loc: 'https://a.test/gone' }],
    modified: [
      { url: 'https://a.test/changed', oldLastmod: '2026-01-01', newLastmod: '2026-02-02' },
      { url: 'https://a.test/undated' },
    ],
    unchanged: 7,
    summary: { sitemap1Count: 10, sitemap2Count: 39, addedCount: 30, removedCount: 1, modifiedCount: 2 },
  };

  it('shows the summary and pages through added, removed and modified URLs', async () => {
    const fetchMock = stubFetch(ok(COMPARED));
    renderTool(SitemapCompare);
    expect(screen.getByRole('button', { name: 'Compare Sitemaps' })).toBeDisabled();
    expect(screen.getByText('Enter two sitemap URLs to compare')).toBeInTheDocument();

    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Compare Sitemaps' }));

    expect(await screen.findByText('Comparison Summary')).toBeInTheDocument();
    expect(bodyOf(fetchMock)).toEqual({ sitemap1Url: 'https://a.test/old.xml', sitemap2Url: 'https://a.test/new.xml' });
    expect(screen.getByText('https://a.test/new-0')).toBeInTheDocument();
    expect(screen.getByText('2026-10-01')).toBeInTheDocument();
    expect(screen.queryByText('https://a.test/new-29')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
    expect(await screen.findByText('https://a.test/new-29')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Removed \(1\)/ }));
    expect(await screen.findByText('https://a.test/gone')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Modified \(2\)/ }));
    expect(await screen.findByText('https://a.test/changed')).toBeInTheDocument();
    expect(screen.getByText('2026-02-02')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name: '10' }));
  });

  it('shows failures and the working state', async () => {
    renderTool(SitemapCompare);
    fill();
    await failures('Compare Sitemaps', 'https://example.com/sitemap-old.xml', {
      server: 'One sitemap failed',
      fallback: 'Comparison failed',
    });

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
    fireEvent.click(screen.getByRole('button', { name: 'Compare Sitemaps' }));
    expect(await screen.findByRole('button', { name: 'Comparing...' })).toBeDisabled();
    await act(async () => finish(jsonReply({}, { ok: false, status: 500 })));
  });
});

describe('sitemap-split-merge', () => {
  const SPLIT = {
    totalUrls: 25000,
    indexFile: '<sitemapindex/>',
    sitemaps: [
      { index: 1, urlCount: 10000, content: 'x'.repeat(2500) },
      { index: 2, urlCount: 10000, content: '<urlset/>' },
    ],
  };

  it('splits a sitemap and offers every file for download and copy', async () => {
    const fetchMock = stubFetch(ok(SPLIT));
    renderTool(SitemapSplitMerge);
    expect(screen.getByRole('button', { name: 'Split Sitemap' })).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText('https://example.com/sitemap.xml'), {
      target: { value: SITEMAP_URL },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Split Sitemap' }));

    expect(await screen.findByText('2 files')).toBeInTheDocument();
    expect(bodyOf(fetchMock)).toEqual({ url: SITEMAP_URL, urlsPerFile: 10000, baseFileName: 'sitemap' });

    fireEvent.click(screen.getByLabelText('Download All'));
    expect(downloads).toEqual(['sitemap-1.xml', 'sitemap-2.xml', 'sitemap-index.xml']);

    fireEvent.click(screen.getByRole('button', { name: /sitemap-1\.xml/ }));
    fireEvent.click(screen.getByRole('button', { name: /sitemap-2\.xml/ }));
    const downloadButtons = screen
      .getAllByRole('button', { name: /Download/ })
      .filter((b) => b.textContent === 'Download');
    fireEvent.click(downloadButtons[0]);
    expect(downloads.at(-1)).toBe('sitemap-index.xml');
    fireEvent.click(downloadButtons[1]);
    expect(downloads.at(-1)).toBe('sitemap-1.xml');
    fireEvent.click(downloadButtons[2]);
    expect(downloads.at(-1)).toBe('sitemap-2.xml');

    const copyButtons = screen.getAllByRole('button', { name: 'Copy' });
    fireEvent.click(copyButtons[0]);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('<sitemapindex/>');
    fireEvent.click(copyButtons[2]);
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith('<urlset/>');
    expect(await screen.findByText('Copied to clipboard!')).toBeInTheDocument();
    await clickAway();
  });

  it('changes the file size with the slider', async () => {
    const fetchMock = stubFetch(ok(SPLIT));
    renderTool(SitemapSplitMerge);
    fireEvent.change(screen.getByPlaceholderText('https://example.com/sitemap.xml'), {
      target: { value: SITEMAP_URL },
    });

    fireEvent.change(screen.getByRole('slider'), { target: { value: 5000 } });
    fireEvent.click(screen.getByRole('button', { name: 'Split Sitemap' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(bodyOf(fetchMock).urlsPerFile).toBe(5000);
  });

  it('shows failures and the working state', async () => {
    renderTool(SitemapSplitMerge);
    fireEvent.change(screen.getByPlaceholderText('https://example.com/sitemap.xml'), {
      target: { value: SITEMAP_URL },
    });
    await failures('Split Sitemap', 'https://example.com/sitemap.xml', {
      server: 'Cannot split',
      fallback: 'Split failed',
    });

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
    fireEvent.click(screen.getByRole('button', { name: 'Split Sitemap' }));
    expect(await screen.findByRole('button', { name: 'Splitting...' })).toBeDisabled();
    await act(async () => finish(jsonReply({}, { ok: false, status: 500 })));
  });
});

describe('sitemap-frequency-analyzer', () => {
  const FREQUENCY = {
    changefreqStats: [
      { freq: 'daily', count: 6, percentage: 60 },
      { freq: 'custom', count: 2, percentage: 20 },
    ],
    priorityStats: [
      { range: 'High (0.8-1.0)', count: 5 },
      { range: 'Medium (0.5-0.7)', count: 3 },
      { range: 'Low (0.0-0.4)', count: 1 },
    ],
    recommendations: ['Good: most URLs set changefreq', 'Consider adding priority', 'Over 50% of URLs lack priority'],
    urlsWithoutChangefreq: 2,
    urlsWithoutPriority: 1,
  };
  const url = () => screen.getByPlaceholderText(/Enter sitemap URL/);

  it('turns the answer into distributions, a total and recommendations', async () => {
    const fetchMock = stubFetch(ok(FREQUENCY));
    renderTool(SitemapFrequencyAnalyzer);
    expect(screen.getByText(/Enter a sitemap URL to analyze/)).toBeInTheDocument();

    fireEvent.change(url(), { target: { value: SITEMAP_URL } });
    fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));

    expect(await screen.findByText('Analysis Results')).toBeInTheDocument();
    expect(bodyOf(fetchMock)).toEqual({ url: SITEMAP_URL });
    expect(screen.getByText('10 URLs')).toBeInTheDocument();
    expect(screen.getByText('daily')).toBeInTheDocument();
    expect(screen.getByText('6 (60.0%)')).toBeInTheDocument();
    expect(screen.getByText('Priority High (0.8-1.0)')).toBeInTheDocument();
    expect(screen.getByText('Good: most URLs set changefreq')).toBeInTheDocument();
    expect(screen.getByText('Consider adding priority')).toBeInTheDocument();
  });

  it('copies and downloads the analysis', async () => {
    stubFetch(ok(FREQUENCY));
    renderTool(SitemapFrequencyAnalyzer);
    fireEvent.change(url(), { target: { value: SITEMAP_URL } });
    fireEvent.keyDown(url(), { key: 'Enter' });
    await screen.findByText('Analysis Results');

    fireEvent.click(screen.getByRole('button', { name: 'Copy JSON' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('"totalUrls": 10'));
    expect(await screen.findByText('Copied to clipboard!')).toBeInTheDocument();
    await clickAway();

    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(downloads).toContain('sitemap-frequency-analysis.json');
  });

  it('shows empty distributions and no recommendations', async () => {
    stubFetch(
      ok({
        changefreqStats: [],
        priorityStats: [],
        recommendations: [],
        urlsWithoutChangefreq: 4,
        urlsWithoutPriority: 4,
      })
    );
    renderTool(SitemapFrequencyAnalyzer);
    fireEvent.change(url(), { target: { value: SITEMAP_URL } });
    fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));

    expect(await screen.findByText('No changefreq values found in sitemap')).toBeInTheDocument();
    expect(screen.getByText('No priority values found in sitemap')).toBeInTheDocument();
    expect(screen.getByText(/Add changefreq and priority values/)).toBeInTheDocument();
  });

  it('asks for a URL, shows failures and the working state', async () => {
    renderTool(SitemapFrequencyAnalyzer);
    fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
    expect(await findAlert('Please enter a sitemap URL')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    fireEvent.change(url(), { target: { value: SITEMAP_URL } });
    stubFetch(jsonReply({ error: 'Not a sitemap' }, { ok: false, status: 400 }));
    fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
    expect(await findAlert('Not a sitemap')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    stubFetch(jsonReply({}, { ok: false, status: 500 }));
    fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
    expect(await findAlert('Frequency analysis failed')).toBeInTheDocument();
    await clickAway();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
    expect(await findAlert('Failed to analyze sitemap')).toBeInTheDocument();

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
    fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));
    expect(await screen.findByRole('button', { name: 'Analyzing' })).toBeDisabled();
    await act(async () => finish(jsonReply({}, { ok: false, status: 500 })));
    expect(within(document.body).queryByText('Analysis Results')).not.toBeInTheDocument();
  });
});

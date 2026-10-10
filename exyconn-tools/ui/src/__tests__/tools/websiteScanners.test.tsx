import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { clickAway, findAlert, jsonReply, renderTool, stubFetch } from '../helpers/toolHarness';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () =>
  (await import('../helpers/toolHarness')).toolLayoutStub()
);

import ContactExtractor from '../../tools/contact-extractor';
import SiteStructureAnalyzer from '../../tools/site-structure-analyzer';
import WebsitePageScanner from '../../tools/website-page-scanner';
import WebsiteUrlExtractor from '../../tools/website-url-extractor';

let downloads: string[];
let blobTexts: string[];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-10T10:00:00Z'));
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn() }, configurable: true });
  downloads = [];
  blobTexts = [];
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
        blobTexts.push(String(parts?.[0] ?? ''));
      }
    }
  );
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const bodyOf = (fetchMock: ReturnType<typeof stubFetch>) =>
  JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body));

async function failures(trigger: () => void, messages: { server: string; fallback: string }) {
  stubFetch(jsonReply({ error: messages.server }, { ok: false, status: 400 }));
  trigger();
  expect(await findAlert(messages.server)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  await waitFor(() => expect(screen.queryByText(messages.server)).not.toBeInTheDocument());

  stubFetch(jsonReply({}, { ok: false, status: 500 }));
  trigger();
  expect(await findAlert(messages.fallback)).toBeInTheDocument();
  await clickAway();
  await waitFor(() => expect(screen.queryByText(messages.fallback)).not.toBeInTheDocument());
}

describe('website-page-scanner', () => {
  const page = (n: number, statusCode: number, extra: Record<string, unknown> = {}) => ({
    url: `https://example.org/p${n}`,
    title: `Page ${n}`,
    description: n === 1 ? 'A description' : '',
    depth: n,
    statusCode,
    wordCount: 100 * n,
    headings: { h1: [`Heading ${n}`], h2: Array.from({ length: n === 1 ? 7 : 0 }, (_, i) => `Sub ${i}`), h3: [] },
    images: n,
    links: 2 * n,
    ...extra,
  });
  const SCAN = {
    totalPages: 4,
    pages: [page(1, 200), page(2, 301), page(3, 404, { title: '' }), page(4, 200, { statusCode: undefined })],
  };
  const run = () => {
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), { target: { value: 'https://example.org' } });
    fireEvent.click(screen.getByRole('button', { name: 'Scan Pages' }));
  };

  it('scans, summarises and expands each page', async () => {
    const fetchMock = stubFetch(jsonReply({ success: true, ...SCAN }));
    renderTool(WebsitePageScanner);
    expect(screen.getByRole('button', { name: 'Scan Pages' })).toBeDisabled();

    fireEvent.change(screen.getByRole('slider'), { target: { value: 10 } });
    run();

    expect(await screen.findByText('Pages Scanned')).toBeInTheDocument();
    expect(bodyOf(fetchMock)).toEqual({ url: 'https://example.org', maxPages: 10 });
    expect(screen.getByText('Page 1')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();

    const expanders = document.querySelectorAll('svg[data-testid="ExpandMoreIcon"]');
    fireEvent.click(expanders[0].closest('button') as HTMLElement);
    expect(await screen.findByText('A description')).toBeInTheDocument();
    expect(screen.getAllByText('H1 Headings').length).toBeGreaterThan(0);
    expect(screen.getByText('+2 more')).toBeInTheDocument();
    fireEvent.click(document.querySelector('svg[data-testid="ExpandLessIcon"]')!.closest('button') as HTMLElement);

    fireEvent.click(expanders[1].closest('button') as HTMLElement);
    fireEvent.click(expanders[2].closest('button') as HTMLElement);
    fireEvent.click(expanders[3].closest('button') as HTMLElement);
  });

  it('exports the scan as JSON', async () => {
    stubFetch(jsonReply({ success: true, ...SCAN }));
    renderTool(WebsitePageScanner);
    run();
    await screen.findByText('Pages Scanned');

    fireEvent.click(screen.getByLabelText('Export JSON'));

    expect(downloads).toEqual(['page-scan-results.json']);
    expect(JSON.parse(blobTexts.at(-1) ?? '{}')).toMatchObject({ totalPages: 4 });
  });

  it('shows failures and the working state', async () => {
    renderTool(WebsitePageScanner);
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), { target: { value: 'https://example.org' } });
    await failures(() => fireEvent.click(screen.getByRole('button', { name: 'Scan Pages' })), {
      server: 'Site blocked',
      fallback: 'Failed to scan pages',
    });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Scan Pages' }));
    expect(await findAlert('Failed to scan pages')).toBeInTheDocument();

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
    fireEvent.click(screen.getByRole('button', { name: 'Scan Pages' }));
    expect(await screen.findByRole('button', { name: 'Scanning...' })).toBeDisabled();
    expect(screen.getByText('Crawling pages, this may take a moment...')).toBeInTheDocument();
    await act(async () => finish(jsonReply({}, { ok: false, status: 500 })));
  });
});

describe('website-url-extractor', () => {
  const urls = Array.from({ length: 30 }, (_, i) => ({
    url: `https://example.org/${i % 2 === 0 ? 'a' : 'b'}${i}${i === 4 ? '.pdf' : ''}`,
    text: i === 0 ? 'Say "hi"' : `Link ${i}`,
    type: i % 3 === 0 ? 'external' : 'internal',
    isResource: i === 4,
  }));
  const EXTRACTED = { totalUrls: 30, internalCount: 20, externalCount: 10, resourceCount: 1, urls };
  const run = () => {
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), { target: { value: 'https://example.org' } });
    fireEvent.click(screen.getByRole('button', { name: 'Extract URLs' }));
  };

  it('shows counts, filters by kind and search, pages, copies and exports', async () => {
    const fetchMock = stubFetch(jsonReply({ success: true, ...EXTRACTED }));
    renderTool(WebsiteUrlExtractor);
    expect(screen.getByRole('button', { name: 'Extract URLs' })).toBeDisabled();

    run();

    expect(await screen.findByText('Total URLs')).toBeInTheDocument();
    expect(bodyOf(fetchMock)).toEqual({ url: 'https://example.org', maxUrls: 500 });
    expect(screen.getByText('Say "hi"')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'External' }));
    await waitFor(() => expect(screen.queryByText('Link 1')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Internal' }));
    expect(await screen.findByText('Link 1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Resource' }));
    expect(await screen.findByText('Link 4')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'All' }));

    fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'A4' } });
    await waitFor(() => expect(screen.queryByText('Link 1')).not.toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: '' } });

    fireEvent.click(screen.getByLabelText('Copy All'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('https://example.org/a0'));
    expect(await screen.findByText(/copied/i)).toBeInTheDocument();
    await clickAway();

    fireEvent.click(screen.getByLabelText('Export CSV'));
    expect(downloads).toEqual(['extracted-urls.csv']);
    expect(blobTexts.at(-1)).toContain('"Say ""hi"""');

    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name: '50' }));
  });

  it('says when nothing matches', async () => {
    stubFetch(jsonReply({ success: true, ...EXTRACTED, urls: [] }));
    renderTool(WebsiteUrlExtractor);
    run();

    expect(await screen.findByText(/click Extract to find all URLs/)).toBeInTheDocument();
  });

  it('shows failures and the working state', async () => {
    renderTool(WebsiteUrlExtractor);
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), { target: { value: 'https://example.org' } });
    await failures(() => fireEvent.click(screen.getByRole('button', { name: 'Extract URLs' })), {
      server: 'Unreachable',
      fallback: 'Failed to extract URLs',
    });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Extract URLs' }));
    expect(await findAlert('Failed to extract URLs')).toBeInTheDocument();

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

describe('site-structure-analyzer', () => {
  const pages = Array.from({ length: 30 }, (_, i) => ({
    url: `https://example.org/${i}`,
    title: i === 0 ? '' : `Title ${i}`,
    incomingLinks: i,
    outgoingLinks: 30 - i,
    depth: i % 6,
  }));
  const STRUCTURE = {
    baseUrl: 'https://example.org',
    totalPages: 30,
    totalInternalLinks: 120,
    maxDepth: 5,
    pages,
    orphanPages: [
      'https://example.org/o1',
      'https://example.org/o2',
      'https://example.org/o3',
      'https://example.org/o4',
    ],
  };
  const run = () => {
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), { target: { value: 'https://example.org' } });
    fireEvent.click(screen.getByRole('button', { name: 'Analyze Structure' }));
  };

  it('shows the overview, orphan pages and a sortable page table', async () => {
    const fetchMock = stubFetch(jsonReply({ success: true, ...STRUCTURE }));
    renderTool(SiteStructureAnalyzer);
    expect(screen.getByRole('button', { name: 'Analyze Structure' })).toBeDisabled();

    fireEvent.change(screen.getByRole('slider'), { target: { value: 15 } });
    run();

    expect(await screen.findByText('Pages Analyzed')).toBeInTheDocument();
    expect(bodyOf(fetchMock)).toEqual({ url: 'https://example.org', maxPages: 15 });
    expect(screen.getByText('+1 more')).toBeInTheDocument();
    expect(screen.getByText('Title 29')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Outgoing Links' }));
    expect(await screen.findByText('Title 1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Incoming Links' }));
    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name: '50' }));

    fireEvent.click(screen.getByLabelText('Export JSON'));
    expect(downloads).toEqual(['site-structure.json']);
  });

  it('shows a site with no orphans and no pages', async () => {
    stubFetch(jsonReply({ success: true, ...STRUCTURE, orphanPages: [], pages: [], totalPages: 0 }));
    renderTool(SiteStructureAnalyzer);
    run();

    expect(await screen.findByText('Pages Analyzed')).toBeInTheDocument();
    expect(screen.queryByText(/Pages with no incoming links/)).not.toBeInTheDocument();
  });

  it('shows failures and the working state', async () => {
    renderTool(SiteStructureAnalyzer);
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), { target: { value: 'https://example.org' } });
    await failures(() => fireEvent.click(screen.getByRole('button', { name: 'Analyze Structure' })), {
      server: 'Cannot crawl',
      fallback: 'Failed to analyze structure',
    });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'Analyze Structure' }));
    expect(await findAlert('Failed to analyze')).toBeInTheDocument();

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
    fireEvent.click(screen.getByRole('button', { name: 'Analyze Structure' }));
    expect(await screen.findByRole('button', { name: 'Analyzing...' })).toBeDisabled();
    expect(screen.getByText('Crawling and analyzing site structure...')).toBeInTheDocument();
    await act(async () => finish(jsonReply({}, { ok: false, status: 500 })));
  });
});

describe('contact-extractor', () => {
  const RESULT = {
    baseUrl: 'https://example.org',
    pagesScanned: 2,
    totalEmails: ['hello@example.org', 'sales@example.org'],
    totalPhones: ['+1 415 555 0198'],
    totalAddresses: [],
    socialLinks: {
      facebook: 'https://facebook.com/example',
      twitter: 'https://x.com/example',
      other: 'https://other.test/x',
    },
    pages: [
      {
        url: 'https://example.org/',
        title: 'Home',
        contacts: {
          emails: ['hello@example.org'],
          phones: ['+1 415 555 0198'],
          socialLinks: { facebook: 'https://facebook.com/example' },
          addresses: [],
        },
      },
      {
        url: 'https://example.org/blank',
        title: '',
        contacts: { emails: [], phones: [], socialLinks: {}, addresses: [] },
      },
    ],
  };
  const url = () => screen.getByLabelText('Website URL');

  async function extract(button: RegExp, data: unknown = RESULT) {
    const fetchMock = stubFetch(jsonReply({ success: true, data }));
    fireEvent.change(url(), { target: { value: 'https://example.org' } });
    await waitFor(() => expect(screen.getByRole('button', { name: button })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: button }));
    return fetchMock;
  }

  it('sends the chosen mode and shows emails, phones, social links and per-page results', async () => {
    renderTool(ContactExtractor);
    expect(screen.getByRole('button', { name: /Extract Pages Only/ })).toBeDisabled();

    fireEvent.change(screen.getByRole('slider'), { target: { value: 12 } });
    const fetchMock = await extract(/Extract Contacts/);
    await act(async () => {
      fireEvent.submit(document.querySelector('form') as HTMLFormElement);
    });

    expect(await screen.findByText('Extraction Results')).toBeInTheDocument();
    expect(bodyOf(fetchMock)).toEqual({
      url: 'https://example.org',
      maxPages: 12,
      followLinks: true,
      mode: 'contacts',
    });
    expect(screen.getByText('Emails (2)')).toBeInTheDocument();
    expect(screen.getByText('Phone Numbers (1)')).toBeInTheDocument();
    expect(screen.getByText('Social Media Links')).toBeInTheDocument();
    expect(screen.getByText('Page-by-Page Results')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Home'));
    expect(await screen.findAllByText('hello@example.org')).not.toHaveLength(0);
    fireEvent.click(screen.getByText('Home'));
    fireEvent.click(screen.getByText('Home'));
    fireEvent.click(screen.getAllByText('https://example.org/blank')[0]);
    expect(await screen.findByText('No contacts found on this page')).toBeInTheDocument();
  });

  it('sends the other two modes', async () => {
    renderTool(ContactExtractor);
    const pages = await extract(/Extract Pages Only/);
    await screen.findByText('Extraction Results');
    expect(bodyOf(pages).mode).toBe('pages');

    cleanup();
    renderTool(ContactExtractor);
    const all = await extract(/Extract All/);
    await screen.findByText('Extraction Results');
    expect(bodyOf(all).mode).toBe('all');
  });

  it('copies single values and whole lists, and shows the copied tick', async () => {
    renderTool(ContactExtractor);
    await extract(/Extract Contacts/);
    await screen.findByText('Extraction Results');

    fireEvent.click(screen.getByText('sales@example.org'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('sales@example.org');
    fireEvent.click(screen.getAllByText('+1 415 555 0198')[0]);
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith('+1 415 555 0198');
    fireEvent.click(screen.getByLabelText('Copy all emails'));
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith('hello@example.org\nsales@example.org');
    fireEvent.click(screen.getByLabelText('Copy all phones'));
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith('+1 415 555 0198');
    const socialCopies = document.querySelectorAll('li button');
    fireEvent.click(socialCopies[0]);
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith('https://facebook.com/example');
  });

  it('exports the contacts as CSV and JSON', async () => {
    renderTool(ContactExtractor);
    await extract(/Extract Contacts/);
    await screen.findByText('Export Contacts');

    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    fireEvent.click(screen.getByRole('button', { name: 'Export JSON' }));

    const stamp = Date.now();
    expect(downloads).toEqual([`contacts_example.org_${stamp}.csv`, `contacts_example.org_${stamp}.json`]);
    expect(blobTexts[0]).toContain('"Email","hello@example.org","https://example.org/"');
    expect(blobTexts[0]).toContain('"Social (facebook)"');
  });

  it('says when nothing was found, and offers no export', async () => {
    renderTool(ContactExtractor);
    await extract(/Extract Contacts/, { ...RESULT, totalEmails: [], totalPhones: [], socialLinks: {}, pages: [] });

    expect(await screen.findByText('No contacts found on this website')).toBeInTheDocument();
    expect(screen.queryByText('Export Contacts')).not.toBeInTheDocument();
  });

  it('validates the URL, and shows failures and the working state', async () => {
    renderTool(ContactExtractor);
    fireEvent.change(url(), { target: { value: 'nope' } });
    fireEvent.blur(url());
    expect(await screen.findByText('Please enter a valid URL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Extract Contacts/ })).toBeDisabled();

    fireEvent.change(url(), { target: { value: 'https://example.org' } });
    await waitFor(() => expect(screen.getByRole('button', { name: /Extract Contacts/ })).toBeEnabled());
    await failures(() => fireEvent.click(screen.getByRole('button', { name: /Extract Contacts/ })), {
      server: 'Site down',
      fallback: 'Failed to extract contacts',
    });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    fireEvent.click(screen.getByRole('button', { name: /Extract Contacts/ }));
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
    fireEvent.click(screen.getByRole('button', { name: /Extract Contacts/ }));
    expect(await screen.findByRole('button', { name: 'Extracting...' })).toBeDisabled();
    await act(async () => finish(jsonReply({}, { ok: false, status: 500 })));
    expect(within(document.body).queryByText('Extraction Results')).not.toBeInTheDocument();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { clickAway, findAlert, jsonReply, renderTool, stubFetch } from '../helpers/toolHarness';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () =>
  (await import('../helpers/toolHarness')).toolLayoutStub()
);

import SitemapFinder from '../../tools/sitemap-finder';

const RESULT = {
  baseUrl: 'https://example.org',
  totalUrls: 1204,
  robotsTxtExists: true,
  robotsTxtUrl: 'https://example.org/robots.txt',
  scanTime: 1530,
  checkedLocations: ['https://example.org/robots.txt', 'https://example.org/sitemap.xml'],
  sitemapsFound: [
    {
      url: 'https://example.org/sitemap_index.xml',
      type: 'index',
      urlCount: 2,
      isValid: true,
      size: '1.5 KB',
      lastModified: '2026-10-01',
    },
    { url: 'https://example.org/sitemap.xml', type: 'xml', urlCount: 1204, isValid: true },
    { url: 'https://example.org/sitemap.txt', type: 'txt', urlCount: 3, isValid: true },
    { url: 'https://example.org/sitemap.html', type: 'html', urlCount: 40, isValid: true },
    {
      url: 'https://example.org/odd.map',
      type: 'other',
      urlCount: 0,
      isValid: false,
      errorMessage: 'Failed to fetch sitemap',
    },
  ],
};

let downloads: Array<{ name: string; type: string }>;
let anchorClick: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn() }, configurable: true });
  downloads = [];
  const create = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const element = create(tag);
    if (tag === 'a') {
      Object.defineProperty(element, 'download', {
        set: (value: string) => downloads.push({ name: value, type: '' }),
        get: () => downloads.at(-1)?.name ?? '',
      });
    }
    return element;
  });
  anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  const real = Blob;
  vi.stubGlobal(
    'Blob',
    class extends real {
      constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options);
        (globalThis as { __lastBlob?: { parts?: BlobPart[]; options?: BlobPropertyBag } }).__lastBlob = {
          parts,
          options,
        };
      }
    }
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const lastBlob = () => (globalThis as { __lastBlob?: { parts: BlobPart[]; options: BlobPropertyBag } }).__lastBlob;
const url = () => screen.getByLabelText(/Website URL/);
const find = () => fireEvent.click(screen.getByRole('button', { name: 'Find Sitemaps' }));

async function scan() {
  const fetchMock = stubFetch(jsonReply({ success: true, data: RESULT }));
  renderTool(SitemapFinder);
  fireEvent.change(url(), { target: { value: 'https://example.org' } });
  find();
  await screen.findByText('Sitemap Results');
  return fetchMock;
}

describe('sitemap-finder', () => {
  it('posts the form values and shows the summary, each sitemap and the scan time', async () => {
    const fetchMock = await scan();

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      url: 'https://example.org',
      checkCommonPaths: true,
      parseRobotsTxt: true,
      maxDepth: 2,
    });
    expect(screen.getByText('5 sitemaps found')).toBeInTheDocument();
    expect(screen.getByText('1.53s')).toBeInTheDocument();
    for (const label of ['Sitemap Index', 'XML Sitemap', 'Text Sitemap', 'HTML Sitemap', 'Unknown']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText('1,204 URLs')).toBeInTheDocument();
    expect(screen.getByText('Size: 1.5 KB')).toBeInTheDocument();
    expect(screen.getByText('Modified: 2026-10-01')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch sitemap')).toBeInTheDocument();
    expect(screen.getByText('Checked 2 locations')).toBeInTheDocument();
  });

  it('copies one sitemap URL, and all of them', async () => {
    await scan();

    const copies = screen.getAllByRole('button', { name: 'Copy URL' });
    fireEvent.click(copies[0]);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.org/sitemap_index.xml');

    fireEvent.click(screen.getByRole('button', { name: 'Copy all sitemap URLs' }));
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(RESULT.sitemapsFound.map((s) => s.url).join('\n'));
  });

  it('exports the report as JSON, CSV and text, and copies the URLs', async () => {
    await scan();

    for (const [item, filename, mime] of [
      ['JSON', 'sitemap-report.json', 'application/json'],
      ['CSV', 'sitemap-report.csv', 'text/csv'],
      ['Text', 'sitemap-report.txt', 'text/plain'],
    ]) {
      fireEvent.click(screen.getByRole('button', { name: 'Download' }));
      fireEvent.click(await screen.findByRole('menuitem', { name: new RegExp(item) }));
      expect(downloads.at(-1)?.name).toBe(filename);
      expect(lastBlob()?.options.type).toBe(mime);
      await waitFor(() => expect(screen.queryByRole('menuitem')).not.toBeInTheDocument());
    }
    expect(anchorClick).toHaveBeenCalledTimes(3);
    expect(String(lastBlob()?.parts[0])).toContain('Sitemap Report for https://example.org');
    expect(String(lastBlob()?.parts[0])).toContain('robots.txt: Found');

    fireEvent.click(screen.getByRole('button', { name: 'Copy URLs' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(RESULT.sitemapsFound.map((s) => s.url).join('\n'));
    expect(await screen.findByRole('button', { name: 'Copied!' })).toBeInTheDocument();
  });

  it('puts the exported JSON together from the scan', async () => {
    await scan();

    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: /JSON/ }));

    const exported = JSON.parse(String(lastBlob()?.parts[0]));
    expect(exported).toMatchObject({
      baseUrl: 'https://example.org',
      totalSitemaps: 5,
      totalUrls: 1204,
      robotsTxtExists: true,
    });
    expect(exported.sitemaps[0]).toEqual({
      url: 'https://example.org/sitemap_index.xml',
      type: 'index',
      urlCount: 2,
      isValid: true,
      lastModified: '2026-10-01',
      size: '1.5 KB',
    });
  });

  it('reports robots.txt as missing in the text report', async () => {
    stubFetch(jsonReply({ success: true, data: { ...RESULT, robotsTxtExists: false } }));
    renderTool(SitemapFinder);
    fireEvent.change(url(), { target: { value: 'https://example.org' } });
    find();
    await screen.findByText('Sitemap Results');

    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: /Text/ }));

    expect(String(lastBlob()?.parts[0])).toContain('robots.txt: Not Found');
  });

  it('shows the checked locations when asked', async () => {
    await scan();

    fireEvent.click(screen.getByText('Checked 2 locations'));

    expect(await screen.findByText('https://example.org/robots.txt')).toBeVisible();
    fireEvent.click(screen.getByText('Checked 2 locations'));
  });

  it('says nothing was found, and offers no export', async () => {
    stubFetch(
      jsonReply({ success: true, data: { ...RESULT, sitemapsFound: [], totalUrls: 0, robotsTxtExists: false } })
    );
    renderTool(SitemapFinder);
    fireEvent.change(url(), { target: { value: 'https://example.org' } });
    find();

    expect(await screen.findByText(/No sitemaps were found/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
  });

  it('keeps the button disabled until a valid URL is typed, and says why', async () => {
    renderTool(SitemapFinder);
    expect(screen.getByRole('button', { name: 'Find Sitemaps' })).toBeDisabled();

    fireEvent.change(url(), { target: { value: 'not a url' } });
    fireEvent.blur(url());

    expect(await screen.findByText('Please enter a valid URL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Find Sitemaps' })).toBeDisabled();
  });

  it('sends the advanced options, and goes back to the defaults on reset', async () => {
    const fetchMock = stubFetch(jsonReply({ success: true, data: RESULT }));
    renderTool(SitemapFinder);
    fireEvent.change(url(), { target: { value: 'https://example.org' } });

    fireEvent.click(screen.getByText('Advanced Options'));
    fireEvent.click(screen.getByLabelText('Parse robots.txt for sitemap references'));
    fireEvent.click(screen.getByLabelText('Check common sitemap locations'));
    fireEvent.change(screen.getByRole('slider'), { target: { value: 4 } });
    await waitFor(() => expect(screen.getByRole('slider')).toHaveValue('4'));
    find();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      url: 'https://example.org',
      checkCommonPaths: false,
      parseRobotsTxt: false,
      maxDepth: 4,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    await waitFor(() => expect((url() as HTMLInputElement).value).toBe(''));
    fireEvent.click(screen.getByText('Advanced Options'));
  });

  it('shows the failure, a default message, and the working state', async () => {
    stubFetch(jsonReply({ success: false, error: 'Site refused' }, { ok: false, status: 400 }));
    renderTool(SitemapFinder);
    fireEvent.change(url(), { target: { value: 'https://example.org' } });
    find();
    expect(await findAlert('Site refused')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Site refused')).not.toBeInTheDocument());

    stubFetch(jsonReply({ success: false }));
    find();
    expect(await findAlert('Failed to find sitemaps')).toBeInTheDocument();
    await clickAway();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    find();
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
    find();
    expect(await screen.findByRole('button', { name: 'Finding Sitemaps...' })).toBeDisabled();
    await act(async () => finish(jsonReply({ success: false })));
    expect(within(document.body).queryByText('Sitemap Results')).not.toBeInTheDocument();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { clickAway, findAlert, renderTool } from '../helpers/toolHarness';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () =>
  (await import('../helpers/toolHarness')).toolLayoutStub()
);

import RobotsSitemapGenerator from '../../tools/robots-sitemap-generator';
import SitemapGenerator from '../../tools/sitemap-generator';
import SitemapIndexGenerator from '../../tools/sitemap-index-generator';

let downloads: string[];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-10T10:00:00Z'));
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn() }, configurable: true });
  downloads = [];
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
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const output = () => document.querySelector('textarea[readonly]:not([aria-hidden])') as HTMLElement;
const outputText = () => (output() as HTMLTextAreaElement | null)?.value ?? '';

describe('sitemap-generator', () => {
  it('asks for a URL before generating', async () => {
    renderTool(SitemapGenerator);

    fireEvent.click(screen.getByRole('button', { name: 'Generate Sitemap' }));

    expect(await findAlert('Add at least one URL')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Add at least one URL')).not.toBeInTheDocument());
  });

  it('dismisses the notice by clicking away', async () => {
    renderTool(SitemapGenerator);
    fireEvent.click(screen.getByRole('button', { name: 'Generate Sitemap' }));
    expect(await findAlert('Add at least one URL')).toBeInTheDocument();

    await clickAway();

    await waitFor(() => expect(screen.queryByText('Add at least one URL')).not.toBeInTheDocument());
  });

  it('builds the sitemap from listed and bulk URLs with the chosen defaults', async () => {
    renderTool(SitemapGenerator);

    fireEvent.change(screen.getByPlaceholderText('https://example.com/page'), { target: { value: 'https://a.test/' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getAllByPlaceholderText('https://example.com/page')).toHaveLength(2);
    fireEvent.change(screen.getAllByPlaceholderText('https://example.com/page')[1], {
      target: { value: 'https://a.test/two' },
    });
    expect(screen.getAllByRole('button', { name: /Add URLs/ })[0]).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('Paste URLs (one per line)'), {
      target: { value: ' https://a.test/bulk-1 \n\nhttps://a.test/bulk-2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add URLs' }));
    expect(screen.getAllByPlaceholderText('https://example.com/page')).toHaveLength(4);

    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name: /daily/i }));
    fireEvent.change(screen.getAllByRole('slider')[0], { target: { value: 0.8 } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Sitemap' }));

    await waitFor(() => expect(outputText()).toContain('<urlset'));
    const xml = outputText();
    expect(xml).toContain('<loc>https://a.test/</loc>');
    expect(xml).toContain('<loc>https://a.test/bulk-1</loc>');
    expect(xml).toContain('<lastmod>2026-10-10</lastmod>');
    expect(xml).toContain('<changefreq>weekly</changefreq>');
  });

  it('removes a URL row, but keeps the last one', () => {
    renderTool(SitemapGenerator);
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getAllByPlaceholderText('https://example.com/page')).toHaveLength(2);

    const rows = document.querySelectorAll(
      'button .MuiSvgIcon-root[data-testid="DeleteIcon"], button .MuiSvgIcon-root[data-testid="CloseIcon"]'
    );
    fireEvent.click(rows[0].closest('button') as HTMLElement);

    expect(screen.getAllByPlaceholderText('https://example.com/page')).toHaveLength(1);
    expect(rows[0].closest('button')).toBeTruthy();
    const remaining = document.querySelector('button[disabled] .MuiSvgIcon-root');
    expect(remaining).not.toBeNull();
  });

  it('copies and downloads the generated sitemap', async () => {
    renderTool(SitemapGenerator);
    fireEvent.change(screen.getByPlaceholderText('https://example.com/page'), { target: { value: 'https://a.test/' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Sitemap' }));
    await waitFor(() => expect(outputText()).toContain('<urlset'));

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('<loc>https://a.test/</loc>'));
    expect(await screen.findByText('Copied to clipboard!')).toBeInTheDocument();
    await clickAway();

    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(downloads).toEqual(['sitemap.xml']);
  });
});

describe('sitemap-index-generator', () => {
  it('asks for a sitemap URL before generating', async () => {
    renderTool(SitemapIndexGenerator);

    fireEvent.click(screen.getByRole('button', { name: 'Generate Sitemap Index' }));

    expect(await findAlert('Add at least one sitemap URL')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Add at least one sitemap URL')).not.toBeInTheDocument());
  });

  it('dismisses the notice by clicking away', async () => {
    renderTool(SitemapIndexGenerator);
    fireEvent.click(screen.getByRole('button', { name: 'Generate Sitemap Index' }));
    expect(await findAlert('Add at least one sitemap URL')).toBeInTheDocument();

    await clickAway();

    await waitFor(() => expect(screen.queryByText('Add at least one sitemap URL')).not.toBeInTheDocument());
  });

  it('builds the index from the listed sitemaps with their dates', async () => {
    renderTool(SitemapIndexGenerator);
    fireEvent.change(screen.getByPlaceholderText('https://example.com/sitemap-1.xml'), {
      target: { value: 'https://a.test/one.xml' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    const urlBoxes = screen.getAllByLabelText('Sitemap URL');
    expect(urlBoxes).toHaveLength(2);
    fireEvent.change(urlBoxes[1], { target: { value: 'https://a.test/two.xml' } });
    fireEvent.change(screen.getAllByLabelText('Last Modified')[1], { target: { value: '2026-01-02' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Sitemap Index' }));

    await waitFor(() => expect(outputText()).toContain('<sitemapindex'));
    const xml = outputText();
    expect(xml).toContain('<loc>https://a.test/one.xml</loc>');
    expect(xml).toContain('<lastmod>2026-10-10</lastmod>');
    expect(xml).toContain('<lastmod>2026-01-02</lastmod>');
  });

  it('removes a row, copies and downloads', async () => {
    renderTool(SitemapIndexGenerator);
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    const deletes = document.querySelectorAll('button .MuiSvgIcon-root[data-testid="DeleteIcon"]');
    fireEvent.click(deletes[0].closest('button') as HTMLElement);
    expect(screen.getAllByLabelText('Sitemap URL')).toHaveLength(1);
    expect(document.querySelector('button[disabled] .MuiSvgIcon-root[data-testid="DeleteIcon"]')).not.toBeNull();

    fireEvent.change(screen.getByLabelText('Sitemap URL'), { target: { value: 'https://a.test/one.xml' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Sitemap Index' }));
    await waitFor(() => expect(outputText()).toContain('<sitemapindex'));

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('sitemapindex'));
    expect(await screen.findByText('Copied to clipboard!')).toBeInTheDocument();
    await clickAway();
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(downloads).toEqual(['sitemap-index.xml']);
  });
});

describe('robots-sitemap-generator', () => {
  it('generates the default robots.txt', async () => {
    renderTool(RobotsSitemapGenerator);

    fireEvent.click(screen.getByRole('button', { name: 'Generate robots.txt' }));

    await waitFor(() => expect(outputText()).toContain('User-agent: *'));
    expect(outputText()).toContain('Allow: /');
    expect(outputText()).not.toContain('Crawl-delay');
  });

  it('builds rules with several bots, paths, a crawl delay and sitemaps', async () => {
    renderTool(RobotsSitemapGenerator);

    fireEvent.change(screen.getByPlaceholderText('https://example.com/sitemap.xml'), {
      target: { value: 'https://a.test/sitemap.xml' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Add' })[0]);
    expect(screen.getAllByPlaceholderText('https://example.com/sitemap.xml')).toHaveLength(2);
    fireEvent.change(screen.getAllByPlaceholderText('https://example.com/sitemap.xml')[1], { target: { value: '  ' } });

    fireEvent.click(screen.getByRole('button', { name: 'Add Rule' }));
    const agents = screen.getAllByRole('combobox');
    fireEvent.mouseDown(agents[1]);
    fireEvent.click(await screen.findByRole('option', { name: 'GPTBot' }));

    const addChips = screen.getAllByText('+');
    fireEvent.click(addChips[0]);
    fireEvent.click(addChips[1]);
    const pathBoxes = () => Array.from(document.querySelectorAll('.MuiChip-root input')) as HTMLInputElement[];
    expect(pathBoxes().length).toBeGreaterThan(2);
    fireEvent.change(pathBoxes()[0], { target: { value: '/private' } });
    fireEvent.change(pathBoxes()[pathBoxes().length - 1], { target: { value: ' ' } });

    fireEvent.change(screen.getAllByRole('slider')[0], { target: { value: 10 } });
    expect(screen.getByText(/Crawl Delay: 10 seconds/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Generate robots.txt' }));

    await waitFor(() => expect(outputText()).toContain('User-agent: GPTBot'));
    const text = outputText();
    expect(text).toContain('Disallow: /private');
    expect(text).toContain('Crawl-delay: 10');
    expect(text).toContain('Sitemap: https://a.test/sitemap.xml');
    expect(text.match(/Sitemap:/g)).toHaveLength(1);
    expect(text).not.toMatch(/Allow:\s*$/m);
  });

  it('removes a path, a rule and a sitemap, keeping the last of each', async () => {
    renderTool(RobotsSitemapGenerator);
    fireEvent.click(screen.getAllByRole('button', { name: 'Add' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Add Rule' }));
    expect(screen.getAllByPlaceholderText('https://example.com/sitemap.xml')).toHaveLength(2);

    const deletes = () => Array.from(document.querySelectorAll('button .MuiSvgIcon-root[data-testid="DeleteIcon"]'));
    fireEvent.click(deletes()[0].closest('button') as HTMLElement);
    expect(screen.getAllByPlaceholderText('https://example.com/sitemap.xml')).toHaveLength(1);

    const chipDeletes = document.querySelectorAll('.MuiChip-deleteIcon');
    expect(chipDeletes.length).toBeGreaterThan(0);
    fireEvent.click(chipDeletes[0]);

    const userAgentBoxes = screen.getAllByRole('combobox');
    expect(userAgentBoxes.length).toBe(2);
    const ruleDeletes = deletes().filter((icon) => !icon.closest('button')?.hasAttribute('disabled'));
    fireEvent.click(ruleDeletes[ruleDeletes.length - 1].closest('button') as HTMLElement);
    await waitFor(() => expect(screen.getAllByRole('combobox')).toHaveLength(1));
  });

  it('copies and downloads robots.txt', async () => {
    renderTool(RobotsSitemapGenerator);
    fireEvent.click(screen.getByRole('button', { name: 'Generate robots.txt' }));
    await waitFor(() => expect(outputText()).toContain('User-agent'));

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('User-agent: *'));
    expect(await screen.findByText('Copied to clipboard!')).toBeInTheDocument();
    await clickAway();
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(downloads).toEqual(['robots.txt']);
    expect(within(document.body).getByText(/Generated robots.txt/)).toBeInTheDocument();
  });
});

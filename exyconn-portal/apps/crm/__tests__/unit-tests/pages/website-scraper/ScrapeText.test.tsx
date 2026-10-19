import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScrapeText } from '../../../../src/pages/website-scraper/ScrapeText';
import { renderWithProviders } from '../../test-utils';
import { scrapeRow } from './scraper-fixtures';

const clipboard = vi.hoisted(() => ({ copy: vi.fn() }));

vi.mock('@exyconn/shell/utils/clipboard', () => ({ copyToClipboard: clipboard.copy }));

describe('ScrapeText', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the page text in a scrollable region with its length', () => {
    renderWithProviders(<ScrapeText scrape={scrapeRow()} />);

    expect(screen.getByRole('region', { name: 'Page text' })).toHaveTextContent(
      '# Acme We make anvils.',
    );
    expect(screen.getByText('22 characters')).toBeInTheDocument();
  });

  it('says how much was kept when the page was cut short', () => {
    renderWithProviders(<ScrapeText scrape={scrapeRow({ charCount: 90000 })} />);

    expect(
      screen.getByText('90,000 characters · Only the first 22 were kept.'),
    ).toBeInTheDocument();
  });

  it('copies the text and confirms it', async () => {
    clipboard.copy.mockResolvedValue(true);
    renderWithProviders(<ScrapeText scrape={scrapeRow()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(clipboard.copy).toHaveBeenCalledWith('# Acme\nWe make anvils.');
    expect(await screen.findByText('Page text copied')).toBeInTheDocument();
  });

  it('says so when the browser blocks the clipboard', async () => {
    clipboard.copy.mockResolvedValue(false);
    renderWithProviders(<ScrapeText scrape={scrapeRow()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(
      await screen.findByText('Could not copy: your browser blocked the clipboard'),
    ).toBeInTheDocument();
  });

  it('reports a copy that fails outright', async () => {
    clipboard.copy.mockRejectedValue(new Error('No clipboard API'));
    renderWithProviders(<ScrapeText scrape={scrapeRow()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(await screen.findByText('Could not copy the page text')).toBeInTheDocument();
  });
});

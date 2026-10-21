import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { ScrapeUrlForm } from '../../../../../../src/pages/website-scraper/forms/scrape-url';
import { renderWithProviders } from '../../../../test-utils';
import { fillField, press } from '../../../../form-helpers';

function renderForm({ initialUrl = '', scraping = false } = {}) {
  const onScrape = vi.fn();
  renderWithProviders(
    <ScrapeUrlForm initialUrl={initialUrl} scraping={scraping} onScrape={onScrape} />,
  );
  return onScrape;
}

describe('ScrapeUrlForm', () => {
  it('asks for a website before scraping', async () => {
    const onScrape = renderForm();

    await press('Scrape');

    expect(await screen.findByText('Enter a website address')).toBeInTheDocument();
    expect(onScrape).not.toHaveBeenCalled();
  });

  it('rejects text that is neither a domain nor a web address', async () => {
    const onScrape = renderForm();

    await fillField('Website', 'not a site');
    await press('Scrape');

    expect(
      await screen.findByText('Enter a website, e.g. example.com or https://example.com/about'),
    ).toBeInTheDocument();
    expect(onScrape).not.toHaveBeenCalled();
  });

  it('rejects an address longer than 2,000 characters', async () => {
    const onScrape = renderForm({ initialUrl: `https://acme.com/${'a'.repeat(2000)}` });

    await press('Scrape');

    expect(await screen.findByText('At most 2,000 characters')).toBeInTheDocument();
    expect(onScrape).not.toHaveBeenCalled();
  });

  it('scrapes a bare domain', async () => {
    const onScrape = renderForm();

    await fillField('Website', ' acme.com ');
    await press('Scrape');

    expect(onScrape).toHaveBeenCalledWith('acme.com');
  });

  it('starts from the prefilled address but waits for the person to submit it', async () => {
    const onScrape = renderForm({ initialUrl: 'https://acme.com/about' });

    expect(screen.getByLabelText(/^Website\s*\*?$/)).toHaveValue('https://acme.com/about');
    expect(onScrape).not.toHaveBeenCalled();

    await press('Scrape');
    expect(onScrape).toHaveBeenCalledWith('https://acme.com/about');
  });

  it('is locked while a scrape is running', () => {
    renderForm({ scraping: true });

    expect(screen.getByRole('button', { name: 'Scraping…' })).toBeDisabled();
    expect(screen.getByLabelText(/^Website\s*\*?$/)).toBeDisabled();
  });
});

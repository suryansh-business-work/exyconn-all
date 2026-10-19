import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeadRow } from '../../../../src/pages/lead-generator/LeadRow';
import type { EmailLookup, LeadPlace } from '../../../../src/pages/lead-generator/leadTypes';
import { renderWithProviders } from '../../test-utils';
import { foundLookup, leadPlace } from './lead-fixtures';

const scrollIntoView = vi.fn();

function renderRow(
  place: LeadPlace,
  { focused = false, lookup }: { focused?: boolean; lookup?: EmailLookup } = {},
) {
  const props = { onToggle: vi.fn(), onFocus: vi.fn() };
  renderWithProviders(
    <ul>
      <LeadRow
        place={place}
        number={3}
        checked={false}
        focused={focused}
        lookup={lookup}
        {...props}
      />
    </ul>,
  );
  return props;
}

describe('LeadRow', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows the numbered business with its type, phone, links and rating', () => {
    renderRow(leadPlace());

    expect(screen.getByText('3. Smile Dental')).toBeInTheDocument();
    expect(screen.getByText('Dentist · 12 MG Road, Pune')).toBeInTheDocument();
    expect(screen.getByText('+91 20 5555 0101')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Website' })).toHaveAttribute(
      'href',
      'https://smile.example',
    );
    expect(screen.getByRole('link', { name: "Scrape Smile Dental's website" })).toHaveAttribute(
      'href',
      `/tools/website-scraper?url=${encodeURIComponent('https://smile.example')}`,
    );
    expect(screen.getByText('4.6 (120 reviews)')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'In CRM' })).not.toBeInTheDocument();
  });

  it('leaves out what the business does not have, and any website that is not http(s)', () => {
    renderRow(
      leadPlace({
        primaryType: '',
        phone: '',
        website: 'ftp://smile.example',
        rating: null,
      }),
    );

    expect(screen.getByText('12 MG Road, Pune')).toBeInTheDocument();
    expect(screen.queryByText('+91 20 5555 0101')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Website' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Scrape/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/reviews/)).not.toBeInTheDocument();
  });

  it('counts no reviews when Google gives a rating without a count', () => {
    renderRow(leadPlace({ ratingCount: null }));

    expect(screen.getByText('4.6 (0 reviews)')).toBeInTheDocument();
  });

  it('links a business already in the CRM to its company', () => {
    renderRow(leadPlace({ existingCompanyId: 'company-9' }));

    expect(screen.getByRole('link', { name: 'In CRM' })).toHaveAttribute(
      'href',
      '/companies/company-9',
    );
  });

  it('lists the emails its website lookup found', () => {
    renderRow(leadPlace(), { lookup: foundLookup(['a@smile.example', 'b@smile.example']) });

    expect(screen.getByText('a@smile.example, b@smile.example')).toBeInTheDocument();
    expect(screen.getByText('2 emails found')).toBeInTheDocument();
  });

  it('ticks the row and focuses it on the map', async () => {
    const props = renderRow(leadPlace());

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Smile Dental' }));
    await userEvent.click(screen.getByText('3. Smile Dental'));

    expect(props.onToggle).toHaveBeenCalledWith('place-1');
    expect(props.onFocus).toHaveBeenCalledWith('place-1');
  });

  it('scrolls itself into view only when focused from the map', () => {
    renderRow(leadPlace());
    expect(scrollIntoView).not.toHaveBeenCalled();

    renderRow(leadPlace({ placeId: 'place-2' }), { focused: true });
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
  });
});

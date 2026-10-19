import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeadResults } from '../../../../src/pages/lead-generator/LeadResults';
import { renderWithProviders } from '../../test-utils';
import { foundLookup, leadPlace } from './lead-fixtures';

const a = leadPlace({ placeId: 'a', name: 'Alpha Dental' });
const b = leadPlace({ placeId: 'b', name: 'Beta Dental' });

function renderResults(overrides: Partial<Parameters<typeof LeadResults>[0]> = {}) {
  const props = {
    places: [a, b],
    total: 2,
    loading: false,
    error: null,
    searched: true,
    hasMore: false,
    checked: new Set(['b']),
    focusedId: null,
    lookups: { a: foundLookup(['hi@alpha.example']) },
    onToggle: vi.fn(),
    onFocus: vi.fn(),
    onLoadMore: vi.fn(),
    ...overrides,
  };
  renderWithProviders(<LeadResults {...props} />);
  return props;
}

describe('LeadResults', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('shows the search error instead of the list', () => {
    renderResults({ error: 'Places API is not enabled' });

    expect(screen.getByRole('alert')).toHaveTextContent('Places API is not enabled');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows a skeleton while the first page loads', () => {
    renderResults({ places: [], total: 0, loading: true });

    expect(screen.getByRole('status')).toHaveTextContent('Searching for businesses');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('prompts for a search before the first one', () => {
    renderResults({ places: [], total: 0, searched: false });

    expect(screen.getByRole('status')).toHaveTextContent(
      'Search for a kind of business in a place to see leads here.',
    );
  });

  it('says when a search found nothing', () => {
    renderResults({ places: [], total: 0 });

    expect(screen.getByRole('status')).toHaveTextContent(
      'No businesses matched. Try a broader search or another place.',
    );
  });

  it('says when the filters hide every loaded business', () => {
    renderResults({ places: [], total: 2 });

    expect(screen.getByRole('status')).toHaveTextContent('No businesses match these filters.');
  });

  it('numbers the businesses like their map markers, with their selection and emails', () => {
    renderResults();

    const list = screen.getByRole('list', { name: 'Businesses found' });
    expect(within(list).getByText('1. Alpha Dental')).toBeInTheDocument();
    expect(within(list).getByText('2. Beta Dental')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select Alpha Dental' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Select Beta Dental' })).toBeChecked();
    expect(screen.getByText('hi@alpha.example')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load 20 more' })).not.toBeInTheDocument();
  });

  it('marks the focused business as selected in the list', () => {
    renderResults({ focusedId: 'b' });

    expect(screen.getByText('2. Beta Dental').closest('[role="button"]')).toHaveClass(
      'Mui-selected',
    );
    expect(screen.getByText('1. Alpha Dental').closest('[role="button"]')).not.toHaveClass(
      'Mui-selected',
    );
  });

  it('loads the next page on request', async () => {
    const props = renderResults({ hasMore: true });

    await userEvent.click(screen.getByRole('button', { name: 'Load 20 more' }));

    expect(props.onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('keeps the list and blocks "load more" while the next page loads', () => {
    renderResults({ hasMore: true, loading: true });

    expect(screen.getByText('1. Alpha Dental')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Loading…' })).toBeDisabled();
  });
});

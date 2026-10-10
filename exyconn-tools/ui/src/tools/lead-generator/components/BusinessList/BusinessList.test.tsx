import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import BusinessList from './index';
import type { Business } from '../../types';

const FULL: Business = {
  placeId: 'p1',
  name: 'Corner "Cafe"',
  address: '1 Main St',
  location: { lat: 1, lng: 2 },
  types: ['cafe', 'food', 'point_of_interest', 'establishment', 'store', 'extra_type'],
  rating: 4.5,
  totalRatings: 120,
  phone: '+1 555 0100',
  website: 'https://cafe.example',
};
const BARE: Business = {
  placeId: 'p2',
  name: 'Bare Shop',
  address: '2 Side St',
  location: { lat: 3, lng: 4 },
  types: [],
};
const LOW: Business = { ...BARE, placeId: 'p3', name: 'Low Rated', rating: 3.1, totalRatings: 4 };

const readBlob = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn() }, configurable: true });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const renderList = (props: Partial<React.ComponentProps<typeof BusinessList>> = {}) => {
  const onBusinessSelect = vi.fn();
  const view = render(
    <BusinessList
      businesses={[FULL, BARE, LOW]}
      selectedBusiness={null}
      onBusinessSelect={onBusinessSelect}
      isLoading={false}
      {...props}
    />
  );
  return { ...view, onBusinessSelect };
};

describe('BusinessList', () => {
  it('shows a searching message while loading', () => {
    renderList({ isLoading: true });
    expect(screen.getByText('Searching for businesses...')).toBeInTheDocument();
    expect(screen.queryByText(/Found Businesses/)).toBeNull();
  });

  it('explains how to get results when there are none', () => {
    renderList({ businesses: [] });
    expect(screen.getByText(/No businesses found. Draw a polygon/)).toBeInTheDocument();
  });

  it('lists the businesses with their rating chips', () => {
    renderList();
    expect(screen.getByText('Found Businesses (3)')).toBeInTheDocument();
    expect(screen.getByText('Corner "Cafe"')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toHaveClass('MuiChip-label');
    expect(screen.getByText('3.1')).toBeInTheDocument();
    expect(screen.getByText('Bare Shop')).toBeInTheDocument();
    expect(screen.getAllByRole('separator')).toHaveLength(2);
  });

  it('selects a business and expands its details, collapsing it on a second click', async () => {
    const { onBusinessSelect } = renderList();
    fireEvent.click(screen.getByText('Corner "Cafe"'));
    expect(onBusinessSelect).toHaveBeenCalledWith(FULL);
    expect(await screen.findByText('+1 555 0100')).toBeInTheDocument();
    expect(screen.getByText('https://cafe.example')).toBeInTheDocument();
    expect(screen.getByText('4.5 (120 reviews)')).toBeInTheDocument();
    expect(screen.getByText('cafe')).toBeInTheDocument();
    expect(screen.getByText('point of interest')).toBeInTheDocument();
    expect(screen.queryByText('extra type')).toBeNull();

    fireEvent.click(screen.getByText('Corner "Cafe"'));
    await waitFor(() => expect(screen.queryByText('+1 555 0100')).toBeNull());
  });

  it('shows only the address for a business without phone, website, rating or types', async () => {
    renderList();
    fireEvent.click(screen.getByText('Bare Shop'));
    const details = (await screen.findAllByText('2 Side St'))[1];
    expect(details).toBeInTheDocument();
    expect(screen.queryByText(/reviews/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open Website' })).toBeNull();
  });

  it('copies the address and phone and shows Copied! briefly', async () => {
    renderList();
    fireEvent.click(screen.getByText('Corner "Cafe"'));
    await screen.findByText('+1 555 0100');

    const copyButtons = screen.getAllByRole('button', { name: 'Copy' });
    fireEvent.click(copyButtons[0]);
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith('1 Main St');
    expect(await screen.findByRole('button', { name: 'Copied!' })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Copy' })[0]);
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith('+1 555 0100');
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Copied!' })).toBeNull(), { timeout: 3000 });
  });

  it('opens the website in a new tab', async () => {
    const open = vi.spyOn(globalThis, 'open').mockImplementation(() => null);
    renderList();
    fireEvent.click(screen.getByText('Corner "Cafe"'));
    fireEvent.click(await screen.findByRole('button', { name: 'Open Website' }));
    expect(open).toHaveBeenCalledWith('https://cafe.example', '_blank');
  });

  it('exports the leads as a CSV named after today, with quotes escaped', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-03-04T10:00:00Z'));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    renderList();

    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));

    const blob = vi.mocked(URL.createObjectURL).mock.calls.at(-1)?.[0] as Blob;
    expect(blob.type).toBe('text/csv;charset=utf-8;');
    const csv = await readBlob(blob);
    expect(csv.split('\n')).toEqual([
      'Name,Address,Phone,Website,Rating,Reviews,Types',
      '"Corner ""Cafe""","1 Main St","+1 555 0100","https://cafe.example","4.5","120","cafe; food; point_of_interest; establishment; store; extra_type"',
      '"Bare Shop","2 Side St","","","","",""',
      '"Low Rated","2 Side St","","","3.1","4",""',
    ]);
    expect(click.mock.contexts[0]).toMatchObject({ download: 'leads_2026-03-04.csv' });
    expect(within(document.body).queryByRole('link')).toBeNull();
  });
});

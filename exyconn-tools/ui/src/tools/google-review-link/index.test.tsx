import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { apiOk, clickAway, jsonReply, renderTool, stubFetch } from '../../__tests__/helpers/toolHarness';
import { writeSecret } from '../../shared/services/secrets';
import GoogleReviewLink from './index';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () =>
  (await import('../../__tests__/helpers/toolHarness')).toolLayoutStub()
);

const LINK = 'https://search.google.com/local/writereview?placeid=';
const PLACES = [
  { name: 'Blue Bottle', address: '1 Main St', placeId: 'PLACE_A', rating: 4.5, totalReviews: 120 },
  { name: 'Corner Cafe', address: '2 Side St', placeId: 'PLACE_B', rating: null, totalReviews: 0 },
];

beforeEach(() => {
  localStorage.clear();
  writeSecret('google_places_api_key', 'places-key');
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn() }, configurable: true });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  localStorage.clear();
});

const search = (query = 'Blue Bottle Oakland') => {
  fireEvent.change(screen.getByLabelText('Business Name & City'), { target: { value: query } });
  fireEvent.click(screen.getByRole('button', { name: 'Search Business' }));
};

const openManualTab = () => fireEvent.click(screen.getByRole('tab', { name: 'Manual ID' }));

describe('google-review-link search', () => {
  it('posts the query with the stored Places key and lists the businesses found', async () => {
    const fetchMock = stubFetch(apiOk({ results: PLACES }));
    renderTool(GoogleReviewLink);
    expect(screen.getByRole('button', { name: 'Search Business' })).toBeDisabled();

    search();

    expect(await screen.findByText('Select Your Business')).toBeInTheDocument();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({ query: 'Blue Bottle Oakland', apiKey: 'places-key' });
    expect(screen.getByText('Blue Bottle')).toBeInTheDocument();
    expect(screen.getByText('4.5 (120)')).toBeInTheDocument();
    expect(screen.getByText('Corner Cafe')).toBeInTheDocument();
    expect(screen.getAllByText('Select')).toHaveLength(2);
  });

  it('searches when Enter is pressed, and ignores Enter on a blank query', async () => {
    const fetchMock = stubFetch(apiOk({ results: PLACES }));
    renderTool(GoogleReviewLink);
    const box = screen.getByLabelText('Business Name & City');

    fireEvent.keyDown(box, { key: 'Enter' });
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.change(box, { target: { value: 'Cafe' } });
    fireEvent.keyDown(box, { key: 'a' });
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.keyDown(box, { key: 'Enter' });

    expect(await screen.findByText('Select Your Business')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('asks for the Places key instead of searching when none is stored', async () => {
    localStorage.clear();
    const fetchMock = stubFetch();
    renderTool(GoogleReviewLink);

    search();

    expect(await screen.findByText(/required/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the API error, a fallback message and an empty-result notice', async () => {
    stubFetch(jsonReply({ success: false, error: 'Quota exceeded' }));
    renderTool(GoogleReviewLink);
    search();
    expect(await screen.findByText('Quota exceeded')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByText('Quota exceeded')).toBeNull());

    stubFetch(jsonReply({ success: false }));
    fireEvent.click(screen.getByRole('button', { name: 'Search Business' }));
    expect(await screen.findByText('Search failed')).toBeInTheDocument();
    await clickAway();
    await waitFor(() => expect(screen.queryByText('Search failed')).toBeNull());

    stubFetch(apiOk({ results: [] }));
    fireEvent.click(screen.getByRole('button', { name: 'Search Business' }));
    expect(await screen.findByText('No businesses found. Try a more specific search.')).toBeInTheDocument();
  });

  it('treats a reply without results as no businesses found', async () => {
    stubFetch(apiOk({}));
    renderTool(GoogleReviewLink);
    search();
    expect(await screen.findByText('No businesses found. Try a more specific search.')).toBeInTheDocument();
  });

  it('shows a generic message when the request fails with a non-Error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('offline'));
    renderTool(GoogleReviewLink);
    search();
    expect(await screen.findByText('Search failed')).toBeInTheDocument();
  });

  it('shows the network error message when the request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network down')));
    renderTool(GoogleReviewLink);
    search();
    expect(await screen.findByText('Network down')).toBeInTheDocument();
  });
});

describe('google-review-link link actions', () => {
  it('builds the review link for the business picked from the table, by row or chip', async () => {
    stubFetch(apiOk({ results: PLACES }));
    renderTool(GoogleReviewLink);
    search();

    fireEvent.click(await screen.findByText('Blue Bottle'));
    expect(screen.getByText(`${LINK}PLACE_A`)).toBeInTheDocument();

    fireEvent.click(screen.getAllByText('Select')[1]);
    expect(screen.getByText(`${LINK}PLACE_B`)).toBeInTheDocument();

    openManualTab();
    expect(screen.getByLabelText('Google Place ID')).toHaveValue('PLACE_B');
  });

  it('generates a link from a typed Place ID with whitespace trimmed', () => {
    renderTool(GoogleReviewLink);
    openManualTab();
    expect(screen.getByRole('button', { name: 'Generate Link' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Google Place ID Finder' })).toHaveAttribute(
      'href',
      'https://developers.google.com/maps/documentation/places/web-service/place-id'
    );

    fireEvent.change(screen.getByLabelText('Google Place ID'), { target: { value: '  ChIJabc  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Link' }));

    expect(screen.getByText(`${LINK}ChIJabc`)).toBeInTheDocument();
    expect(screen.queryByText(/Search for your business or enter a Place ID/)).toBeNull();
  });

  it('copies the link and shows Copied! briefly', async () => {
    renderTool(GoogleReviewLink);
    openManualTab();
    fireEvent.change(screen.getByLabelText('Google Place ID'), { target: { value: 'ChIJabc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Link' }));

    fireEvent.click(screen.getByRole('button', { name: 'Copy Link' }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(`${LINK}ChIJabc`);
    expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Copy Link' })).toBeInTheDocument(), {
      timeout: 3000,
    });
  });

  it('opens the link and the email and WhatsApp share targets', () => {
    const open = vi.spyOn(globalThis, 'open').mockImplementation(() => null);
    renderTool(GoogleReviewLink);
    openManualTab();
    fireEvent.change(screen.getByLabelText('Google Place ID'), { target: { value: 'ChIJabc' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Link' }));

    fireEvent.click(screen.getByRole('button', { name: 'Test Link' }));
    expect(open).toHaveBeenLastCalledWith(`${LINK}ChIJabc`, '_blank');

    fireEvent.click(screen.getByText('Share via Email'));
    expect(open).toHaveBeenLastCalledWith(
      `mailto:?subject=Leave us a review&body=${encodeURIComponent(`${LINK}ChIJabc`)}`
    );

    fireEvent.click(screen.getByText('Share via WhatsApp'));
    expect(open).toHaveBeenLastCalledWith(
      `https://wa.me/?text=${encodeURIComponent(`Please leave us a review: ${LINK}ChIJabc`)}`
    );
  });
});

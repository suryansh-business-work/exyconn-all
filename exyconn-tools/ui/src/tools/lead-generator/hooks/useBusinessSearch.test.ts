import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  installGoogleMaps,
  placeAt,
  uninstallGoogleMaps,
  type GoogleMapsFake,
} from '../../../__tests__/helpers/fakeGoogleMaps';
import { useBusinessSearch } from './useBusinessSearch';

/** A 10 x 10 degree square: (5, 5) is inside it, (20, 20) is not. */
const SQUARE = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 10 },
  { lat: 10, lng: 10 },
  { lat: 10, lng: 0 },
];

let maps: GoogleMapsFake;

beforeEach(() => {
  vi.useFakeTimers();
  maps = installGoogleMaps();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  uninstallGoogleMaps();
});

/** Runs a search to completion, advancing the courtesy delays between Places calls. */
async function search(
  hook: ReturnType<typeof renderHook<ReturnType<typeof useBusinessSearch>, unknown>>,
  args: Parameters<ReturnType<typeof useBusinessSearch>['handleSearch']>
) {
  await act(async () => {
    const run = hook.result.current.handleSearch(...args);
    await vi.advanceTimersByTimeAsync(10_000);
    await run;
  });
}

describe('useBusinessSearch', () => {
  it('asks for a polygon with at least 3 points before searching', async () => {
    const hook = renderHook(() => useBusinessSearch());
    await search(hook, [SQUARE.slice(0, 2), 'pizza', [], 10]);
    expect(hook.result.current.error).toBe('Please draw a polygon with at least 3 points');
    expect(hook.result.current.isSearching).toBe(false);
    expect(maps.nearbySearch).not.toHaveBeenCalled();
  });

  it('reports a missing Places library', async () => {
    uninstallGoogleMaps();
    const hook = renderHook(() => useBusinessSearch());
    await search(hook, [SQUARE, 'pizza', [], 10]);
    expect(hook.result.current.error).toBe('Google Places library not loaded. Please refresh the page.');
    expect(hook.result.current.isSearching).toBe(false);
  });

  it('searches around the polygon centre with the query as keyword and keeps places inside the polygon', async () => {
    maps.searchAnswers.push({
      status: 'OK',
      results: [
        placeAt(5, 5, { rating: 4.5, user_ratings_total: 120, types: ['restaurant', 'food'] }),
        placeAt(20, 20),
      ],
    });
    maps.details = { formatted_phone_number: '+1 555 0100', website: 'https://shop.example' };
    const hook = renderHook(() => useBusinessSearch());

    await search(hook, [SQUARE, 'pizza place', ['cafe'], 10]);

    const [request] = maps.nearbySearch.mock.calls[0] as [
      { location: { lat: number; lng: number }; radius: number; keyword: string },
    ];
    expect(request.keyword).toBe('pizza place');
    expect(request.location).toMatchObject({ lat: 5, lng: 5 });
    // The furthest corner is sqrt(50) degrees away: 7.07 * 111000 m, under the 50 km cap -> capped.
    expect(request.radius).toBe(50000);
    expect(maps.nearbySearch).toHaveBeenCalledTimes(1);
    expect(hook.result.current.businesses).toEqual([
      {
        placeId: 'place-5-5',
        name: 'Shop 5-5',
        address: 'Main Street',
        location: { lat: 5, lng: 5 },
        phone: '+1 555 0100',
        website: 'https://shop.example',
        rating: 4.5,
        totalRatings: 120,
        types: ['restaurant', 'food'],
        isOpen: undefined,
      },
    ]);
    expect(maps.getDetails).toHaveBeenCalledWith(
      { placeId: 'place-5-5', fields: ['formatted_phone_number', 'website'] },
      expect.any(Function)
    );
    expect(hook.result.current.successMessage).toBe('Found 1 businesses in the selected area');
    expect(hook.result.current.error).toBeNull();
  });

  it('uses a radius from the polygon size when it is under the cap', async () => {
    const small = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 0.2 },
      { lat: 0.2, lng: 0.2 },
      { lat: 0.2, lng: 0 },
    ];
    maps.searchAnswers.push({ status: 'ZERO_RESULTS', results: [] });
    const hook = renderHook(() => useBusinessSearch());
    await search(hook, [small, 'x', [], 10]);
    const [request] = maps.nearbySearch.mock.calls[0] as [{ radius: number }];
    expect(request.radius).toBeCloseTo(Math.sqrt(0.02) * 111000, 3);
  });

  it('falls back to the selected categories, with underscores as spaces, then to "business"', async () => {
    const hook = renderHook(() => useBusinessSearch());
    await search(hook, [SQUARE, '   ', ['gas_station', 'cafe'], 10]);
    expect(maps.nearbySearch.mock.calls.map(([request]) => (request as { keyword: string }).keyword)).toEqual([
      'gas station',
      'cafe',
    ]);

    maps.nearbySearch.mockClear();
    await search(hook, [SQUARE, '', [], 10]);
    expect(maps.nearbySearch.mock.calls.map(([request]) => (request as { keyword: string }).keyword)).toEqual([
      'business',
    ]);
  });

  it('stops at the maximum number of results and skips the remaining categories', async () => {
    maps.searchAnswers.push({
      status: 'OK',
      results: [placeAt(1, 1), placeAt(2, 2), placeAt(3, 3)],
    });
    maps.details = null;
    const hook = renderHook(() => useBusinessSearch());

    await search(hook, [SQUARE, '', ['cafe', 'gym'], 2]);

    expect(hook.result.current.businesses.map((b) => b.placeId)).toEqual(['place-1-1', 'place-2-2']);
    expect(maps.nearbySearch).toHaveBeenCalledTimes(1);
    expect(hook.result.current.businesses[0].phone).toBeUndefined();
    expect(hook.result.current.successMessage).toBe('Found 2 businesses in the selected area');
  });

  it('merges categories, ignores duplicates, places without a location and failed searches', async () => {
    maps.searchAnswers.push(
      { status: 'OK', results: [placeAt(1, 1)] },
      { status: 'OK', results: [placeAt(1, 1), { place_id: 'no-geo', name: 'Nowhere' }, placeAt(2, 2)] },
      { status: 'OVER_QUERY_LIMIT', results: [placeAt(3, 3)] },
      { status: 'OK', results: null }
    );
    const hook = renderHook(() => useBusinessSearch());

    await search(hook, [SQUARE, '', ['a', 'b', 'c', 'd'], 10]);

    expect(hook.result.current.businesses.map((b) => b.placeId)).toEqual(['place-1-1', 'place-2-2']);
    expect(maps.nearbySearch).toHaveBeenCalledTimes(4);
  });

  it('fills in defaults for a sparse place', async () => {
    maps.searchAnswers.push({
      status: 'OK',
      results: [
        { geometry: { location: { lat: () => 5, lng: () => 5 } } },
        placeAt(6, 6, {
          name: 'Open Late',
          vicinity: undefined,
          formatted_address: '6 Late Road',
          opening_hours: { isOpen: () => true },
        }),
      ],
    });
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000000');
    const hook = renderHook(() => useBusinessSearch());

    await search(hook, [SQUARE, 'x', [], 10]);

    const [anonymous, openLate] = hook.result.current.businesses;
    expect(anonymous).toMatchObject({
      placeId: '00000000-0000-4000-8000-000000000000',
      name: 'Unknown',
      address: '',
      types: [],
    });
    expect(openLate).toMatchObject({ name: 'Open Late', address: '6 Late Road', isOpen: true });
  });

  it('reports when nothing was found', async () => {
    const hook = renderHook(() => useBusinessSearch());
    await search(hook, [SQUARE, 'x', [], 10]);
    expect(hook.result.current.error).toBe(
      'No businesses found in the selected area. Try expanding the polygon or changing search terms.'
    );
    expect(hook.result.current.successMessage).toBeNull();
    expect(hook.result.current.isSearching).toBe(false);
  });

  it('reports a failure of the Places service and logs it', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    maps.placesServiceError = new Error('bad key');
    const hook = renderHook(() => useBusinessSearch());

    await search(hook, [SQUARE, 'x', [], 10]);

    expect(hook.result.current.error).toBe('Failed to search for businesses. Please check your API key and try again.');
    expect(log).toHaveBeenCalledWith('Search error:', expect.any(Error));
    expect(hook.result.current.isSearching).toBe(false);
  });

  it('lets the caller clear the results and the messages', async () => {
    maps.searchAnswers.push({ status: 'OK', results: [placeAt(5, 5)] });
    const hook = renderHook(() => useBusinessSearch());
    await search(hook, [SQUARE, 'x', [], 10]);
    expect(hook.result.current.businesses).toHaveLength(1);

    act(() => {
      hook.result.current.setBusinesses([]);
      hook.result.current.setSuccessMessage(null);
      hook.result.current.setError('boom');
    });
    expect(hook.result.current.businesses).toEqual([]);
    expect(hook.result.current.successMessage).toBeNull();
    expect(hook.result.current.error).toBe('boom');
  });

  it('shows the searching state while Places is still answering', async () => {
    let answer: () => void = () => undefined;
    maps.nearbySearch.mockImplementation((_request: unknown, callback: (r: unknown, s: string) => void) => {
      answer = () => callback([], 'ZERO_RESULTS');
    });
    const hook = renderHook(() => useBusinessSearch());
    let run: Promise<void> = Promise.resolve();
    await act(async () => {
      run = hook.result.current.handleSearch(SQUARE, 'x', [], 10);
    });
    expect(hook.result.current.isSearching).toBe(true);
    expect(hook.result.current.businesses).toEqual([]);

    await act(async () => {
      answer();
      await vi.advanceTimersByTimeAsync(10_000);
      await run;
    });
    expect(hook.result.current.isSearching).toBe(false);
  });
});

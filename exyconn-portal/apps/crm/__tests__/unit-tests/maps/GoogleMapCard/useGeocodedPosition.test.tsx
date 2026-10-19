import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useGeocodedPosition } from '../../../../src/maps/GoogleMapCard/useGeocodedPosition';

const geocode = vi.fn();

/** Settles the next geocode by hand, to test answers that arrive after unmount. */
function deferGeocode() {
  const deferred: { resolve: (value: unknown) => void; reject: (error: unknown) => void } = {
    resolve: () => undefined,
    reject: () => undefined,
  };
  geocode.mockReturnValueOnce(
    new Promise((resolve, reject) => {
      deferred.resolve = resolve;
      deferred.reject = reject;
    }),
  );
  return deferred;
}

const found = (lat: number, lng: number) => ({
  results: [{ geometry: { location: { toJSON: () => ({ lat, lng }) } } }],
});

describe('useGeocodedPosition', () => {
  beforeEach(() => {
    vi.stubGlobal('google', {
      maps: {
        Geocoder: class {
          geocode = geocode;
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    geocode.mockReset();
  });

  it('stays idle while disabled or without an address', () => {
    expect(renderHook(() => useGeocodedPosition('Pune', false)).result.current).toEqual({
      status: 'idle',
    });
    expect(renderHook(() => useGeocodedPosition('', true)).result.current).toEqual({
      status: 'idle',
    });
    expect(geocode).not.toHaveBeenCalled();
  });

  it('is loading, then found at the first result', async () => {
    const pending = deferGeocode();
    const { result } = renderHook(() => useGeocodedPosition('1 Main St, Pune', true));

    expect(result.current).toEqual({ status: 'loading' });
    expect(geocode).toHaveBeenCalledWith({ address: '1 Main St, Pune' });
    pending.resolve(found(18.52, 73.85));

    await waitFor(() =>
      expect(result.current).toEqual({ status: 'found', position: { lat: 18.52, lng: 73.85 } }),
    );
  });

  it('is missing when Google has no result', async () => {
    geocode.mockResolvedValueOnce({ results: [] });
    const { result } = renderHook(() => useGeocodedPosition('Nowhere', true));

    await waitFor(() => expect(result.current).toEqual({ status: 'missing' }));
  });

  it('is missing, and logs, when geocoding fails', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const failure = new Error('ZERO_RESULTS');
    geocode.mockRejectedValueOnce(failure);
    const { result } = renderHook(() => useGeocodedPosition('Nowhere', true));

    await waitFor(() => expect(result.current).toEqual({ status: 'missing' }));
    expect(warn).toHaveBeenCalledWith('crm: geocoding an address for the map failed', failure);
  });

  it('ignores an answer that arrives after the address changed', async () => {
    const stale = deferGeocode();
    const failed = deferGeocode();
    const fresh = deferGeocode();
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const { result, rerender } = renderHook(({ address }) => useGeocodedPosition(address, true), {
      initialProps: { address: 'Old St' },
    });
    rerender({ address: 'Broken St' });
    rerender({ address: 'New St' });

    stale.resolve(found(1, 1));
    failed.reject(new Error('late failure'));
    fresh.resolve(found(2, 2));

    await waitFor(() =>
      expect(result.current).toEqual({ status: 'found', position: { lat: 2, lng: 2 } }),
    );
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

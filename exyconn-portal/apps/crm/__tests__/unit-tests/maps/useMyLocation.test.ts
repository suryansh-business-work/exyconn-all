import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useMyLocation } from '../../../src/maps/useMyLocation';

const failure = (code: number) =>
  ({ code, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }) as GeolocationPositionError;

function withBrowser(getCurrentPosition: Geolocation['getCurrentPosition']) {
  vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition } });
}

describe('useMyLocation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('asks the browser only when told to, and keeps the position', () => {
    const ask = vi.fn((done: PositionCallback) =>
      done({ coords: { latitude: 1.5, longitude: 2.5 } } as GeolocationPosition),
    );
    withBrowser(ask);
    const { result } = renderHook(() => useMyLocation());
    expect(ask).not.toHaveBeenCalled();

    act(() => result.current.locate());

    expect(result.current).toMatchObject({
      position: { lat: 1.5, lng: 2.5 },
      locating: false,
      error: null,
    });
  });

  it('is locating until the browser answers', () => {
    withBrowser(vi.fn());
    const { result } = renderHook(() => useMyLocation());

    act(() => result.current.locate());

    expect(result.current.locating).toBe(true);
  });

  it.each([
    [1, 'Location access is blocked. Allow it for this site in the browser, then try again.'],
    [3, 'Finding your location took too long. Try again.'],
    [2, 'Your location could not be found. Try again, or enter the coordinates.'],
  ])('explains failure %i and logs only its code', (code, message) => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    withBrowser((_done, fail) => fail?.(failure(code)));
    const { result } = renderHook(() => useMyLocation());

    act(() => result.current.locate());

    expect(result.current).toMatchObject({ position: null, locating: false, error: message });
    expect(warn).toHaveBeenCalledWith('crm: browser location unavailable', { code });
  });

  it('says so when the browser cannot share a location at all', () => {
    vi.stubGlobal('navigator', {});
    const { result } = renderHook(() => useMyLocation());

    act(() => result.current.locate());

    expect(result.current.error).toBe(
      'This browser cannot share its location. Enter the coordinates instead.',
    );
  });
});

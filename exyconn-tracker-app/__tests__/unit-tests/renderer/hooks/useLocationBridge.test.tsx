// @vitest-environment jsdom
import { act, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LocationRequest, LocationResult } from '@shared/types';
import useLocationBridge from '../../../../src/renderer/hooks/useLocationBridge';
import { flush, render, stubTracker, unmountAll } from '../../test-utils';

function Probe(): ReactElement {
  useLocationBridge();
  return <span />;
}

type Listener = (request: LocationRequest) => void;
type Success = (position: GeolocationPosition) => void;
type Failure = (error: GeolocationPositionError) => void;

let listener: Listener = () => undefined;
const unsubscribe = vi.fn();
const sendLocationResult = vi.fn<(result: LocationResult) => void>();
const getCurrentPosition = vi.fn<(ok: Success, fail: Failure, options: PositionOptions) => void>();

async function install(): Promise<void> {
  stubTracker({
    onLocationRequested: (next: Listener) => {
      listener = next;
      return unsubscribe;
    },
    sendLocationResult,
  });
  Object.defineProperty(navigator, 'geolocation', {
    value: { getCurrentPosition },
    configurable: true,
  });
  await render(<Probe />);
}

async function request(): Promise<void> {
  act(() => listener({ id: 'l1' }));
  await flush();
}

afterEach(() => {
  unmountAll();
  getCurrentPosition.mockReset();
  sendLocationResult.mockClear();
  unsubscribe.mockClear();
});

describe('useLocationBridge', () => {
  it('answers main with one high-accuracy fix from the OS location service', async () => {
    getCurrentPosition.mockImplementation((ok) =>
      ok({
        coords: { latitude: 12.97, longitude: 77.59, accuracy: 30 },
        timestamp: Date.UTC(2026, 8, 14, 4),
      } as GeolocationPosition),
    );
    await install();
    await request();

    expect(getCurrentPosition.mock.calls[0][2]).toEqual({
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 60_000,
    });
    expect(sendLocationResult).toHaveBeenCalledWith({
      id: 'l1',
      location: {
        lat: 12.97,
        lng: 77.59,
        accuracyM: 30,
        source: 'SYSTEM',
        capturedAt: '2026-09-14T04:00:00.000Z',
      },
      error: null,
    });
  });

  it('answers with the reason, never a coordinate, when no fix can be read', async () => {
    getCurrentPosition.mockImplementation((_ok, fail) =>
      fail({ code: 1, message: 'User denied Geolocation' } as GeolocationPositionError),
    );
    await install();
    await request();

    expect(sendLocationResult).toHaveBeenCalledWith({
      id: 'l1',
      location: null,
      error: 'Geolocation failed (code 1): User denied Geolocation',
    });
  });

  it('stops listening when unmounted', async () => {
    await install();
    unmountAll();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});

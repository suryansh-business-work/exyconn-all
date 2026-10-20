import { LOCATION_UNAVAILABLE_MESSAGE, TrackerLocationError } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import * as Location from 'expo-location';
import { gpsLocation } from '../../../src/tracker/location';
import { logger } from '../../../src/tracker/logger';

vi.mock('../../../src/tracker/logger', () => ({ logger: { warn: vi.fn() } }));

describe('gpsLocation', () => {
  it('reads one high-accuracy GPS fix once foreground access is granted', async () => {
    await expect(gpsLocation.current()).resolves.toEqual({
      lat: 12.97,
      lng: 77.59,
      accuracyM: 12,
      source: 'GPS',
      capturedAt: '2026-09-11T04:00:00.000Z',
    });
    expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({
      accuracy: Location.Accuracy.High,
    });
  });

  it('counts a fix with no accuracy as exact rather than dropping it', async () => {
    vi.mocked(Location.getCurrentPositionAsync).mockResolvedValueOnce({
      coords: {
        latitude: 1,
        longitude: 2,
        accuracy: null,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.UTC(2026, 0, 1),
    });
    await expect(gpsLocation.current()).resolves.toMatchObject({ accuracyM: 0 });
  });

  it('refuses with the one explainable error when access is denied, logging only the status', async () => {
    vi.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValueOnce({
      granted: false,
      status: 'denied' as Location.PermissionStatus,
      canAskAgain: true,
      expires: 'never',
    });

    const read = gpsLocation.current();

    await expect(read).rejects.toBeInstanceOf(TrackerLocationError);
    await expect(read).rejects.toThrow(LOCATION_UNAVAILABLE_MESSAGE);
    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith('Location access refused', { status: 'denied' });
  });
});

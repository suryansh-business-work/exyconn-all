import * as Location from 'expo-location';
import {
  TrackerLocationError,
  type LocationProvider,
  type TrackerLocationInput,
} from '@exyconn/tracker-core';
import { logger } from './logger';

/**
 * The phone's `LocationProvider`: one foreground GPS fix, asked for each time the controller
 * needs one (the attendance pin, then the five-minute check while tracking). Only foreground
 * access is requested — the app never asks to follow the employee when it is not tracking.
 * Coordinates are never logged; only whether access was refused.
 */
export const gpsLocation: LocationProvider = {
  async current(): Promise<TrackerLocationInput> {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      logger.warn('Location access refused', { status: permission.status });
      throw new TrackerLocationError(`Location permission ${permission.status}`);
    }
    const fix = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return {
      lat: fix.coords.latitude,
      lng: fix.coords.longitude,
      accuracyM: fix.coords.accuracy ?? 0,
      source: 'GPS',
      capturedAt: new Date(fix.timestamp).toISOString(),
    };
  },
};

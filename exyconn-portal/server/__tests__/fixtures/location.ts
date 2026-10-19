import type { LocationInput } from '../../src/modules/tracker/tracker.location.service';

/** A valid GPS fix, for the calls that now pin where attendance was marked. */
export const officeFix: LocationInput = {
  lat: 12.9716,
  lng: 77.5946,
  accuracyM: 20,
  source: 'GPS',
  capturedAt: new Date('2026-01-05T09:00:00Z'),
};

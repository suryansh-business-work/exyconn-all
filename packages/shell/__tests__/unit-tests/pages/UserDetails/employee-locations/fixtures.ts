import { TrackerLocationKind, TrackerLocationSource } from '@/graphql/generated';
import type { LocationPin } from '@/pages/UserDetails/employee-locations/locations.types';

/** A day's pin; override what a test cares about. */
export function makePin(patch: Partial<LocationPin> = {}): LocationPin {
  return {
    __typename: 'TrackerLocation',
    id: 'pin-1',
    lat: 12.97,
    lng: 77.59,
    accuracyM: 18.4,
    source: TrackerLocationSource.Gps,
    kind: TrackerLocationKind.Attendance,
    capturedAt: '2026-06-15T04:00:00.000Z',
    ...patch,
  } as LocationPin;
}

export const MORNING = makePin();
export const NOON = makePin({
  id: 'pin-2',
  lat: 12.99,
  lng: 77.62,
  source: TrackerLocationSource.System,
  kind: TrackerLocationKind.Move,
  capturedAt: '2026-06-15T07:00:00.000Z',
});

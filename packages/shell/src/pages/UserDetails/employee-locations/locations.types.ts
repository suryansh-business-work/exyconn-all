import type { EmployeeLocationsQuery } from '@/graphql/generated';
import { TrackerLocationKind, TrackerLocationSource } from '@/graphql/generated';

/** One pin of the day, as `employeeLocations` returns it. */
export type LocationPin = EmployeeLocationsQuery['employeeLocations'][number];

/** Why a pin was taken, in words (the English source; translated where shown). */
export const KIND_LABEL: Readonly<Record<TrackerLocationKind, string>> = {
  [TrackerLocationKind.Attendance]: 'Attendance',
  [TrackerLocationKind.Move]: 'Moved',
};

/** Where the fix came from, in words. */
export const SOURCE_LABEL: Readonly<Record<TrackerLocationSource, string>> = {
  [TrackerLocationSource.Gps]: 'Phone GPS',
  [TrackerLocationSource.System]: 'Computer location',
};

/** The palette colour a pin wears, so attendance pins stand apart from moves. */
export type PinTone = 'success' | 'primary';

/** Which palette colour each kind of pin is drawn in, on the map and in the list. */
export const KIND_TONE: Readonly<Record<TrackerLocationKind, PinTone>> = {
  [TrackerLocationKind.Attendance]: 'success',
  [TrackerLocationKind.Move]: 'primary',
};

/** How a pin's moment is written: the time alone for one day, date and time for a month. */
export type FormatPinTime = (value: string) => string;
